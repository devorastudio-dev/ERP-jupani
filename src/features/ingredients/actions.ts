"use server";

import { revalidatePath } from "next/cache";
import { ingredientSchema } from "@/features/ingredients/schema";
import { categorySchema } from "@/features/recipes/schema";
import { createClient } from "@/server/supabase/server";

function normalizeIngredientPayload(values: ReturnType<typeof ingredientSchema.parse>) {
  return {
    ...values,
    category_id: values.category_id || null,
    expiration_date: values.expiration_date || null,
    notes: values.notes?.trim() || null,
  };
}

export async function createIngredientAction(formData: FormData) {
  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    unit: formData.get("unit"),
    stock_quantity: formData.get("stock_quantity"),
    minimum_stock: formData.get("minimum_stock"),
    average_cost: formData.get("average_cost"),
    expiration_date: formData.get("expiration_date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Insumo inválido." };
  }

  const supabase = await createClient();
  const payload = normalizeIngredientPayload(parsed.data);
  const { data, error } = await supabase.from("ingredients").insert(payload).select("id, name").single();
  if (error) return { success: false, error: error.message };

  await supabase.from("inventory_movements").insert({
    ingredient_id: data.id,
    ingredient_name: data.name,
    movement_type: "entrada_manual",
    quantity: payload.stock_quantity,
    reason: "Cadastro inicial do insumo",
  });

  revalidatePath("/insumos");
  revalidatePath("/estoque");
  revalidatePath("/fichas-tecnicas");
  return { success: true };
}

export async function updateIngredientAction(id: string, formData: FormData) {
  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    unit: formData.get("unit"),
    stock_quantity: formData.get("stock_quantity"),
    minimum_stock: formData.get("minimum_stock"),
    average_cost: formData.get("average_cost"),
    expiration_date: formData.get("expiration_date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Insumo inválido." };
  }

  const supabase = await createClient();
  const payload = normalizeIngredientPayload(parsed.data);
  const { error } = await supabase.from("ingredients").update(payload).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/insumos");
  revalidatePath("/estoque");
  revalidatePath("/fichas-tecnicas");
  return { success: true };
}

export async function createIngredientCategoryAction(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Categoria inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredient_categories").insert(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/insumos");
  return { success: true };
}
