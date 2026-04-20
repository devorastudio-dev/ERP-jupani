import { OverviewChart } from "@/components/charts/overview-chart";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportsPageData } from "@/features/reports/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "relatorios");

  const { salesByProduct, expensesByCategory, employeePayments, sales, lowStock, purchases } =
    await getReportsPageData();

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
  const totalReceived = sales.reduce((sum, sale) => sum + Number(sale.paid_amount ?? 0), 0);
  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const estimatedProfit = totalReceived - totalExpenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios gerenciais"
        description="Indicadores consolidados de vendas, despesas, estoque, compras e pagamentos da operação."
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
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OverviewChart
          title="Vendas por produto"
          description="Top itens por volume vendido."
          data={salesByProduct.map((item) => ({
            label: item.product_name,
            value: Number(item.total_price ?? 0),
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
            <CardTitle>Movimentações de estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-[#fff8f4] p-4">
                <p className="font-medium text-stone-800">{entry.ingredient_name || "Insumo"}</p>
                <p className="text-xs text-stone-500">
                  {entry.movement_type} • {formatDate(entry.created_at, "DD/MM/YYYY HH:mm")}
                </p>
              </div>
            ))}
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
