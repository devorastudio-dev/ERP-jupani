"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProductionOrderStatusAction } from "@/features/production/actions";
import { ProductionOrderFormDialog } from "@/features/production/components/production-order-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ProductRow, ProductionOrderRow, SaleSummaryRow } from "@/types/entities";

export function ProductionOrdersList({
  orders,
  sales,
  products,
}: {
  orders: ProductionOrderRow[];
  sales: SaleSummaryRow[];
  products: ProductRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const updateStatus = (orderId: string, status: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("order_id", orderId);
      formData.set("status", status);
      const result = await updateProductionOrderStatusAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível atualizar a ordem.");
        return;
      }
      toast.success("Status da produção atualizado.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordens de produção</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="rounded-3xl border border-rose-100 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-stone-900">Ordem {order.id.slice(0, 8)}</p>
                    <Badge>{order.status}</Badge>
                    <Badge variant={order.stock_deducted ? "success" : "muted"}>
                      {order.stock_deducted ? "Estoque baixado" : "Estoque pendente"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    Prazo: {order.deadline ? formatDate(order.deadline, "DD/MM/YYYY HH:mm") : "Sem prazo"}
                  </p>
                  {order.notes ? <p className="mt-2 text-sm text-stone-500">{order.notes}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ProductionOrderFormDialog order={order} sales={sales} products={products} />
                  {["pendente", "em_producao", "finalizado", "cancelado"].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={order.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStatus(order.id, status)}
                      disabled={pending}
                    >
                      {status.replaceAll("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.production_order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3">
                    <div>
                      <p className="font-medium text-stone-800">{item.product_name}</p>
                      {item.notes ? <p className="text-xs text-stone-500">{item.notes}</p> : null}
                    </div>
                    <p className="font-semibold text-stone-900">{item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
            Nenhuma ordem de produção criada.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
