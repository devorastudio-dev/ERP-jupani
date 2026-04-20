import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { NamedCategory, ProductRow } from "@/types/entities";

export async function getProductsPageData() {
  const supabase = await createClient();

  const [products, categories] = await Promise.all([
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select(
          "id, name, sale_price, estimated_cost, is_active, fulfillment_type, unit, yield_quantity, categories:product_categories(name)",
        )
        .order("name"),
      [],
    ),
    safeQuery<NamedCategory[]>(supabase.from("product_categories").select("id, name").order("name"), []),
  ]);

  return { products, categories };
}
