"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { payableSettlementSchema, purchaseSchema } from "@/features/purchases/schema";

async function getPurchaseFinancialCategoryId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_categories")
    .select("id")
    .ilike("name", "Compra")
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

export async function createPurchaseAction(formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens da compra." };
  }

  const parsed = purchaseSchema.safeParse({
    supplier_id: formData.get("supplier_id"),
    supplier_name: formData.get("supplier_name"),
    purchase_date: formData.get("purchase_date"),
    status: formData.get("status"),
    payment_method: formData.get("payment_method"),
    notes: formData.get("notes"),
    generate_payable: formData.get("generate_payable"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Compra inválida." };
  }

  const supabase = await createClient();
  const subtotalAmount = parsed.data.items.reduce((sum, item) => sum + Number(item.total_cost ?? 0), 0);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      supplier_id: parsed.data.supplier_id,
      supplier_name: parsed.data.supplier_name,
      purchase_date: parsed.data.purchase_date,
      status: parsed.data.status,
      payment_method: parsed.data.payment_method,
      subtotal_amount: subtotalAmount,
      total_amount: subtotalAmount,
      notes: parsed.data.notes,
      generate_payable: parsed.data.generate_payable,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    return { success: false, error: purchaseError?.message ?? "Não foi possível criar a compra." };
  }

  const itemsPayload = parsed.data.items.map((item) => ({
    purchase_id: purchase.id,
    ingredient_id: item.ingredient_id,
    ingredient_name: item.ingredient_name,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    total_cost: item.total_cost,
  }));

  const { error: itemsError } = await supabase.from("purchase_items").insert(itemsPayload);
  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  if (parsed.data.generate_payable || parsed.data.status !== "recebida") {
    const { error: payableError } = await supabase.from("accounts_payable").insert({
      purchase_id: purchase.id,
      supplier_id: parsed.data.supplier_id,
      description: `Compra em ${parsed.data.supplier_name}`,
      amount: subtotalAmount,
      paid_amount: 0,
      due_date: parsed.data.purchase_date,
      status: "pendente",
      origin: "purchase",
      notes: parsed.data.notes,
    });

    if (payableError) {
      return { success: false, error: payableError.message };
    }
  }

  revalidatePath("/compras");
  revalidatePath("/caixa");
  revalidatePath("/insumos");
  revalidatePath("/estoque");

  return { success: true };
}

export async function approvePurchaseAction(formData: FormData) {
  const purchaseId = String(formData.get("purchase_id") ?? "");
  if (!purchaseId) return { success: false, error: "Compra inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchases")
    .update({ status: "recebida" })
    .eq("id", purchaseId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/compras");
  revalidatePath("/insumos");
  revalidatePath("/estoque");

  return { success: true };
}

export async function settlePayableAction(formData: FormData) {
  const parsed = payableSettlementSchema.safeParse({
    account_id: formData.get("account_id"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Baixa inválida." };
  }

  const supabase = await createClient();
  const { data: account, error: accountError } = await supabase
    .from("accounts_payable")
    .select("id, description, amount, paid_amount")
    .eq("id", parsed.data.account_id)
    .single();

  if (accountError || !account) {
    return { success: false, error: "Conta a pagar não encontrada." };
  }

  const newPaidAmount = Number(account.paid_amount ?? 0) + parsed.data.amount;
  const totalAmount = Number(account.amount ?? 0);
  const newStatus = newPaidAmount >= totalAmount ? "pago" : "parcial";

  const { error: updateError } = await supabase
    .from("accounts_payable")
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
      notes: parsed.data.notes || undefined,
    })
    .eq("id", parsed.data.account_id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const [cashSessionId, purchaseCategoryId] = await Promise.all([
    getOpenCashSessionId(),
    getPurchaseFinancialCategoryId(),
  ]);

  await supabase.from("cash_movements").insert({
    cash_session_id: cashSessionId,
    category_id: purchaseCategoryId,
    category_name: "Compra",
    movement_type: "saida",
    amount: parsed.data.amount,
    description: `Pagamento de conta: ${account.description} • ${parsed.data.payment_method}`,
    reference_type: "accounts_payable",
    reference_id: parsed.data.account_id,
  });

  revalidatePath("/caixa");
  revalidatePath("/compras");

  return { success: true };
}
