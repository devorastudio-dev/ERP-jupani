import { AccountsOverview } from "@/features/cash/components/accounts-overview";
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

  const { sessions, movements, payables, receivables } = await getCashPageData();

  return (
    <div className="space-y-6">
      <PageHeader title="Caixa e financeiro" description="Acompanhe aberturas, fechamentos, sangrias, reforços e movimentações do dia a dia." />
      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
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
        <Card>
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
