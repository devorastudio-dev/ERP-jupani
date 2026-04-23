"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProductStockAdjustmentAction } from "@/features/products/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { ProductRow, ProductStockMovementRow } from "@/types/entities";

export function ProductStockAdjustmentCard({
  products,
  movements,
}: {
  products: ProductRow[];
  movements: ProductStockMovementRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const readyProducts = useMemo(
    () => products.filter((product) => product.fulfillment_type === "pronta_entrega"),
    [products],
  );

  const submitAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProductStockAdjustmentAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível registrar a movimentação.");
        return;
      }

      toast.success("Movimentação de produto acabado registrada.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produto acabado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={submitAction} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Produto pronta-entrega</Label>
              <select
                id="product_id"
                name="product_id"
                className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                {readyProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} • saldo {Number(product.finished_stock_quantity ?? 0).toFixed(3)} {product.unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movement_type">Tipo</Label>
                <select
                  id="movement_type"
                  name="movement_type"
                  defaultValue="ajuste"
                  className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                >
                  <option value="ajuste">Ajuste para saldo contado</option>
                  <option value="entrada_manual">Entrada manual</option>
                  <option value="saida_manual">Saída manual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" name="quantity" type="number" step="0.001" min="0" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea id="reason" name="reason" required placeholder="Ex.: conferência do freezer, entrada por correção, saída por consumo interno" />
            </div>
          </div>
          <Button type="submit" disabled={pending || !readyProducts.length}>
            {pending ? "Registrando..." : "Registrar movimentação"}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-700">Últimas movimentações</p>
          {movements.length ? (
            movements.map((movement) => (
              <div key={movement.id} className="rounded-2xl bg-rose-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-800">{movement.product_name}</p>
                    <p className="text-xs text-stone-500">
                      {movement.movement_type} • {formatDate(movement.created_at, "DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                  <p className="font-semibold text-stone-900">{Number(movement.quantity ?? 0).toFixed(3)}</p>
                </div>
                {movement.reason ? <p className="mt-2 text-sm text-stone-500">{movement.reason}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhuma movimentação de produto acabado registrada.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
