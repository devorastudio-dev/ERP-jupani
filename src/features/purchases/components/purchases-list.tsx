"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approvePurchaseAction } from "@/features/purchases/actions";
import { PurchaseFormDialog } from "@/features/purchases/components/purchase-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AccountPayableRow, IngredientRow, PurchaseRow, SupplierRow } from "@/types/entities";

export function PurchasesList({
  purchases,
  payables,
  suppliers,
  ingredients,
}: {
  purchases: PurchaseRow[];
  payables: AccountPayableRow[];
  suppliers: SupplierRow[];
  ingredients: IngredientRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const approvePurchase = (purchaseId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("purchase_id", purchaseId);
      const result = await approvePurchaseAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível aprovar a compra.");
        return;
      }

      toast.success("Compra aprovada e recebida.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compras registradas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {purchases.length ? (
          purchases.map((purchase) => (
            <div key={purchase.id} className="rounded-3xl border border-rose-100 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-stone-900">{purchase.supplier_name}</p>
                    <Badge>{purchase.status}</Badge>
                    {purchase.generate_payable ? <Badge variant="muted">Conta a pagar</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    {formatDate(purchase.purchase_date)} • {purchase.payment_method || "Sem forma definida"}
                  </p>
                  {purchase.notes ? <p className="mt-2 text-sm text-stone-500">{purchase.notes}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500">Total</p>
                  <p className="text-xl font-semibold text-stone-900">{formatCurrency(Number(purchase.total_amount ?? 0))}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <PurchaseFormDialog purchase={purchase} suppliers={suppliers} ingredients={ingredients} />
                    {purchase.status !== "recebida" && purchase.status !== "cancelada" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => approvePurchase(purchase.id)}
                        disabled={pending}
                      >
                        Aprovar recebimento
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {purchase.purchase_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                    <div>
                      <p className="font-medium text-stone-800">{item.ingredient_name}</p>
                      <p className="text-xs text-stone-500">
                        {item.quantity} {item.purchase_unit ?? ""} x {formatCurrency(Number(item.unit_cost ?? 0))}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-900">{formatCurrency(Number(item.total_cost ?? 0))}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
            Nenhuma compra cadastrada.
          </div>
        )}

        <div className="rounded-3xl bg-[#fff8f4] p-5">
          <p className="text-sm font-medium text-stone-700">Contas a pagar recentes</p>
          <div className="mt-3 space-y-2">
            {payables.length ? (
              payables.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-800">{entry.description}</p>
                    <p className="text-xs text-stone-500">{formatDate(entry.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={entry.status === "pago" ? "success" : "warning"}>{entry.status}</Badge>
                    <p className="mt-1 font-semibold text-stone-900">{formatCurrency(Number(entry.amount ?? 0))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">Nenhuma conta a pagar registrada.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
