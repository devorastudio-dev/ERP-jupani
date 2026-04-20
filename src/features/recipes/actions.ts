"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { recipeSchema } from "@/features/recipes/schema";

export async function createRecipeAction(formData: FormData) {
  const rawItems = formData.get("items");
  let parsedItems: unknown[] = [];

  try {
    parsedItems = rawItems ? JSON.parse(String(rawItems)) : [];
  } catch {
    return { success: false, error: "Não foi possível ler os itens da ficha técnica." };
  }

  const parsed = recipeSchema.safeParse({
    product_id: formData.get("product_id"),
    packaging_cost: formData.get("packaging_cost"),
    additional_cost: formData.get("additional_cost"),
    notes: formData.get("notes"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ficha técnica inválida." };
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", parsed.data.product_id)
    .single();

  if (productError || !product) {
    return { success: false, error: "Produto não encontrado." };
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .upsert(
      {
        product_id: product.id,
        product_name: product.name,
        packaging_cost: parsed.data.packaging_cost,
        additional_cost: parsed.data.additional_cost,
        notes: parsed.data.notes,
      },
      { onConflict: "product_id" },
    )
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return { success: false, error: recipeError?.message ?? "Não foi possível salvar a ficha técnica." };
  }

  const { error: deleteError } = await supabase.from("recipe_items").delete().eq("recipe_id", recipe.id);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const itemsToInsert = parsed.data.items.map((item) => ({
    recipe_id: recipe.id,
    ingredient_id: item.ingredient_id,
    unit: item.unit,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from("recipe_items").insert(itemsToInsert);
  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/fichas-tecnicas");
  revalidatePath("/produtos");
  revalidatePath("/dashboard");

  return { success: true };
}
