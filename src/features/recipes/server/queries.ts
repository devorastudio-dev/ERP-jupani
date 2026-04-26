import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { IngredientRow, PanShapeRow, ProductRow, RecipeRow } from "@/types/entities";

export async function getRecipesPageData() {
  const supabase = await createClient();
  const [recipes, products, ingredients, panShapes] = await Promise.all([
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
        .select("id, name, unit, yield_quantity, pan_shape_code, serving_reference_quantity, serving_reference_unit, estimated_cost, estimated_servings, estimated_kcal_total, estimated_kcal_per_serving")
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
    safeQuery<PanShapeRow[]>(
      supabase
        .from("product_pan_shapes")
        .select("code, name, estimated_servings")
        .order("name"),
      [],
    ),
  ]);

  const panShapesByCode = new Map(panShapes.map((panShape) => [panShape.code, panShape]));

  return {
    recipes,
    products: products.map((product) => ({
      ...product,
      pan_shape: product.pan_shape_code ? panShapesByCode.get(product.pan_shape_code) ?? null : null,
    })),
    ingredients,
  };
}
