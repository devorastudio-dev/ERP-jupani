import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import { calculateCoverageDays, calculateReplenishmentGap, calculateTurnover } from "@/lib/stock-metrics";
import type {
  EmployeePaymentRow,
  IngredientRow,
  InventoryMovementRow,
  PurchaseRow,
  ReportExpenseRow,
  ReportSaleByProductRow,
  SaleSummaryRow,
} from "@/types/entities";

export async function getReportsPageData({ start, end }: { start?: string; end?: string } = {}) {
  const supabase = await createClient();

  let saleItemsQuery = supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, total_price, products:products(estimated_cost)")
    .limit(200);

  let salesQuery = supabase
    .from("sales")
    .select("id, customer_name, status, total_amount, paid_amount, pending_amount, delivery_date, fiscal_status")
    .order("delivery_date", { ascending: false })
    .limit(30);

  let purchasesQuery = supabase
    .from("purchases")
    .select("id, purchase_date, supplier_name, total_amount, status, payment_method")
    .order("purchase_date", { ascending: false })
    .limit(10);

  if (start) {
    salesQuery = salesQuery.gte("delivery_date", `${start}T00:00:00`);
    purchasesQuery = purchasesQuery.gte("purchase_date", start);
    saleItemsQuery = saleItemsQuery.gte("created_at", `${start}T00:00:00`);
  }

  if (end) {
    salesQuery = salesQuery.lte("delivery_date", `${end}T23:59:59`);
    purchasesQuery = purchasesQuery.lte("purchase_date", end);
    saleItemsQuery = saleItemsQuery.lte("created_at", `${end}T23:59:59`);
  }

  const [saleItems, expensesByCategory, employeePayments, sales, inventoryMovements, purchases, criticalIngredients, products] = await Promise.all([
    safeQuery<
      Array<{
        product_id?: string | null;
        product_name: string;
        quantity: number | null;
        total_price: number | null;
        products?: { estimated_cost?: number | null } | Array<{ estimated_cost?: number | null }> | null;
      }>
    >(
      saleItemsQuery.order("quantity", { ascending: false }),
      [],
    ),
    safeQuery<ReportExpenseRow[]>(
      supabase
        .from("cash_movements")
        .select("category_name, amount, movement_type")
        .eq("movement_type", "saida"),
      [],
    ),
    safeQuery<EmployeePaymentRow[]>(
      supabase
        .from("employee_payments")
        .select("employee_name, amount, payment_type, payment_date")
        .order("payment_date", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<SaleSummaryRow[]>(
      salesQuery,
      [],
    ),
    safeQuery<InventoryMovementRow[]>(
      supabase
        .from("inventory_movements")
        .select("id, ingredient_name, movement_type, quantity, created_at, reason")
        .order("created_at", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<PurchaseRow[]>(
      purchasesQuery,
      [],
    ),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, unit, stock_quantity, minimum_stock, average_cost")
        .order("name"),
      [],
    ),
    safeQuery<Array<{
      id: string;
      name: string;
      unit: string;
      fulfillment_type?: string | null;
      finished_stock_quantity?: number | null;
      minimum_finished_stock?: number | null;
    }>>(
      supabase
        .from("products")
        .select("id, name, unit, fulfillment_type, finished_stock_quantity, minimum_finished_stock")
        .eq("is_active", true)
        .order("name"),
      [],
    ),
  ]);

  const salesByProductMap = new Map<string, ReportSaleByProductRow>();

  for (const item of saleItems) {
    const relatedProduct = Array.isArray(item.products) ? item.products[0] : item.products;
    const quantity = Number(item.quantity ?? 0);
    const grossRevenue = Number(item.total_price ?? 0);
    const estimatedUnitCost = Number(relatedProduct?.estimated_cost ?? 0);
    const estimatedTotalCost = quantity * estimatedUnitCost;
    const estimatedMargin = grossRevenue - estimatedTotalCost;
    const key = item.product_id ?? item.product_name;
    const current = salesByProductMap.get(key);

    salesByProductMap.set(key, {
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      quantity: Number(current?.quantity ?? 0) + quantity,
      total_price: Number(current?.total_price ?? 0) + grossRevenue,
      estimated_cost: estimatedUnitCost,
      gross_revenue: Number(current?.gross_revenue ?? 0) + grossRevenue,
      estimated_total_cost: Number(current?.estimated_total_cost ?? 0) + estimatedTotalCost,
      estimated_margin: Number(current?.estimated_margin ?? 0) + estimatedMargin,
      margin_percent:
        Number(current?.gross_revenue ?? 0) + grossRevenue > 0
          ? ((Number(current?.estimated_margin ?? 0) + estimatedMargin) / (Number(current?.gross_revenue ?? 0) + grossRevenue)) * 100
          : 0,
    });
  }

  const salesByProduct = [...salesByProductMap.values()]
    .sort((a, b) => Number(b.gross_revenue ?? 0) - Number(a.gross_revenue ?? 0))
    .slice(0, 10);

  const lowStock = criticalIngredients
    .filter((ingredient) => Number(ingredient.stock_quantity ?? 0) < Number(ingredient.minimum_stock ?? 0))
    .sort(
      (a, b) =>
        Number(a.stock_quantity ?? 0) / Math.max(Number(a.minimum_stock ?? 1), 1) -
        Number(b.stock_quantity ?? 0) / Math.max(Number(b.minimum_stock ?? 1), 1),
    )
    .slice(0, 10);

  const periodStart = start ? new Date(`${start}T00:00:00`) : null;
  const periodEnd = end ? new Date(`${end}T23:59:59`) : null;
  const periodDays =
    periodStart && periodEnd
      ? Math.max(Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1)
      : 30;

  const finishedGoodsInsights = salesByProduct
    .map((item) => {
      const product = products.find((entry) => entry.id === item.product_id);
      return {
        ...item,
        turnover: calculateTurnover(Number(item.quantity ?? 0), Number(product?.finished_stock_quantity ?? 0)),
        coverage_days: calculateCoverageDays(Number(item.quantity ?? 0), Number(product?.finished_stock_quantity ?? 0), periodDays),
      };
    })
    .filter((item) => item.turnover !== null || item.coverage_days !== null);

  const ingredientReplenishment = criticalIngredients
    .map((ingredient) => ({
      ...ingredient,
      replenishment_gap: calculateReplenishmentGap(ingredient.stock_quantity, ingredient.minimum_stock),
    }))
    .filter((ingredient) => Number((ingredient as typeof ingredient & { replenishment_gap: number }).replenishment_gap) > 0)
    .sort((a, b) => Number((b as typeof b & { replenishment_gap: number }).replenishment_gap) - Number((a as typeof a & { replenishment_gap: number }).replenishment_gap))
    .slice(0, 10);

  const finishedGoodsReplenishment = products
    .filter((product) => product.fulfillment_type === "pronta_entrega")
    .map((product) => ({
      ...product,
      replenishment_gap: calculateReplenishmentGap(product.finished_stock_quantity, product.minimum_finished_stock),
    }))
    .filter((product) => Number((product as typeof product & { replenishment_gap: number }).replenishment_gap) > 0)
    .sort((a, b) => Number((b as typeof b & { replenishment_gap: number }).replenishment_gap) - Number((a as typeof a & { replenishment_gap: number }).replenishment_gap))
    .slice(0, 10);

  return {
    salesByProduct,
    expensesByCategory,
    employeePayments,
    sales,
    lowStock,
    purchases,
    inventoryMovements,
    finishedGoodsInsights,
    ingredientReplenishment,
    finishedGoodsReplenishment,
    periodDays,
  };
}
