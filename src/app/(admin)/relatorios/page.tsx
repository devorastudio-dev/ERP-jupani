import { OverviewChart } from "@/components/charts/overview-chart";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportsPageData } from "@/features/reports/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";
import { resolveDateRange } from "@/server/filters/date-range";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "relatorios");

  const rawParams = searchParams ? await searchParams : {};
  const { start, end } = resolveDateRange({
    start: typeof rawParams.start === "string" ? rawParams.start : "",
    end: typeof rawParams.end === "string" ? rawParams.end : "",
    reset: typeof rawParams.reset === "string" ? rawParams.reset : "",
  });

  const { salesByProduct, expensesByCategory, employeePayments, sales, lowStock, purchases, inventoryMovements, finishedGoodsInsights, ingredientReplenishment, finishedGoodsReplenishment, periodDays } =
    await getReportsPageData({ start, end });

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
  const totalReceived = sales.reduce((sum, sale) => sum + Number(sale.paid_amount ?? 0), 0);
  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const estimatedProfit = totalReceived - totalExpenses;
  const estimatedProductMargin = salesByProduct.reduce((sum, item) => sum + Number(item.estimated_margin ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios gerenciais"
        description="Indicadores consolidados de vendas, despesas, estoque, compras e pagamentos da operação."
        action={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <DateRangeFilter start={start} end={end} />
            <ExportCsvButton
              filename="relatorio-gerencial.csv"
              rows={[
                ...salesByProduct.map((item) => ({
                  tipo: "produto",
                  nome: item.product_name,
                  receita: item.gross_revenue ?? item.total_price,
                  custo_estimado: item.estimated_total_cost ?? "",
                  margem_estimada: item.estimated_margin ?? "",
                  margem_percentual: item.margin_percent ?? "",
                })),
                ...ingredientReplenishment.map((item) => ({
                  tipo: "reposicao_insumo",
                  nome: item.name,
                  receita: "",
                  custo_estimado: "",
                  margem_estimada: "",
                  margem_percentual: "",
                  unidade: item.unit,
                  reposicao_sugerida: (item as typeof item & { replenishment_gap?: number }).replenishment_gap ?? "",
                })),
                ...finishedGoodsReplenishment.map((item) => ({
                  tipo: "reposicao_pronta_entrega",
                  nome: item.name,
                  receita: "",
                  custo_estimado: "",
                  margem_estimada: "",
                  margem_percentual: "",
                  unidade: item.unit,
                  reposicao_sugerida: (item as typeof item & { replenishment_gap?: number }).replenishment_gap ?? "",
                })),
              ]}
            />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Receita do período</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(totalSales)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Recebido</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Despesas lançadas</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Lucro estimado</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(estimatedProfit)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 md:col-span-2 xl:col-span-4">
          <p className="text-sm text-stone-500">Margem estimada dos produtos vendidos</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(estimatedProductMargin)}</p>
          <p className="mt-1 text-sm text-stone-500">
            Valor aproximado com base no custo estimado atual dos produtos e no faturamento dos itens vendidos.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OverviewChart
          title="Faturamento por produto"
          description="Top itens por receita e base para leitura de margem."
          data={salesByProduct.map((item) => ({
            label: item.product_name,
            value: Number(item.gross_revenue ?? item.total_price ?? 0),
          }))}
        />
        <OverviewChart
          title="Despesas por categoria"
          description="Saídas consolidadas a partir do caixa."
          data={expensesByCategory.map((item) => ({
            label: item.category_name ?? "Sem categoria",
            value: Number(item.amount ?? 0),
          }))}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sales.slice(0, 8).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-4">
                <div>
                  <p className="font-medium text-stone-800">{sale.customer_name || "Pedido"}</p>
                  <p className="text-xs text-stone-500">{sale.status}</p>
                </div>
                <p className="font-semibold text-stone-900">{formatCurrency(Number(sale.total_amount ?? 0))}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insumos críticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length ? (
              lowStock.map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-[#fff8f4] p-4">
                  <p className="font-medium text-stone-800">{entry.name}</p>
                  <p className="text-xs text-stone-500">
                    Atual {Number(entry.stock_quantity ?? 0).toFixed(3)} {entry.unit} • Mínimo {Number(entry.minimum_stock ?? 0).toFixed(3)} {entry.unit}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum insumo abaixo do estoque mínimo.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compras recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="rounded-2xl bg-rose-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-stone-800">{purchase.supplier_name}</p>
                  <p className="font-semibold text-stone-900">{formatCurrency(Number(purchase.total_amount ?? 0))}</p>
                </div>
                <p className="text-xs text-stone-500">
                  {purchase.status} • {formatDate(purchase.purchase_date)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Produtos com melhor margem estimada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {salesByProduct.length ? (
            salesByProduct.slice(0, 8).map((item) => (
              <div key={`${item.product_id ?? item.product_name}`} className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-4">
                <div>
                  <p className="font-medium text-stone-800">{item.product_name}</p>
                  <p className="text-sm text-stone-500">
                    Receita {formatCurrency(Number(item.gross_revenue ?? 0))} • Custo estimado {formatCurrency(Number(item.estimated_total_cost ?? 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-900">{formatCurrency(Number(item.estimated_margin ?? 0))}</p>
                  <p className="text-sm text-stone-500">{Number(item.margin_percent ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Ainda não há dados suficientes para calcular margem por produto.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Giro e cobertura de pronta-entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {finishedGoodsInsights.length ? (
              finishedGoodsInsights.map((item) => (
                <div key={`${item.product_id ?? item.product_name}-coverage`} className="rounded-2xl bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-stone-800">{item.product_name}</p>
                    <p className="font-semibold text-stone-900">{Number(item.quantity ?? 0).toFixed(3)} un.</p>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    Giro {Number((item as typeof item & { turnover?: number | null }).turnover ?? 0).toFixed(2)}x no periodo de {periodDays} dias
                  </p>
                  <p className="text-sm text-stone-500">
                    Cobertura estimada {Number((item as typeof item & { coverage_days?: number | null }).coverage_days ?? 0).toFixed(1)} dias
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Ainda não há base suficiente para calcular giro e cobertura de pronta-entrega.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reposição sugerida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...finishedGoodsReplenishment, ...ingredientReplenishment].slice(0, 10).length ? (
              [...finishedGoodsReplenishment, ...ingredientReplenishment].slice(0, 10).map((item, index) => (
                <div key={`${"id" in item ? item.id : index}-replenishment`} className="rounded-2xl bg-[#fff8f4] p-4">
                  <p className="font-medium text-stone-800">{"name" in item ? item.name : "Item"}</p>
                  <p className="text-sm text-stone-500">
                    Repor {Number((item as typeof item & { replenishment_gap?: number }).replenishment_gap ?? 0).toFixed(3)} {"unit" in item ? item.unit : ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhuma necessidade de reposição identificada no período.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Últimas movimentações de estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inventoryMovements.length ? (
            inventoryMovements.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-[#fff8f4] p-4">
                <p className="font-medium text-stone-800">{entry.ingredient_name || "Insumo"}</p>
                <p className="text-xs text-stone-500">
                  {entry.movement_type} • {formatDate(entry.created_at, "DD/MM/YYYY HH:mm")}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhuma movimentação recente encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos de funcionários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {employeePayments.length ? (
            employeePayments.map((payment) => (
              <div
                key={`${payment.id}`}
                className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-4"
              >
                <div>
                  <p className="font-medium text-stone-800">{payment.employee_name}</p>
                  <p className="text-sm text-stone-500">{payment.payment_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-900">{formatCurrency(Number(payment.amount ?? 0))}</p>
                  <p className="text-sm text-stone-500">{formatDate(payment.payment_date)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhum pagamento registrado no período.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
