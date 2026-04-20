"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { settlePayableAction } from "@/features/purchases/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AccountPayableRow, AccountReceivableRow } from "@/types/entities";

export function AccountsOverview({
  payables,
  receivables,
}: {
  payables: AccountPayableRow[];
  receivables: AccountReceivableRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const settlePayable = (formData: FormData) => {
    startTransition(async () => {
      const result = await settlePayableAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível baixar a conta.");
        return;
      }

      toast.success("Conta a pagar baixada.");
      router.refresh();
    });
  };

  return (
    <section className="grid gap-6 2xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Contas a pagar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payables.length ? (
            payables.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-rose-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-800">{entry.description}</p>
                    <p className="text-sm text-stone-500">
                      Vence em {formatDate(entry.due_date)} • pago {formatCurrency(Number(entry.paid_amount ?? 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={entry.status === "parcial" ? "warning" : "muted"}>{entry.status}</Badge>
                    <p className="mt-2 font-semibold text-stone-900">{formatCurrency(Number(entry.amount ?? 0))}</p>
                  </div>
                </div>
                <form action={settlePayable} className="mt-4 grid gap-3 xl:grid-cols-[minmax(120px,0.7fr)_minmax(150px,0.8fr)_minmax(0,1fr)_auto]">
                  <input type="hidden" name="account_id" value={entry.id} />
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input name="amount" type="number" step="0.01" min="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma</Label>
                    <select name="payment_method" className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="boleto">Boleto</option>
                      <option value="cartao_credito">Cartão de crédito</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Textarea name="notes" className="min-h-10" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="outline" disabled={pending}>
                      Baixar
                    </Button>
                  </div>
                </form>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhuma conta a pagar pendente.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Contas a receber</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receivables.length ? (
            receivables.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                <div>
                  <p className="font-medium text-stone-800">{entry.description}</p>
                  <p className="text-xs text-stone-500">
                    Vence em {formatDate(entry.due_date)} • recebido {formatCurrency(Number(entry.received_amount ?? 0))}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={entry.status === "parcial" ? "warning" : "default"}>{entry.status}</Badge>
                  <p className="mt-1 font-semibold text-stone-900">{formatCurrency(Number(entry.amount ?? 0))}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhuma conta a receber pendente.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
