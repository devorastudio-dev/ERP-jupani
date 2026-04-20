"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addSalePaymentAction, updateSaleStatusAction } from "@/features/sales/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaleSummaryRow } from "@/types/entities";

const statusOptions = [
  { value: "orcamento", label: "Orçamento" },
  { value: "aguardando_confirmacao", label: "Aguardando confirmação" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_producao", label: "Em produção" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

export function SalesList({ sales }: { sales: SaleSummaryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submitStatus = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateSaleStatusAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível atualizar o status.");
        return;
      }
      toast.success("Status atualizado.");
      router.refresh();
    });
  };

  const submitPayment = (formData: FormData) => {
    startTransition(async () => {
      const result = await addSalePaymentAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível registrar o pagamento.");
        return;
      }
      toast.success("Pagamento registrado.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos registrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sales.length ? (
          sales.map((sale) => (
            <div key={sale.id} className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-stone-900">{sale.customer_name || "Cliente não informado"}</p>
                    <Badge>{String(sale.status).replaceAll("_", " ")}</Badge>
                    <Badge variant="muted">{sale.fiscal_status ?? "nao_emitido"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    {sale.sale_type} • {sale.order_type} • entrega {formatDate(sale.delivery_date)}
                  </p>
                  <p className="text-sm text-stone-500">{sale.phone}</p>
                </div>
                <div className="grid gap-2 text-left sm:grid-cols-3 sm:text-right 2xl:min-w-[460px]">
                  <div>
                    <p className="text-xs text-stone-500">Total</p>
                    <p className="font-semibold text-stone-900">{formatCurrency(Number(sale.total_amount ?? 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Recebido</p>
                    <p className="font-semibold text-stone-900">{formatCurrency(Number(sale.paid_amount ?? 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Pendente</p>
                    <p className="font-semibold text-stone-900">{formatCurrency(Number(sale.pending_amount ?? 0))}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-700">Itens do pedido</p>
                    <div className="space-y-2">
                      {sale.sale_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                          <div>
                            <p className="font-medium text-stone-800">{item.product_name}</p>
                            <p className="text-xs text-stone-500">
                              {item.quantity} x {formatCurrency(Number(item.unit_price ?? 0))}
                            </p>
                          </div>
                          <p className="font-semibold text-stone-900">{formatCurrency(Number(item.total_price ?? 0))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <form action={submitStatus} className="rounded-3xl border border-rose-100 p-4">
                      <input type="hidden" name="sale_id" value={sale.id} />
                      <div className="space-y-2">
                        <Label htmlFor={`status-${sale.id}`}>Atualizar status</Label>
                        <select
                          id={`status-${sale.id}`}
                          name="status"
                          defaultValue={sale.status}
                          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`status-notes-${sale.id}`}>Observação</Label>
                        <Textarea id={`status-notes-${sale.id}`} name="notes" />
                      </div>
                      <Button type="submit" variant="outline" className="mt-4" disabled={pending}>
                        Atualizar status
                      </Button>
                    </form>

                    <form action={submitPayment} className="rounded-3xl border border-rose-100 p-4">
                      <input type="hidden" name="sale_id" value={sale.id} />
                      <div className="space-y-2">
                        <Label htmlFor={`amount-${sale.id}`}>Registrar pagamento</Label>
                        <Input id={`amount-${sale.id}`} name="amount" type="number" step="0.01" min="0.01" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`payment-method-${sale.id}`}>Forma</Label>
                        <select
                          id={`payment-method-${sale.id}`}
                          name="payment_method"
                          defaultValue={sale.payment_method ?? "pix"}
                          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                        >
                          <option value="pix">Pix</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao_credito">Cartão de crédito</option>
                          <option value="cartao_debito">Cartão de débito</option>
                        </select>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`payment-notes-${sale.id}`}>Observação</Label>
                        <Textarea id={`payment-notes-${sale.id}`} name="notes" />
                      </div>
                      <Button type="submit" className="mt-4" disabled={pending}>
                        Lançar pagamento
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#fff8f4] p-4">
                    <p className="text-sm font-medium text-stone-700">Pagamentos</p>
                    <div className="mt-3 space-y-2">
                      {sale.sale_payments?.length ? (
                        sale.sale_payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-stone-800">{payment.payment_method}</p>
                              <p className="text-xs text-stone-500">{formatDate(payment.payment_date, "DD/MM/YYYY HH:mm")}</p>
                            </div>
                            <p className="font-semibold text-stone-900">{formatCurrency(Number(payment.amount ?? 0))}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-500">Nenhum pagamento registrado.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-rose-50 p-4">
                    <p className="text-sm font-medium text-stone-700">Histórico de status</p>
                    <div className="mt-3 space-y-2">
                      {sale.order_status_history?.length ? (
                        sale.order_status_history.map((entry) => (
                          <div key={entry.id} className="rounded-2xl bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-stone-800">
                                {String(entry.new_status).replaceAll("_", " ")}
                              </p>
                              <p className="text-xs text-stone-500">{formatDate(entry.created_at, "DD/MM/YYYY HH:mm")}</p>
                            </div>
                            {entry.notes ? <p className="mt-1 text-xs text-stone-500">{entry.notes}</p> : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-500">Sem histórico disponível.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
            Nenhum pedido cadastrado ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
