import Link from "next/link";
import { ClipboardList, MonitorSmartphone, Store, Wallet } from "lucide-react";
import { SaleForm } from "@/features/sales/components/sale-form";
import { SalesList } from "@/features/sales/components/sales-list";
import { getSalesPageData, type SalesSourceFilter } from "@/features/sales/server/queries";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_BASE_PATH } from "@/lib/route-config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

type SalesPageProps = {
  searchParams?: Promise<{ origem?: string }>;
};

const isSalesSourceFilter = (value: string): value is SalesSourceFilter =>
  value === "all" || value === "site" || value === "manual";

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "vendas");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedOrigin = resolvedSearchParams?.origem ?? "";
  const sourceFilter: SalesSourceFilter = isSalesSourceFilter(requestedOrigin)
    ? requestedOrigin
    : "all";

  const { sales, products, openCashSession, sourceSummary } = await getSalesPageData(sourceFilter);
  const filterLinks: Array<{ label: string; value: SalesSourceFilter; count: number }> = [
    { label: "Todos", value: "all", count: sourceSummary.all },
    { label: "Site", value: "site", count: sourceSummary.site },
    { label: "Painel", value: "manual", count: sourceSummary.manual },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas e pedidos"
        description="Monte pedidos completos com itens, pagamentos, histórico de status e integração direta com o caixa."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton
              filename={`pedidos-${sourceFilter}.csv`}
              rows={sales.map((sale) => ({
                id: sale.id,
                numero_pedido: sale.order_code ?? "",
                cliente: sale.customer_name ?? "",
                telefone: sale.phone ?? "",
                origem: sale.external_reference === "site_publico" ? "site" : "painel",
                tipo_venda: sale.sale_type ?? "",
                atendimento: sale.order_type ?? "",
                status: sale.status,
                entrega: formatDate(sale.delivery_date, "DD/MM/YYYY HH:mm"),
                taxa_entrega: formatCurrency(Number(sale.delivery_fee ?? 0)),
                desconto: formatCurrency(Number(sale.discount_amount ?? 0)),
                total: formatCurrency(Number(sale.total_amount ?? 0)),
                recebido: formatCurrency(Number(sale.paid_amount ?? 0)),
                pendente: formatCurrency(Number(sale.pending_amount ?? 0)),
                forma_pagamento: sale.payment_method ?? "",
                fiscal: sale.fiscal_status ?? "",
                estoque_baixado: sale.stock_deducted ? "sim" : "nao",
                itens: sale.sale_items?.map((item) => item.product_name).join(" | ") ?? "",
                itens_detalhados:
                  sale.sale_items
                    ?.map(
                      (item) =>
                        `${item.product_name} (${item.quantity} x ${formatCurrency(Number(item.unit_price ?? 0))} = ${formatCurrency(Number(item.total_price ?? 0))})`,
                    )
                    .join(" | ") ?? "",
                pagamentos:
                  sale.sale_payments
                    ?.map(
                      (payment) =>
                        `${payment.payment_method}: ${formatCurrency(Number(payment.amount ?? 0))} em ${formatDate(payment.payment_date, "DD/MM/YYYY HH:mm")}`,
                    )
                    .join(" | ") ?? "",
                historico_status:
                  sale.order_status_history
                    ?.map(
                      (entry) =>
                        `${entry.new_status} em ${formatDate(entry.created_at, "DD/MM/YYYY HH:mm")}${entry.notes ? ` (${entry.notes})` : ""}`,
                    )
                    .join(" | ") ?? "",
                observacoes_cliente: sale.notes ?? "",
                observacoes_internas: sale.internal_notes ?? "",
              }))}
            />
            {filterLinks.map((filter) => {
              const href =
                filter.value === "all"
                  ? `${ADMIN_BASE_PATH}/vendas`
                  : `${ADMIN_BASE_PATH}/vendas?origem=${filter.value}`;

              return (
                <Button
                  key={filter.value}
                  asChild
                  variant={sourceFilter === filter.value ? "default" : "outline"}
                  size="sm"
                >
                  <Link href={href}>
                    {filter.label} ({filter.count})
                  </Link>
                </Button>
              );
            })}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Pedidos visíveis</p>
            <ClipboardList className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{sales.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Pedidos do site</p>
            <MonitorSmartphone className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{sourceSummary.site}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Pedidos no painel</p>
            <Store className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{sourceSummary.manual}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Caixa atual</p>
            <Wallet className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-base font-semibold text-stone-900">
            {openCashSession ? `Aberto desde ${formatDate(openCashSession.opened_at, "DD/MM/YYYY HH:mm")}` : "Nenhuma sessão aberta"}
          </p>
        </div>
      </section>

      <section className="grid items-start gap-6 2xl:grid-cols-[1.16fr_0.84fr]">
        <div className="min-w-0">
          <SaleForm products={products} openCashSession={openCashSession} />
        </div>
        <Card className="min-w-0 2xl:sticky 2xl:top-28">
          <CardHeader>
            <CardTitle>Operação comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-stone-600">
              Use os filtros acima para separar rapidamente o que veio do site e o que foi lançado internamente.
            </div>
            <div className="rounded-2xl bg-[#fff8f4] p-4 text-sm text-stone-600">
              Monte o pedido na coluna principal e deixe este card como apoio para conferência do fluxo comercial.
            </div>
            <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
              Pagamentos lançados pelo pedido também entram no módulo de caixa como movimentação de entrada com categoria de venda.
            </div>
          </CardContent>
        </Card>
      </section>

      <SalesList sales={sales} products={products} openCashSession={openCashSession} />
    </div>
  );
}
