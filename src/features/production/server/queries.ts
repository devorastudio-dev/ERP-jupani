import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { ProductionOrderRow, ProductRow, SaleSummaryRow } from "@/types/entities";

export async function getProductionPageData() {
  const supabase = await createClient();
  const [orders, sales, products] = await Promise.all([
    safeQuery<ProductionOrderRow[]>(
      supabase
        .from("production_orders")
        .select(`
          id,
          sale_id,
          deadline,
          status,
          notes,
          production_order_items (
            id,
            product_id,
            product_name,
            quantity,
            notes
          )
        `)
        .order("created_at", { ascending: false }),
      [],
    ),
    safeQuery<SaleSummaryRow[]>(
      supabase
        .from("sales")
        .select("id, customer_name, status, delivery_date, total_amount, fiscal_status")
        .in("status", ["confirmado", "em_producao", "pronto"])
        .order("delivery_date", { ascending: true }),
      [],
    ),
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select("id, name, sale_price, estimated_cost, is_active, fulfillment_type, unit")
        .eq("is_active", true)
        .order("name"),
      [],
    ),
  ]);

  return { orders, sales, products };
}
