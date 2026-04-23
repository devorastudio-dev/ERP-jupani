"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { salePaymentSchema, saleSchema, saleStatusSchema } from "@/features/sales/schema";
import { formatStockShortageMessage, validateStockForProducts } from "@/server/operations/inventory-costs";
import { ensureProductionOrderForSale } from "@/server/operations/production";

async function getSaleFinancialCategoryId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_categories")
    .select("id, name")
    .ilike("name", "Venda")
    .maybeSingle();

  return data?.id ?? null;
}

async function getOpenCashSessionId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("status", "aberto")
    .order("opened_at", { ascending: false })
    .maybeSingle();

  return data?.id ?? null;
}

async function registerCashReceipt({
  amount,
  saleId,
  paymentMethod,
  description,
}: {
  amount: number;
  saleId: string;
  paymentMethod: string;
  description: string;
}) {
  if (amount <= 0) return;

  const supabase = await createClient();
  const [cashSessionId, saleCategoryId] = await Promise.all([
    getOpenCashSessionId(),
    getSaleFinancialCategoryId(),
  ]);

  await supabase.from("cash_movements").insert({
    cash_session_id: cashSessionId,
    category_id: saleCategoryId,
    category_name: "Venda",
    movement_type: "entrada",
    amount,
    description: `${description} • ${paymentMethod}`,
    reference_type: "sale_payment",
    reference_id: saleId,
  });
}

async function syncReceivableForSale({
  saleId,
  customerName,
  dueDate,
  totalAmount,
  receivedAmount,
  notes,
}: {
  saleId: string;
  customerName: string;
  dueDate: string;
  totalAmount: number;
  receivedAmount: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const pendingAmount = Math.max(totalAmount - receivedAmount, 0);
  const status = pendingAmount <= 0 ? "pago" : receivedAmount > 0 ? "parcial" : "pendente";

  const { data: existingReceivable } = await supabase
    .from("accounts_receivable")
    .select("id")
    .eq("sale_id", saleId)
    .maybeSingle();

  const payload = {
    sale_id: saleId,
    description: `Recebimento do pedido ${customerName}`,
    amount: totalAmount,
    received_amount: receivedAmount,
    due_date: dueDate,
    status,
    origin: "sale",
    notes,
  };

  if (existingReceivable?.id) {
    await supabase.from("accounts_receivable").update(payload).eq("id", existingReceivable.id);
    return;
  }

  if (totalAmount > 0) {
    await supabase.from("accounts_receivable").insert(payload);
  }
}

export async function createSaleAction(formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens do pedido." };
  }

  const parsed = saleSchema.safeParse({
    sale_type: formData.get("sale_type"),
    order_type: formData.get("order_type"),
    customer_name: formData.get("customer_name"),
    phone: formData.get("phone"),
    status: formData.get("status"),
    delivery_date: formData.get("delivery_date"),
    delivery_fee: formData.get("delivery_fee"),
    discount_amount: formData.get("discount_amount"),
    payment_method: formData.get("payment_method"),
    initial_payment_amount: formData.get("initial_payment_amount"),
    notes: formData.get("notes"),
    internal_notes: formData.get("internal_notes"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Pedido inválido." };
  }

  if (["confirmado", "em_producao", "pronto", "entregue"].includes(parsed.data.status)) {
    const stockValidation = await validateStockForProducts(
      parsed.data.items.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: Number(item.quantity),
      })),
      "sale",
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const supabase = await createClient();
  const subtotalAmount = parsed.data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price) - Number(item.discount_amount ?? 0),
    0,
  );
  const totalAmount = subtotalAmount + Number(parsed.data.delivery_fee) - Number(parsed.data.discount_amount);
  const initialPayment = Number(parsed.data.initial_payment_amount ?? 0);
  const pendingAmount = Math.max(totalAmount - initialPayment, 0);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      sale_type: parsed.data.sale_type,
      order_type: parsed.data.order_type,
      status: parsed.data.status,
      delivery_date: parsed.data.delivery_date,
      subtotal_amount: subtotalAmount,
      discount_amount: parsed.data.discount_amount,
      delivery_fee: parsed.data.delivery_fee,
      total_amount: totalAmount,
      paid_amount: initialPayment,
      pending_amount: pendingAmount,
      payment_method: parsed.data.payment_method,
      notes: parsed.data.notes,
      internal_notes: parsed.data.internal_notes,
      fiscal_status: "nao_emitido",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    return { success: false, error: saleError?.message ?? "Não foi possível criar o pedido." };
  }

  const saleItemsPayload = parsed.data.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    total_price: item.total_price,
    notes: item.notes,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsPayload);
  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  await supabase.from("order_status_history").insert({
    sale_id: sale.id,
    old_status: null,
    new_status: parsed.data.status,
    notes: "Pedido criado",
    created_by: user?.id ?? null,
  });

  if (totalAmount > 0) {
    await supabase.from("accounts_receivable").insert({
      sale_id: sale.id,
      description: `Recebimento do pedido ${parsed.data.customer_name}`,
      amount: totalAmount,
      received_amount: initialPayment,
      due_date: parsed.data.delivery_date,
      status: pendingAmount <= 0 ? "pago" : initialPayment > 0 ? "parcial" : "pendente",
      origin: "sale",
      notes: parsed.data.notes,
    });
  }

  if (initialPayment > 0 && parsed.data.payment_method) {
    const { error: paymentError } = await supabase.from("sale_payments").insert({
      sale_id: sale.id,
      amount: initialPayment,
      payment_method: parsed.data.payment_method,
      notes: "Pagamento inicial do pedido",
    });

    if (paymentError) {
      return { success: false, error: paymentError.message };
    }

    await registerCashReceipt({
      amount: initialPayment,
      saleId: sale.id,
      paymentMethod: parsed.data.payment_method,
      description: `Recebimento inicial de pedido ${parsed.data.customer_name}`,
    });
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/caixa");
  revalidatePath("/producao");

  await ensureProductionOrderForSale(sale.id);

  return { success: true };
}

export async function updateSaleAction(id: string, formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens do pedido." };
  }

  const parsed = saleSchema.safeParse({
    sale_type: formData.get("sale_type"),
    order_type: formData.get("order_type"),
    customer_name: formData.get("customer_name"),
    phone: formData.get("phone"),
    status: formData.get("status"),
    delivery_date: formData.get("delivery_date"),
    delivery_fee: formData.get("delivery_fee"),
    discount_amount: formData.get("discount_amount"),
    payment_method: formData.get("payment_method"),
    initial_payment_amount: formData.get("initial_payment_amount"),
    notes: formData.get("notes"),
    internal_notes: formData.get("internal_notes"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Pedido inválido." };
  }

  const supabase = await createClient();
  const { data: currentSale, error: currentSaleError } = await supabase
    .from("sales")
    .select("id, status, stock_deducted, paid_amount")
    .eq("id", id)
    .single();

  if (currentSaleError || !currentSale) {
    return { success: false, error: currentSaleError?.message ?? "Pedido não encontrado." };
  }

  if (currentSale.stock_deducted) {
    return {
      success: false,
      error: "Pedidos com estoque já baixado não podem ser editados nesta tela. Use mudança de status e ajustes operacionais.",
    };
  }

  if (["confirmado", "em_producao", "pronto", "entregue"].includes(parsed.data.status)) {
    const stockValidation = await validateStockForProducts(
      parsed.data.items.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: Number(item.quantity),
      })),
      "sale",
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const subtotalAmount = parsed.data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price) - Number(item.discount_amount ?? 0),
    0,
  );
  const totalAmount = subtotalAmount + Number(parsed.data.delivery_fee) - Number(parsed.data.discount_amount);
  const paidAmount = Number(currentSale.paid_amount ?? 0);
  const pendingAmount = Math.max(totalAmount - paidAmount, 0);

  if (totalAmount < paidAmount) {
    return { success: false, error: "O total do pedido não pode ficar menor que o valor já recebido." };
  }

  const { error: updateError } = await supabase
    .from("sales")
    .update({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      sale_type: parsed.data.sale_type,
      order_type: parsed.data.order_type,
      status: parsed.data.status,
      delivery_date: parsed.data.delivery_date,
      subtotal_amount: subtotalAmount,
      discount_amount: parsed.data.discount_amount,
      delivery_fee: parsed.data.delivery_fee,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_method: parsed.data.payment_method,
      notes: parsed.data.notes,
      internal_notes: parsed.data.internal_notes,
    })
    .eq("id", id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", id);
  if (deleteItemsError) {
    return { success: false, error: deleteItemsError.message };
  }

  const { error: insertItemsError } = await supabase.from("sale_items").insert(
    parsed.data.items.map((item) => ({
      sale_id: id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      total_price: item.total_price,
      notes: item.notes,
    })),
  );

  if (insertItemsError) {
    return { success: false, error: insertItemsError.message };
  }

  if (currentSale.status !== parsed.data.status) {
    await supabase.from("order_status_history").insert({
      sale_id: id,
      old_status: currentSale.status,
      new_status: parsed.data.status,
      notes: "Status ajustado na edição do pedido",
    });
  }

  await syncReceivableForSale({
    saleId: id,
    customerName: parsed.data.customer_name,
    dueDate: parsed.data.delivery_date,
    totalAmount,
    receivedAmount: paidAmount,
    notes: parsed.data.notes,
  });

  await ensureProductionOrderForSale(id);

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/producao");
  revalidatePath("/caixa");

  return { success: true };
}

export async function addSalePaymentAction(formData: FormData) {
  const parsed = salePaymentSchema.safeParse({
    sale_id: formData.get("sale_id"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Pagamento inválido." };
  }

  const supabase = await createClient();
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id, customer_name")
    .eq("id", parsed.data.sale_id)
    .single();

  if (saleError || !sale) {
    return { success: false, error: "Pedido não encontrado." };
  }

  const { error } = await supabase.from("sale_payments").insert({
    sale_id: parsed.data.sale_id,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method,
    notes: parsed.data.notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await registerCashReceipt({
    amount: parsed.data.amount,
    saleId: parsed.data.sale_id,
    paymentMethod: parsed.data.payment_method,
    description: `Recebimento complementar de pedido ${sale.customer_name ?? ""}`.trim(),
  });

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/caixa");

  return { success: true };
}

export async function updateSaleStatusAction(formData: FormData) {
  const parsed = saleStatusSchema.safeParse({
    sale_id: formData.get("sale_id"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Status inválido." };
  }

  const supabase = await createClient();
  const { data: saleRecord, error: saleError } = await supabase
    .from("sales")
    .select("id, stock_deducted")
    .eq("id", parsed.data.sale_id)
    .single();

  if (saleError || !saleRecord) {
    return { success: false, error: saleError?.message ?? "Pedido não encontrado." };
  }

  if (["confirmado", "em_producao", "pronto", "entregue"].includes(parsed.data.status) && !saleRecord.stock_deducted) {
    const { data: saleItems, error: itemsError } = await supabase
      .from("sale_items")
      .select("product_id, product_name, quantity")
      .eq("sale_id", parsed.data.sale_id);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    const stockValidation = await validateStockForProducts(
      (saleItems ?? [])
        .filter((item) => item.product_id)
        .map((item) => ({
          productId: String(item.product_id),
          productName: String(item.product_name ?? ""),
          quantity: Number(item.quantity ?? 0),
        })),
      "sale",
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const { error } = await supabase
    .from("sales")
    .update({
      status: parsed.data.status,
      internal_notes: parsed.data.notes || undefined,
    })
    .eq("id", parsed.data.sale_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
  revalidatePath("/producao");

  await ensureProductionOrderForSale(parsed.data.sale_id);

  return { success: true };
}
