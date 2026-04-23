"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";

const inventoryActionTypes = [
  "entrada_manual",
  "saida_manual",
  "ajuste",
  "inventario",
  "perda",
  "desperdicio",
] as const;

type InventoryActionType = (typeof inventoryActionTypes)[number];

function resolveDelta({
  movementType,
  quantity,
  currentStock,
}: {
  movementType: InventoryActionType;
  quantity: number;
  currentStock: number;
}) {
  switch (movementType) {
    case "entrada_manual":
      return quantity;
    case "saida_manual":
    case "perda":
    case "desperdicio":
      return -quantity;
    case "ajuste":
    case "inventario":
      return quantity - currentStock;
    default:
      return 0;
  }
}

export async function createInventoryAdjustmentAction(formData: FormData) {
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const movementType = String(formData.get("movement_type") ?? "") as InventoryActionType;
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!ingredientId) {
    return { success: false, error: "Selecione um insumo." };
  }

  if (!inventoryActionTypes.includes(movementType)) {
    return { success: false, error: "Tipo de movimentação inválido." };
  }

  if (Number.isNaN(quantity) || quantity < 0) {
    return { success: false, error: "Informe uma quantidade válida." };
  }

  if (!reason) {
    return { success: false, error: "Informe o motivo da movimentação." };
  }

  const supabase = await createClient();
  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id, name, stock_quantity, average_cost")
    .eq("id", ingredientId)
    .single();

  if (ingredientError || !ingredient) {
    return { success: false, error: ingredientError?.message ?? "Insumo não encontrado." };
  }

  const currentStock = Number(ingredient.stock_quantity ?? 0);
  const delta = resolveDelta({
    movementType,
    quantity,
    currentStock,
  });
  const nextStock = currentStock + delta;

  if (nextStock < 0) {
    return { success: false, error: "A movimentação deixaria o estoque negativo." };
  }

  const { error: updateError } = await supabase
    .from("ingredients")
    .update({
      stock_quantity: nextStock,
    })
    .eq("id", ingredientId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const storedQuantity = movementType === "ajuste" || movementType === "inventario" ? quantity : Math.abs(delta);

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    ingredient_id: ingredient.id,
    ingredient_name: ingredient.name,
    movement_type: movementType,
    quantity: storedQuantity,
    unit_cost: ingredient.average_cost,
    reason,
    reference_type: "manual_inventory",
  });

  if (movementError) {
    return { success: false, error: movementError.message };
  }

  revalidatePath("/estoque");
  revalidatePath("/insumos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  return { success: true };
}

export async function createInventoryBatchCountAction(formData: FormData) {
  const rawItems = formData.get("items");
  let items: Array<{
    ingredient_id?: string;
    counted_quantity?: number;
    reason?: string;
  }> = [];

  try {
    items = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens do inventário." };
  }

  const validItems = items.filter(
    (item) =>
      item.ingredient_id &&
      typeof item.counted_quantity === "number" &&
      !Number.isNaN(item.counted_quantity) &&
      item.counted_quantity >= 0,
  );

  if (!validItems.length) {
    return { success: false, error: "Informe ao menos um item válido para conferência." };
  }

  const supabase = await createClient();
  const ingredientIds = validItems.map((item) => String(item.ingredient_id));
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select("id, name, stock_quantity, average_cost")
    .in("id", ingredientIds);

  if (ingredientsError) {
    return { success: false, error: ingredientsError.message };
  }

  const ingredientsMap = new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient]));

  for (const item of validItems) {
    const ingredient = ingredientsMap.get(String(item.ingredient_id));
    if (!ingredient) continue;

    const countedQuantity = Number(item.counted_quantity ?? 0);
    const currentStock = Number(ingredient.stock_quantity ?? 0);

    if (countedQuantity === currentStock) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ stock_quantity: countedQuantity })
      .eq("id", ingredient.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: movementError } = await supabase.from("inventory_movements").insert({
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      movement_type: "inventario",
      quantity: countedQuantity,
      unit_cost: ingredient.average_cost,
      reason: item.reason?.trim() || "Conferência física em lote",
      reference_type: "batch_inventory_count",
    });

    if (movementError) {
      return { success: false, error: movementError.message };
    }
  }

  revalidatePath("/estoque");
  revalidatePath("/insumos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  return { success: true };
}
