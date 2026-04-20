"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { salePaymentSchema, saleSchema, saleStatusSchema } from "@/features/sales/schema";

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

  return { success: true };
}
