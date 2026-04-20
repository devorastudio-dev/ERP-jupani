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
              unit
            )
          )
        `)
        .order("updated_at", { ascending: false }),
      [],
    ),
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select("id, name, unit, estimated_cost")
        .eq("is_active", true)
        .order("name"),
      [],
    ),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, unit, average_cost, stock_quantity")
        .order("name"),
      [],
    ),
  ]);

  return { recipes, products, ingredients };
}
