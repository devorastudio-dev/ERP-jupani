import { createClient } from "@/server/supabase/server";

const SALE_STATUSES_THAT_REQUIRE_PRODUCTION = new Set([
  "confirmado",
  "em_producao",
  "pronto",
  "entregue",
]);

export async function ensureProductionOrderForSale(saleId: string) {
  const supabase = await createClient();

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id, customer_name, delivery_date, status")
    .eq("id", saleId)
    .single();

  if (saleError || !sale || !SALE_STATUSES_THAT_REQUIRE_PRODUCTION.has(String(sale.status))) {
    return;
  }

  const { data: existingOrder } = await supabase
    .from("production_orders")
    .select("id")
    .eq("sale_id", saleId)
    .maybeSingle();

  if (existingOrder?.id) {
    return;
  }

  const { data: saleItems, error: itemsError } = await supabase
    .from("sale_items")
    .select(`
      product_id,
      product_name,
      quantity,
      notes,
      products:products (
        fulfillment_type
      )
    `)
    .eq("sale_id", saleId);

  if (itemsError || !saleItems?.length) {
    return;
  }

  const orderItems = saleItems
    .filter((item) => {
      const relatedProduct = Array.isArray(item.products) ? item.products[0] : item.products;
      return item.product_id && relatedProduct?.fulfillment_type === "sob_encomenda";
    })
    .map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      notes: item.notes,
    }));

  if (!orderItems.length) {
    return;
  }

  const derivedStatus = sale.status === "em_producao" || sale.status === "pronto" || sale.status === "entregue"
    ? "em_producao"
    : "pendente";

  const { data: order, error: orderError } = await supabase
    .from("production_orders")
    .insert({
      sale_id: saleId,
      deadline: sale.delivery_date,
      status: derivedStatus,
      notes: `Ordem gerada automaticamente a partir do pedido ${sale.customer_name ?? "sem cliente informado"}.`,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return;
  }

  await supabase.from("production_order_items").insert(
    orderItems.map((item) => ({
      production_order_id: order.id,
      ...item,
    })),
  );
}
