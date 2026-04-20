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

  const { orders, sales, products } = await getProductionPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produção"
        description="Organize ordens de produção, relacione pedidos confirmados e acompanhe o status operacional."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ProductionOrderForm sales={sales} products={products} />
        <Card>
          <CardHeader>
            <CardTitle>Fila de pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sales.length ? (
              sales.map((sale) => (
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

      <ProductionOrdersList orders={orders} />
    </div>
  );
}
