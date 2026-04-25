import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { NamedCategory, ProductRow, ProductStockMovementRow } from "@/types/entities";

export async function getProductsPageData() {
  const supabase = await createClient();

  const [products, categories, productStockMovements] = await Promise.all([
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select(
          "id, name, category_id, description, sale_price, estimated_cost, finished_stock_quantity, minimum_finished_stock, is_active, fulfillment_type, unit, yield_quantity, pan_shape_code, serving_reference_quantity, serving_reference_unit, estimated_servings, estimated_kcal_total, estimated_kcal_per_serving, public_ingredients_text, notes, photo_path, show_on_storefront, is_storefront_featured, is_storefront_favorite, is_storefront_healthy, categories:product_categories(name), recipes(id, theoretical_cost, recipe_items(id, ingredients(name)))",
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

  return { products, categories, productStockMovements };
}
