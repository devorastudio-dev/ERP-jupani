import { createClient } from "@/server/supabase/server";

type ProductDemand = {
  productId: string;
  productName: string;
  quantity: number;
};

type IngredientRequirement = {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  requiredQuantity: number;
  availableQuantity: number;
  averageCost: number;
};

type ProductRecipeRecord = {
  product_id: string;
  product_name: string;
  recipe_items: Array<{
    quantity: number | null;
    ingredients:
      | {
          id: string;
          name: string;
          unit: string | null;
          stock_quantity: number | null;
          average_cost: number | null;
        }
      | Array<{
          id: string;
          name: string;
          unit: string | null;
          stock_quantity: number | null;
          average_cost: number | null;
        }>
      | null;
  }>;
  recipe_packaging_items: Array<{
    quantity: number | null;
    ingredients:
      | {
          id: string;
          name: string;
          unit: string | null;
          stock_quantity: number | null;
          average_cost: number | null;
        }
      | Array<{
          id: string;
          name: string;
          unit: string | null;
          stock_quantity: number | null;
          average_cost: number | null;
        }>
      | null;
  }>;
};

export type StockValidationResult = {
  isValid: boolean;
  shortages: IngredientRequirement[];
};

type StockValidationMode = "sale" | "production";

function normalizeIngredient(
  ingredient:
    | ProductRecipeRecord["recipe_items"][number]["ingredients"]
    | ProductRecipeRecord["recipe_packaging_items"][number]["ingredients"]
    | undefined,
) {
  if (!ingredient) return null;
  return Array.isArray(ingredient) ? ingredient[0] ?? null : ingredient;
}

export async function validateStockForProducts(
  demands: ProductDemand[],
  mode: StockValidationMode = "production",
): Promise<StockValidationResult> {
  const normalizedDemands = demands
    .filter((entry) => entry.productId && Number(entry.quantity) > 0)
    .map((entry) => ({
      productId: entry.productId,
      productName: entry.productName,
      quantity: Number(entry.quantity),
    }));

  if (!normalizedDemands.length) {
    return { isValid: true, shortages: [] };
  }

  const supabase = await createClient();
  const productIds = [...new Set(normalizedDemands.map((entry) => entry.productId))];

  const [{ data: products, error: productsError }, { data, error }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, fulfillment_type, unit, finished_stock_quantity")
      .in("id", productIds),
    supabase
    .from("recipes")
    .select(`
      product_id,
      product_name,
      recipe_items (
        quantity,
        ingredients (
          id,
          name,
          unit,
          stock_quantity,
          average_cost
        )
      ),
      recipe_packaging_items (
        quantity,
        ingredients (
          id,
          name,
          unit,
          stock_quantity,
          average_cost
        )
      )
    `)
    .in("product_id", productIds),
  ]);

  if (productsError) {
    return {
      isValid: false,
      shortages: [
        {
          ingredientId: "product-query-error",
          ingredientName: productsError.message,
          unit: "",
          requiredQuantity: 0,
          availableQuantity: 0,
          averageCost: 0,
        },
      ],
    };
  }

  if (error) {
    return {
      isValid: false,
      shortages: [
        {
          ingredientId: "stock-query-error",
          ingredientName: error.message,
          unit: "",
          requiredQuantity: 0,
          availableQuantity: 0,
          averageCost: 0,
        },
      ],
    };
  }

  const productsById = new Map(
    (products ?? []).map((product) => [
      String(product.id),
      {
        id: String(product.id),
        name: String(product.name ?? ""),
        fulfillment_type: String(product.fulfillment_type ?? ""),
        unit: String(product.unit ?? ""),
        finished_stock_quantity: Number(product.finished_stock_quantity ?? 0),
      },
    ]),
  );
  const recipes = (data ?? []) as ProductRecipeRecord[];
  const recipesByProduct = new Map(recipes.map((recipe) => [recipe.product_id, recipe]));
  const aggregatedRequirements = new Map<string, IngredientRequirement>();

  for (const demand of normalizedDemands) {
    const product = productsById.get(demand.productId);
    const recipe = recipesByProduct.get(demand.productId);
    if (mode === "sale" && product?.fulfillment_type === "pronta_entrega") {
      const availableQuantity = Number(product.finished_stock_quantity ?? 0);
      if (availableQuantity < demand.quantity) {
        aggregatedRequirements.set(`product:${demand.productId}`, {
          ingredientId: `product:${demand.productId}`,
          ingredientName: demand.productName,
          unit: product.unit ?? "",
          requiredQuantity: demand.quantity,
          availableQuantity,
          averageCost: 0,
        });
      }
      continue;
    }

    if (!recipe?.recipe_items?.length) {
      continue;
    }

    for (const item of recipe.recipe_items) {
      const ingredient = normalizeIngredient(item.ingredients);
      if (!ingredient?.id) continue;

      const requiredQuantity = Number(item.quantity ?? 0) * demand.quantity;
      const current = aggregatedRequirements.get(ingredient.id);

      aggregatedRequirements.set(ingredient.id, {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        unit: ingredient.unit ?? "",
        requiredQuantity: Number(current?.requiredQuantity ?? 0) + requiredQuantity,
        availableQuantity: Number(current?.availableQuantity ?? ingredient.stock_quantity ?? 0),
        averageCost: Number(ingredient.average_cost ?? 0),
      });
    }

    for (const item of recipe.recipe_packaging_items ?? []) {
      const ingredient = normalizeIngredient(item.ingredients);
      if (!ingredient?.id) continue;

      const requiredQuantity = Number(item.quantity ?? 0) * demand.quantity;
      const current = aggregatedRequirements.get(ingredient.id);

      aggregatedRequirements.set(ingredient.id, {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        unit: ingredient.unit ?? "",
        requiredQuantity: Number(current?.requiredQuantity ?? 0) + requiredQuantity,
        availableQuantity: Number(current?.availableQuantity ?? ingredient.stock_quantity ?? 0),
        averageCost: Number(ingredient.average_cost ?? 0),
      });
    }
  }

  const shortages = [...aggregatedRequirements.values()].filter(
    (entry) => Number(entry.availableQuantity) < Number(entry.requiredQuantity),
  );

  return {
    isValid: shortages.length === 0,
    shortages,
  };
}

export function formatStockShortageMessage(shortages: IngredientRequirement[]) {
  if (!shortages.length) return "Estoque insuficiente para concluir a operação.";

  const topItems = shortages.slice(0, 4).map((entry) => {
    const missing = Math.max(Number(entry.requiredQuantity) - Number(entry.availableQuantity), 0);
    return `${entry.ingredientName}: faltam ${missing.toFixed(3)} ${entry.unit}`.trim();
  });

  return `Estoque insuficiente para concluir a operação. ${topItems.join(" | ")}`;
}
