import "server-only";

import { createClient } from "@/server/supabase/server";
import { calculateRecipeNutrition } from "@/features/recipes/lib/nutrition";

type RecipeMetricsRow = {
  id: string;
  product_id: string;
  recipe_items: Array<{
    ingredient_id: string;
    unit: string;
    quantity: number | null;
    ingredients: {
      unit?: string | null;
      nutrition_quantity?: number | null;
      nutrition_unit?: string | null;
      kcal_amount?: number | null;
    } | null;
  }> | null;
};

type ProductMetricsRow = {
  id: string;
  yield_quantity: number | null;
  unit: string;
  pan_shape_code: string | null;
  serving_reference_quantity: number | null;
  serving_reference_unit: string | null;
};

export async function recalculateRecipeAndProductMetrics(recipeId: string) {
  const supabase = await createClient();
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select(`
      id,
      product_id,
      recipe_items (
        ingredient_id,
        unit,
        quantity,
        ingredients (
          unit,
          nutrition_quantity,
          nutrition_unit,
          kcal_amount
        )
      )
    `)
    .eq("id", recipeId)
    .single<RecipeMetricsRow>();

  if (recipeError || !recipe) {
    throw new Error(recipeError?.message ?? "Não foi possível recalcular a ficha técnica.");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, yield_quantity, unit, pan_shape_code, serving_reference_quantity, serving_reference_unit")
    .eq("id", recipe.product_id)
    .single<ProductMetricsRow>();

  if (productError || !product) {
    throw new Error(productError?.message ?? "Produto da ficha técnica não encontrado.");
  }

  const ingredientsMap = new Map(
    (recipe.recipe_items ?? []).map((item) => [item.ingredient_id, item.ingredients ?? {}]),
  );

  const metrics = calculateRecipeNutrition({
    items: (recipe.recipe_items ?? []).map((item) => ({
      ingredient_id: item.ingredient_id,
      unit: item.unit,
      quantity: Number(item.quantity ?? 0),
    })),
    ingredientsMap,
    yieldQuantity: Number(product.yield_quantity ?? 0),
    yieldUnit: product.unit,
    panShapeCode: product.pan_shape_code,
    servingReferenceQuantity: Number(product.serving_reference_quantity ?? 0),
    servingReferenceUnit: product.serving_reference_unit,
  });

  const recipePayload = {
    estimated_servings: metrics.estimatedServings,
    estimated_kcal_total: metrics.estimatedKcalTotal,
    estimated_kcal_per_serving: metrics.estimatedKcalPerServing,
  };

  const productPayload = {
    estimated_servings: metrics.estimatedServings,
    estimated_kcal_total: metrics.estimatedKcalTotal,
    estimated_kcal_per_serving: metrics.estimatedKcalPerServing,
  };

  const { error: updateRecipeError } = await supabase.from("recipes").update(recipePayload).eq("id", recipeId);
  if (updateRecipeError) {
    throw new Error(updateRecipeError.message);
  }

  const { error: updateProductError } = await supabase.from("products").update(productPayload).eq("id", product.id);
  if (updateProductError) {
    throw new Error(updateProductError.message);
  }

  return metrics;
}

export async function recalculateMetricsByIngredient(ingredientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_items")
    .select("recipe_id")
    .eq("ingredient_id", ingredientId);

  if (error) {
    throw new Error(error.message);
  }

  const recipeIds = [...new Set((data ?? []).map((item) => item.recipe_id).filter(Boolean))];
  await Promise.all(recipeIds.map((recipeId) => recalculateRecipeAndProductMetrics(recipeId)));
}
