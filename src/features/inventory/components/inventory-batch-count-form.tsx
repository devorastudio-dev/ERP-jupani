"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { MinusCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createInventoryBatchCountAction } from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IngredientRow } from "@/types/entities";

const inventoryBatchSchema = z.object({
  items: z.array(
    z.object({
      ingredient_id: z.string().uuid("Selecione um insumo."),
      counted_quantity: z.coerce.number().min(0, "A contagem deve ser zero ou positiva."),
      reason: z.string().optional(),
    }),
  ),
});

export function InventoryBatchCountForm({ ingredients }: { ingredients: IngredientRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(inventoryBatchSchema),
    defaultValues: {
      items: [
        {
          ingredient_id: ingredients[0]?.id ?? "",
          counted_quantity: Number(ingredients[0]?.stock_quantity ?? 0),
          reason: "Conferência cíclica",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("items", JSON.stringify(values.items));

      const result = await createInventoryBatchCountAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível concluir a conferência.");
        return;
      }

      toast.success("Conferência em lote registrada.");
      reset();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventário cíclico em lote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-2xl bg-[#fff8f4] p-4 text-sm text-stone-500">
            Informe o saldo contado de vários insumos em uma mesma conferência. O sistema atualiza somente os itens com divergência.
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-3xl border border-rose-100 p-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(140px,0.5fr)_minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label>Insumo</Label>
                  <select
                    {...register(`items.${index}.ingredient_id`)}
                    className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                  >
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} • atual {Number(ingredient.stock_quantity ?? 0).toFixed(3)} {ingredient.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Contado</Label>
                  <Input type="number" step="0.001" min="0" {...register(`items.${index}.counted_quantity`)} />
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Textarea {...register(`items.${index}.reason`)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  ingredient_id: ingredients[0]?.id ?? "",
                  counted_quantity: Number(ingredients[0]?.stock_quantity ?? 0),
                  reason: "Conferência cíclica",
                })
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar linha
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Conferindo..." : "Registrar conferência"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
