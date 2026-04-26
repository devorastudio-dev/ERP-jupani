import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { NamedCategory, ProductRow, ProductStockMovementRow } from "@/types/entities";

type ProductQueryRow = Omit<ProductRow, "categories" | "category_ids"> & {
  product_category_links?: Array<{
    category_id: string;
    product_categories?: Array<{
      id: string;
      name: string;
    }> | null;
  }> | null;
};

const mapProductCategories = (product: ProductQueryRow): ProductRow => {
  const categories =
    product.product_category_links
      ?.flatMap((link) => link.product_categories ?? [])
      .filter((category): category is { id: string; name: string } => Boolean(category?.id && category?.name)) ?? [];

  return {
    ...product,
    categories,
    category_ids: categories.map((category) => category.id),
  };
};

export async function getProductsPageData() {
  const supabase = await createClient();

  const [products, categories, productStockMovements] = await Promise.all([
    safeQuery<ProductQueryRow[]>(
      supabase
        .from("products")
        .select(
          "id, name, category_id, description, sale_price, estimated_cost, finished_stock_quantity, minimum_finished_stock, is_active, fulfillment_type, unit, yield_quantity, pan_shape_code, serving_reference_quantity, serving_reference_unit, estimated_servings, estimated_kcal_total, estimated_kcal_per_serving, public_ingredients_text, notes, photo_path, show_on_storefront, is_storefront_featured, is_storefront_favorite, is_storefront_healthy, product_category_links(category_id, product_categories(id, name)), recipes(id, theoretical_cost, recipe_items(id, ingredients(name)))",
        )
        .order("name"),
      [],
    ),
    safeQuery<NamedCategory[]>(supabase.from("product_categories").select("id, name").order("name"), []),
    safeQuery<ProductStockMovementRow[]>(
      supabase
        .from("product_stock_movements")
        .select("id, product_id, product_name, movement_type, quantity, reason, reference_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      [],
    ),
  ]);

  const normalizedProducts = products.map(mapProductCategories);
  const categoryUsage = new Map<string, number>();

  for (const product of normalizedProducts) {
    for (const category of product.categories ?? []) {
      categoryUsage.set(category.id, (categoryUsage.get(category.id) ?? 0) + 1);
    }
  }

  return {
    products: normalizedProducts,
    categories: categories.map((category) => ({
      ...category,
      usage_count: categoryUsage.get(category.id) ?? 0,
    })),
    productStockMovements,
  };
}
