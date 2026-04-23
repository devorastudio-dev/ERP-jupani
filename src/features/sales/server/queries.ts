import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { CashSessionRow, ProductRow, SaleSummaryRow } from "@/types/entities";

export async function getSalesPageData() {
  const supabase = await createClient();
  const [sales, products, openCashSession] = await Promise.all([
    safeQuery<SaleSummaryRow[]>(
      supabase
        .from("sales")
        .select(`
          id,
          customer_name,
          phone,
          sale_type,
          order_type,
          status,
          subtotal_amount,
          total_amount,
          paid_amount,
          pending_amount,
          delivery_fee,
          discount_amount,
          payment_method,
          notes,
          internal_notes,
          delivery_date,
          fiscal_status,
          stock_deducted,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount_amount,
            total_price,
            notes
          ),
          sale_payments (
            id,
            payment_date,
            amount,
            payment_method,
            notes
          ),
          order_status_history (
            id,
            old_status,
            new_status,
            notes,
            created_at
          )
        `)
        .order("created_at", { ascending: false }),
      [],
    ),
    safeQuery<ProductRow[]>(
      supabase
        .from("products")
        .select("id, name, sale_price, estimated_cost, finished_stock_quantity, minimum_finished_stock, is_active, fulfillment_type, unit")
        .eq("is_active", true)
        .order("name"),
      [],
    ),
    safeQuery<CashSessionRow | null>(
      supabase
        .from("cash_sessions")
        .select("id, opened_at, closed_at, opening_balance, closing_balance, status")
        .eq("status", "aberto")
        .order("opened_at", { ascending: false })
        .maybeSingle(),
      null,
    ),
  ]);

  return { sales, products, openCashSession };
}
