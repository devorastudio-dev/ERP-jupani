import { AccountsOverview } from "@/features/cash/components/accounts-overview";
import { CashOperations } from "@/features/cash/components/cash-operations";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCashPageData } from "@/features/cash/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function CashPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "caixa");

  const { sessions, movements, payables, receivables, openSession, summary } = await getCashPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caixa e financeiro"
        description="Acompanhe aberturas, fechamentos, sangrias, reforços e movimentações do dia a dia."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton
              filename="caixa-movimentacoes.csv"
              rows={movements.map((movement) => ({
                id: movement.id,
                descricao: movement.description,
                tipo: movement.movement_type,
                categoria: movement.category_name ?? "",
                referencia: movement.reference_type ?? "",
                valor: formatCurrency(Number(movement.amount ?? 0)),
                data: formatDate(movement.created_at, "DD/MM/YYYY HH:mm"),
              }))}
            />
            <ExportCsvButton
              filename="caixa-sessoes.csv"
              rows={sessions.map((session) => ({
                id: session.id,
                abertura: formatDate(session.opened_at, "DD/MM/YYYY HH:mm"),
                fechamento: formatDate(session.closed_at, "DD/MM/YYYY HH:mm"),
                status: session.status,
                saldo_abertura: formatCurrency(Number(session.opening_balance ?? 0)),
                saldo_fechamento: formatCurrency(Number(session.closing_balance ?? 0)),
              }))}
              label="Exportar sessões"
            />
            <ExportCsvButton
              filename="contas-a-pagar.csv"
              rows={payables.map((payable) => ({
                id: payable.id,
                descricao: payable.description,
                valor_total: formatCurrency(Number(payable.amount ?? 0)),
                valor_pago: formatCurrency(Number(payable.paid_amount ?? 0)),
                valor_pendente: formatCurrency(Number(payable.amount ?? 0) - Number(payable.paid_amount ?? 0)),
                vencimento: formatDate(payable.due_date),
                status: payable.status,
                origem: payable.origin ?? "",
                observacoes: payable.notes ?? "",
              }))}
              label="Exportar contas a pagar"
            />
            <ExportCsvButton
              filename="contas-a-receber.csv"
              rows={receivables.map((receivable) => ({
                id: receivable.id,
                descricao: receivable.description,
                valor_total: formatCurrency(Number(receivable.amount ?? 0)),
                valor_recebido: formatCurrency(Number(receivable.received_amount ?? 0)),
                valor_pendente: formatCurrency(Number(receivable.amount ?? 0) - Number(receivable.received_amount ?? 0)),
                vencimento: formatDate(receivable.due_date),
                status: receivable.status,
                origem: receivable.origin ?? "",
                observacoes: receivable.notes ?? "",
              }))}
              label="Exportar contas a receber"
            />
          </div>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(summary.totalEntries)}</p>
            <p className="mt-1 text-sm text-stone-500">{summary.label}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-700">{formatCurrency(summary.totalExits)}</p>
            <p className="mt-1 text-sm text-stone-500">Sangrias e despesas lançadas</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saldo operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-stone-900">{formatCurrency(summary.operationalBalance)}</p>
            <p className="mt-1 text-sm text-stone-500">Entradas menos saídas</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{openSession ? "Saldo atual do caixa" : "Base do período"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-stone-900">{formatCurrency(summary.currentBalance)}</p>
            <p className="mt-1 text-sm text-stone-500">
              {openSession ? `Abertura em ${formatDate(openSession.opened_at, "DD/MM/YYYY HH:mm")}` : `Saldo inicial ${formatCurrency(summary.openingBalance)}`}
            </p>
          </CardContent>
        </Card>
      </section>
      <CashOperations openSession={openSession} />
      <section className="grid gap-6 2xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Sessões de caixa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-rose-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-stone-800">{formatDate(session.opened_at, "DD/MM/YYYY HH:mm")}</p>
                    <Badge variant={session.status === "aberto" ? "success" : "muted"}>{session.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    Abertura {formatCurrency(Number(session.opening_balance ?? 0))} • Fechamento {formatCurrency(Number(session.closing_balance ?? 0))}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhuma sessão de caixa registrada.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Movimentações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.length ? (
              movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-4">
                  <div>
                    <p className="font-medium text-stone-800">{movement.description}</p>
                    <p className="text-sm text-stone-500">
                      {movement.category_name ?? "Sem categoria"} • {formatDate(movement.created_at, "DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={movement.movement_type === "saida" ? "danger" : "success"}>{movement.movement_type}</Badge>
                    <p className="mt-2 font-semibold text-stone-900">{formatCurrency(Number(movement.amount ?? 0))}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhuma movimentação registrada.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      <AccountsOverview payables={payables} receivables={receivables} />
    </div>
  );
}
