import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type {
  DashboardSaleRow,
  IngredientRow,
  PayableRow,
  ReceivableRow,
  TopProductRow,
} from "@/types/entities";

export async function getDashboardData({ start, end }: { start?: string; end?: string } = {}) {
  const supabase = await createClient();

  let salesQuery = supabase
    .from("sales")
    .select("id, total_amount, delivery_date, status")
    .order("created_at", { ascending: false })
    .limit(30);

  let saleItemsQuery = supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, total_price, products:products(estimated_cost)")
    .limit(150);

  if (start) {
    salesQuery = salesQuery.gte("delivery_date", `${start}T00:00:00`);
    saleItemsQuery = saleItemsQuery.gte("created_at", `${start}T00:00:00`);
  }

  if (end) {
    salesQuery = salesQuery.lte("delivery_date", `${end}T23:59:59`);
    saleItemsQuery = saleItemsQuery.lte("created_at", `${end}T23:59:59`);
  }

  const [sales, payables, receivables, ingredients, saleItems, products] = await Promise.all([
    safeQuery<DashboardSaleRow[]>(
      salesQuery,
      [],
    ),
    safeQuery<PayableRow[]>(supabase.from("accounts_payable").select("id, amount, due_date, status"), []),
    safeQuery<ReceivableRow[]>(supabase.from("accounts_receivable").select("id, amount, due_date, status"), []),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, stock_quantity, minimum_stock, unit, average_cost, expiration_date")
        .order("name"),
      [],
    ),
    safeQuery<
      Array<{
        product_id?: string | null;
        product_name: string;
        quantity: number | null;
        total_price: number | null;
        products?: { estimated_cost?: number | null } | Array<{ estimated_cost?: number | null }> | null;
      }>
    >(
      saleItemsQuery,
      [],
    ),
    safeQuery<
      Array<{
        id: string;
        name: string;
        sale_price: number | null;
        estimated_cost: number | null;
        fulfillment_type?: string | null;
        unit?: string | null;
        finished_stock_quantity?: number | null;
        minimum_finished_stock?: number | null;
      }>
    >(
      supabase
        .from("products")
        .select("id, name, sale_price, estimated_cost, fulfillment_type, unit, finished_stock_quantity, minimum_finished_stock")
        .eq("is_active", true)
        .order("name"),
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

  const inventoryLow = ingredients
    .filter((ingredient) => Number(ingredient.stock_quantity ?? 0) < Number(ingredient.minimum_stock ?? 0))
    .sort(
      (a, b) =>
        Number(a.stock_quantity ?? 0) / Math.max(Number(a.minimum_stock ?? 1), 1) -
        Number(b.stock_quantity ?? 0) / Math.max(Number(b.minimum_stock ?? 1), 1),
    )
    .slice(0, 8);

  const topProductMap = new Map<string, TopProductRow>();

  for (const item of saleItems) {
    const relatedProduct = Array.isArray(item.products) ? item.products[0] : item.products;
    const quantity = Number(item.quantity ?? 0);
    const revenue = Number(item.total_price ?? 0);
    const estimatedMargin = revenue - quantity * Number(relatedProduct?.estimated_cost ?? 0);
    const key = item.product_id ?? item.product_name;
    const current = topProductMap.get(key);
    const nextRevenue = Number(current?.total_price ?? 0) + revenue;
    const nextMargin = Number(current?.estimated_margin ?? 0) + estimatedMargin;

    topProductMap.set(key, {
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      quantity: Number(current?.quantity ?? 0) + quantity,
      total_price: nextRevenue,
      estimated_margin: nextMargin,
      margin_percent: nextRevenue > 0 ? (nextMargin / nextRevenue) * 100 : 0,
    });
  }

  const topProducts = [...topProductMap.values()]
    .sort((a, b) => Number(b.total_price ?? 0) - Number(a.total_price ?? 0))
    .slice(0, 5);

  const estimatedProfit = topProducts.reduce((sum, item) => sum + Number(item.estimated_margin ?? 0), 0);
  const overduePayables = payables.filter((entry) => entry.status !== "pago" && entry.due_date < today).length;
  const openOrders = sales.filter((sale) => ["confirmado", "aguardando_confirmacao"].includes(String(sale.status))).length;
  const inProduction = sales.filter((sale) => sale.status === "em_producao").length;
  const expiringSoon = ingredients.filter((ingredient) => {
    if (!ingredient.expiration_date) return false;
    const expiration = new Date(`${ingredient.expiration_date}T00:00:00`);
    const diffDays = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });
  const lowMarginProducts = products
    .map((product) => {
      const salePrice = Number(product.sale_price ?? 0);
      const estimatedCost = Number(product.estimated_cost ?? 0);
      const marginPercent = salePrice > 0 ? ((salePrice - estimatedCost) / salePrice) * 100 : 0;

      return { ...product, marginPercent };
    })
    .filter((product) => product.sale_price && product.marginPercent <= 20)
    .sort((a, b) => a.marginPercent - b.marginPercent)
    .slice(0, 5);
  const lowFinishedGoods = products
    .filter((product) => product.fulfillment_type === "pronta_entrega")
    .filter((product) => Number(product.finished_stock_quantity ?? 0) <= Number(product.minimum_finished_stock ?? 0))
    .sort(
      (a, b) =>
        Number(a.finished_stock_quantity ?? 0) / Math.max(Number(a.minimum_finished_stock ?? 1), 1) -
        Number(b.finished_stock_quantity ?? 0) / Math.max(Number(b.minimum_finished_stock ?? 1), 1),
    )
    .slice(0, 5);

  const alerts = [
    overduePayables > 0 ? `${overduePayables} conta(s) a pagar vencida(s)` : null,
    inventoryLow.length > 0 ? `${inventoryLow.length} insumo(s) abaixo do estoque mínimo` : null,
    lowFinishedGoods.length > 0 ? `${lowFinishedGoods.length} produto(s) pronta-entrega abaixo do mínimo` : null,
    expiringSoon.length > 0 ? `${expiringSoon.length} insumo(s) vencem nos próximos 7 dias` : null,
    lowMarginProducts.length > 0 ? `${lowMarginProducts.length} produto(s) com margem estimada de até 20%` : null,
    openOrders > 0 ? `${openOrders} pedido(s) aguardando andamento` : null,
    inProduction > 0 ? `${inProduction} pedido(s) em produção` : null,
  ].filter(Boolean) as string[];

  return {
    metrics: {
      salesToday,
      salesMonth,
      openOrders,
      inProduction,
      payablesSoon: payables.filter((entry) => entry.status !== "pago").length,
      receivables: receivables.filter((entry) => entry.status !== "pago").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0),
      lowStock: inventoryLow.length,
      estimatedProfit,
      overduePayables,
    },
    salesHistory: sales.slice(0, 7).reverse(),
    topProducts,
    inventoryLow,
    alerts,
    expiringSoon,
    lowMarginProducts,
    lowFinishedGoods,
  };
}
