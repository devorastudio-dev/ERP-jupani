"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { productionOrderSchema, productionStatusSchema } from "@/features/production/schema";

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

export async function updateProductionOrderStatusAction(formData: FormData) {
  const parsed = productionStatusSchema.safeParse({
    order_id: formData.get("order_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Status inválido." };
  }

  const supabase = await createClient();
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
