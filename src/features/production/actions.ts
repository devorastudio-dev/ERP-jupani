"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { productionOrderSchema, productionStatusSchema } from "@/features/production/schema";
import { formatStockShortageMessage, validateStockForProducts } from "@/server/operations/inventory-costs";

export async function createProductionOrderAction(formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens da ordem." };
  }

  const parsed = productionOrderSchema.safeParse({
    sale_id: formData.get("sale_id"),
    deadline: formData.get("deadline"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ordem inválida." };
  }

  if (parsed.data.status === "finalizado") {
    const stockValidation = await validateStockForProducts(
      parsed.data.items.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: Number(item.quantity),
      })),
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("production_orders")
    .insert({
      sale_id: parsed.data.sale_id || null,
      deadline: parsed.data.deadline || null,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Não foi possível criar a ordem." };
  }

  const itemsPayload = parsed.data.items.map((item) => ({
    production_order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    notes: item.notes,
  }));

  const { error: itemsError } = await supabase.from("production_order_items").insert(itemsPayload);
  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/producao");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProductionOrderAction(id: string, formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens da ordem." };
  }

  const parsed = productionOrderSchema.safeParse({
    sale_id: formData.get("sale_id"),
    deadline: formData.get("deadline"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ordem inválida." };
  }

  const supabase = await createClient();
  const { data: currentOrder, error: currentError } = await supabase
    .from("production_orders")
    .select("id, stock_deducted")
    .eq("id", id)
    .single();

  if (currentError || !currentOrder) {
    return { success: false, error: currentError?.message ?? "Ordem não encontrada." };
  }

  if (currentOrder.stock_deducted) {
    return {
      success: false,
      error: "Ordens já finalizadas com baixa de estoque não podem ser editadas nesta tela.",
    };
  }

  if (parsed.data.status === "finalizado") {
    const stockValidation = await validateStockForProducts(
      parsed.data.items.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: Number(item.quantity),
      })),
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const { error: updateError } = await supabase
    .from("production_orders")
    .update({
      sale_id: parsed.data.sale_id || null,
      deadline: parsed.data.deadline || null,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { error: deleteError } = await supabase.from("production_order_items").delete().eq("production_order_id", id);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const { error: itemsError } = await supabase.from("production_order_items").insert(
    parsed.data.items.map((item) => ({
      production_order_id: id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      notes: item.notes,
    })),
  );

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/producao");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProductionOrderStatusAction(formData: FormData) {
  const parsed = productionStatusSchema.safeParse({
    order_id: formData.get("order_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Status inválido." };
  }

  const supabase = await createClient();
  const { data: orderRecord, error: orderError } = await supabase
    .from("production_orders")
    .select("id, stock_deducted")
    .eq("id", parsed.data.order_id)
    .single();

  if (orderError || !orderRecord) {
    return { success: false, error: orderError?.message ?? "Ordem não encontrada." };
  }

  if (parsed.data.status === "finalizado" && !orderRecord.stock_deducted) {
    const { data: orderItems, error: itemsError } = await supabase
      .from("production_order_items")
      .select("product_id, product_name, quantity")
      .eq("production_order_id", parsed.data.order_id);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    const stockValidation = await validateStockForProducts(
      (orderItems ?? [])
        .filter((item) => item.product_id)
        .map((item) => ({
          productId: String(item.product_id),
          productName: String(item.product_name ?? ""),
          quantity: Number(item.quantity ?? 0),
        })),
    );

    if (!stockValidation.isValid) {
      return { success: false, error: formatStockShortageMessage(stockValidation.shortages) };
    }
  }

  const { error } = await supabase
    .from("production_orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.order_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/producao");
  revalidatePath("/dashboard");
  return { success: true };
}
