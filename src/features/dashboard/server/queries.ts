import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type {
  DashboardSaleRow,
  IngredientRow,
  PayableRow,
  ReceivableRow,
  TopProductRow,
} from "@/types/entities";

export async function getDashboardData() {
  const supabase = await createClient();

  const [sales, payables, receivables, inventoryLow, topProducts] = await Promise.all([
    safeQuery<DashboardSaleRow[]>(
      supabase
        .from("sales")
        .select("id, total_amount, delivery_date, status")
        .order("created_at", { ascending: false })
        .limit(30),
      [],
    ),
    safeQuery<PayableRow[]>(supabase.from("accounts_payable").select("id, amount, due_date, status"), []),
    safeQuery<ReceivableRow[]>(supabase.from("accounts_receivable").select("id, amount, due_date, status"), []),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, stock_quantity, minimum_stock")
        .lte("stock_quantity", 10)
        .limit(8),
      [],
    ),
    safeQuery<TopProductRow[]>(
      supabase
        .from("sale_items")
        .select("product_name, quantity")
        .order("quantity", { ascending: false })
        .limit(5),
      [],
    ),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const salesToday = sales
    .filter((sale) => String(sale.delivery_date ?? "").startsWith(today))
    .reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
  const salesMonth = sales
    .filter((sale) => String(sale.delivery_date ?? "").startsWith(currentMonth))
    .reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);

  return {
    metrics: {
      salesToday,
      salesMonth,
      openOrders: sales.filter((sale) => ["confirmado", "aguardando_confirmacao"].includes(String(sale.status))).length,
      inProduction: sales.filter((sale) => sale.status === "em_producao").length,
      payablesSoon: payables.filter((entry) => entry.status !== "pago").length,
      receivables: receivables.filter((entry) => entry.status !== "pago").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0),
      lowStock: inventoryLow.length,
      estimatedProfit: salesMonth * 0.34,
    },
    salesHistory: sales.slice(0, 7).reverse(),
    topProducts,
    inventoryLow,
  };
}
