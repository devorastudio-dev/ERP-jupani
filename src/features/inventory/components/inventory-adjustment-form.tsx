"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createInventoryAdjustmentAction } from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IngredientRow } from "@/types/entities";

const movementOptions = [
  { value: "inventario", label: "Inventário físico" },
  { value: "ajuste", label: "Ajuste de saldo" },
  { value: "entrada_manual", label: "Entrada manual" },
  { value: "saida_manual", label: "Saída manual" },
  { value: "perda", label: "Perda" },
  { value: "desperdicio", label: "Desperdício" },
] as const;

export function InventoryAdjustmentForm({ ingredients }: { ingredients: IngredientRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ingredientsMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);

  const submitAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await createInventoryAdjustmentAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível registrar a movimentação.");
        return;
      }

      toast.success("Movimentação registrada com sucesso.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste guiado de estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submitAction} className="space-y-5">
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff8f6] to-[#fff1ef] p-4">
            <p className="text-sm font-medium text-stone-700">Quando usar</p>
            <p className="mt-1 text-sm text-stone-500">
              Use inventário físico para informar o saldo contado. Use entrada/saída, perda ou desperdício para registrar movimentações pontuais.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ingredient_id">Insumo</Label>
              <select
                id="ingredient_id"
                name="ingredient_id"
                className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} • {Number(ingredient.stock_quantity ?? 0).toFixed(3)} {ingredient.unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement_type">Tipo</Label>
              <select
                id="movement_type"
                name="movement_type"
                className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                defaultValue="inventario"
              >
                {movementOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" step="0.001" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea id="reason" name="reason" placeholder="Ex.: contagem mensal, perda por validade, ajuste após conferência" required />
            </div>
          </div>

          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-stone-500">
            {ingredients.length
              ? `Itens monitorados: ${ingredients.length}. Valor médio dos insumos disponível para auditoria: ${[...ingredientsMap.values()].filter((item) => Number(item.average_cost ?? 0) > 0).length}.`
              : "Nenhum insumo disponível para movimentação."}
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Registrando..." : "Registrar movimentação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
