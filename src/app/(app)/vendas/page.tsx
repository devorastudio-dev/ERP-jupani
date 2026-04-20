import { SaleForm } from "@/features/sales/components/sale-form";
import { SalesList } from "@/features/sales/components/sales-list";
import { getSalesPageData } from "@/features/sales/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function SalesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "vendas");

  const { sales, products, openCashSession } = await getSalesPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas e pedidos"
        description="Monte pedidos completos com itens, pagamentos, histórico de status e integração direta com o caixa."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SaleForm products={products} openCashSession={openCashSession} />
        <Card>
          <CardHeader>
            <CardTitle>Operação comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-sm text-stone-500">Pedidos no painel</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{sales.length}</p>
            </div>
            <div className="rounded-2xl bg-[#fff8f4] p-4">
              <p className="text-sm text-stone-500">Caixa atual</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">
                {openCashSession ? `Aberto desde ${formatDate(openCashSession.opened_at, "DD/MM/YYYY HH:mm")}` : "Nenhuma sessão aberta"}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
              Pagamentos lançados pelo pedido também entram no módulo de caixa como movimentação de entrada com categoria de venda.
            </div>
          </CardContent>
        </Card>
      </section>

      <SalesList sales={sales} />
    </div>
  );
}
