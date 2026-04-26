import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { CashSessionRow, ProductRow, SaleSummaryRow } from "@/types/entities";

export type SalesSourceFilter = "all" | "site" | "manual";

export async function getSalesPageData(sourceFilter: SalesSourceFilter = "all") {
  const supabase = await createClient();
  let salesQuery = supabase
    .from("sales")
    .select(`
      id,
      order_code,
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
      external_reference,
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
    .order("created_at", { ascending: false });

  if (sourceFilter === "site") {
    salesQuery = salesQuery.eq("external_reference", "site_publico");
  }

  if (sourceFilter === "manual") {
    salesQuery = salesQuery.or("external_reference.is.null,external_reference.neq.site_publico");
  }

  const [sales, salesSources, products, openCashSession] = await Promise.all([
    safeQuery<SaleSummaryRow[]>(salesQuery, []),
    safeQuery<{ external_reference: string | null }[]>(
      supabase.from("sales").select("external_reference"),
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

  const siteOrders = salesSources.filter((sale) => sale.external_reference === "site_publico").length;
  const manualOrders = salesSources.length - siteOrders;

  return {
    sales,
    products,
    openCashSession,
    sourceSummary: {
      all: salesSources.length,
      site: siteOrders,
      manual: manualOrders,
    },
  };
}
