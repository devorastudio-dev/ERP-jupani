import { ClipboardList, PackageCheck, ShoppingBag, TimerReset } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionOrderForm } from "@/features/production/components/production-order-form";
import { ProductionOrdersList } from "@/features/production/components/production-orders-list";
import { getProductionPageData } from "@/features/production/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function ProductionPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "producao");

  const { orders, sales, allSales, products } = await getProductionPageData();
  const inProgressOrders = orders.filter((order) => order.status === "em_producao").length;
  const finalizedOrders = orders.filter((order) => order.status === "finalizado").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produção"
        description="Organize ordens de produção, relacione pedidos confirmados e acompanhe o status operacional."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Ordens registradas</p>
            <ClipboardList className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Pedidos na fila</p>
            <ShoppingBag className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{sales.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Em produção</p>
            <TimerReset className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{inProgressOrders}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Finalizadas</p>
            <PackageCheck className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{finalizedOrders}</p>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="min-w-0">
          <ProductionOrderForm sales={sales} products={products} />
        </div>
        <Card className="2xl:sticky 2xl:top-28">
          <CardHeader>
            <CardTitle>Fila de pedidos</CardTitle>
            <p className="text-sm text-stone-500">
              Apoio visual para enxergar rapidamente o que ainda precisa entrar na produção.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sales.length ? (
              sales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="rounded-2xl bg-[#fff8f4] p-4">
                  <p className="font-medium text-stone-800">{sale.customer_name || "Pedido"}</p>
                  <p className="text-sm text-stone-500">{sale.status}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum pedido aguardando produção.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <ProductionOrdersList orders={orders} sales={allSales} products={products} />
    </div>
  );
}
