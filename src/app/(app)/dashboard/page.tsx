import {
  CircleDollarSign,
  ClipboardList,
  Package,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { OverviewChart } from "@/components/charts/overview-chart";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";
import { getDashboardData } from "@/features/dashboard/server/queries";
import { resolveDateRange } from "@/server/filters/date-range";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "dashboard");

  const rawParams = searchParams ? await searchParams : {};
  const { start, end } = resolveDateRange({
    start: typeof rawParams.start === "string" ? rawParams.start : "",
    end: typeof rawParams.end === "string" ? rawParams.end : "",
    reset: typeof rawParams.reset === "string" ? rawParams.reset : "",
  });

  const { metrics, salesHistory, topProducts, inventoryLow, alerts, expiringSoon, lowMarginProducts, lowFinishedGoods } = await getDashboardData({ start, end });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumo operacional do dia, alertas do negócio e indicadores gerenciais."
        action={<DateRangeFilter start={start} end={end} />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Vendas do dia" value={formatCurrency(metrics.salesToday)} helper="Receita confirmada hoje" icon={CircleDollarSign} />
        <MetricCard title="Vendas do mês" value={formatCurrency(metrics.salesMonth)} helper="Acumulado do mês corrente" icon={ShoppingBag} />
        <MetricCard title="Pedidos em aberto" value={String(metrics.openOrders)} helper="Pedidos aguardando fluxo" icon={ClipboardList} />
        <MetricCard title="Saldo estimado" value={formatCurrency(metrics.receivables)} helper="Contas a receber em aberto" icon={Wallet} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <OverviewChart
          title="Receita recente"
          description="Últimas movimentações de pedidos por data de entrega."
          data={salesHistory.map((sale) => ({
            label: new Date(String(sale.delivery_date)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            value: Number(sale.total_amount ?? 0),
          }))}
        />
        <Card>
          <CardHeader>
            <CardTitle>Indicadores rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Lucro estimado</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{formatCurrency(metrics.estimatedProfit)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Contas a pagar próximas</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">{metrics.payablesSoon}</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">Contas vencidas</p>
              <p className="mt-2 text-2xl font-semibold text-orange-900">{metrics.overduePayables}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-sm text-rose-700">Insumos com estoque baixo</p>
              <p className="mt-2 text-2xl font-semibold text-rose-900">{metrics.lowStock}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Alertas executivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length ? (
            alerts.map((alert) => (
              <div key={alert} className="rounded-2xl bg-[#fff7f1] px-4 py-3 text-sm font-medium text-stone-700">
                {alert}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhum alerta crítico no momento.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length ? (
              topProducts.map((product) => (
                <div key={`${product.product_name}-${product.quantity}`} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                  <div>
                    <span className="font-medium text-stone-700">{product.product_name}</span>
                    <p className="text-xs text-stone-500">
                      Receita {formatCurrency(Number(product.total_price ?? 0))} • Margem {Number(product.margin_percent ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <Badge>{product.quantity} un.</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                As vendas ainda não geraram ranking de produtos.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas de estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventoryLow.length ? (
              inventoryLow.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center justify-between rounded-2xl bg-[#fff7f1] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-700">{ingredient.name}</p>
                      <p className="text-xs text-stone-500">Min.: {ingredient.minimum_stock}</p>
                    </div>
                  </div>
                  <Badge variant="warning">{ingredient.stock_quantity}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum insumo abaixo do mínimo no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validades próximas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringSoon.length ? (
              expiringSoon.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-700">{ingredient.name}</p>
                    <p className="text-xs text-stone-500">
                      Estoque {ingredient.stock_quantity} {ingredient.unit}
                    </p>
                  </div>
                  <Badge variant="warning">{ingredient.expiration_date}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum insumo com validade crítica nos próximos 7 dias.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Margem de atenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowMarginProducts.length ? (
              lowMarginProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-[#fff7f1] px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-700">{product.name}</p>
                    <p className="text-xs text-stone-500">
                      Venda {formatCurrency(Number(product.sale_price ?? 0))} • Custo {formatCurrency(Number(product.estimated_cost ?? 0))}
                    </p>
                  </div>
                  <Badge variant={product.marginPercent <= 0 ? "danger" : "warning"}>
                    {product.marginPercent.toFixed(1)}%
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum produto ativo com margem crítica no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pronta-entrega em atenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowFinishedGoods.length ? (
              lowFinishedGoods.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-700">{product.name}</p>
                    <p className="text-xs text-stone-500">
                      Atual {Number(product.finished_stock_quantity ?? 0).toFixed(3)} • Mínimo {Number(product.minimum_finished_stock ?? 0).toFixed(3)}
                    </p>
                  </div>
                  <Badge variant="warning">{product.unit}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum produto pronta-entrega abaixo do mínimo.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
