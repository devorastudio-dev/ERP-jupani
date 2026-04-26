import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { IngredientRow, ProductRow, RecipeRow } from "@/types/entities";

export async function getRecipesPageData() {
  const supabase = await createClient();
  const [recipes, products, ingredients] = await Promise.all([
    safeQuery<RecipeRow[]>(
      supabase
        .from("recipes")
        .select(`
          id,
          product_id,
          product_name,
          theoretical_cost,
          estimated_servings,
          estimated_kcal_total,
          estimated_kcal_per_serving,
          packaging_cost,
          additional_cost,
          notes,
          recipe_items (
            id,
            ingredient_id,
            unit,
            quantity,
            calculated_cost,
            ingredients (
              name,
              unit,
              nutrition_quantity,
              nutrition_unit,
              kcal_amount
            )
          ),
          recipe_packaging_items (
            id,
            ingredient_id,
            unit,
            quantity,
            calculated_cost,
            ingredients (
              name,
              unit,
              nutrition_quantity,
              nutrition_unit,
              kcal_amount
            )
          )
        `)
        .order("updated_at", { ascending: false }),
      [],
    ),
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select("id, name, unit, yield_quantity, serving_reference_quantity, serving_reference_unit, estimated_cost, estimated_servings, estimated_kcal_total, estimated_kcal_per_serving")
        .eq("is_active", true)
        .order("name"),
      [],
    ),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, unit, average_cost, stock_quantity, nutrition_quantity, nutrition_unit, kcal_amount, categories:ingredient_categories(name)")
        .order("name"),
      [],
    ),
  ]);

  return { recipes, products, ingredients };
}
