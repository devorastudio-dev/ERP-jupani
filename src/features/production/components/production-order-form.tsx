"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProductionOrderAction } from "@/features/production/actions";
import { productionOrderSchema } from "@/features/production/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductRow, SaleSummaryRow } from "@/types/entities";

export function ProductionOrderForm({
  sales,
  products,
}: {
  sales: SaleSummaryRow[];
  products: ProductRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      status: "pendente",
      items: [{ product_id: "", product_name: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const productsMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);
  const items = watch("items");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sale_id", values.sale_id ?? "");
      formData.set("deadline", values.deadline ?? "");
      formData.set("status", values.status);
      formData.set("notes", values.notes ?? "");
      formData.set("items", JSON.stringify(values.items));

      const result = await createProductionOrderAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar a ordem.");
        return;
      }

      toast.success("Ordem de produção criada.");
      reset();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova ordem de produção</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale_id">Pedido relacionado</Label>
              <select id="sale_id" {...register("sale_id")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="">Selecione</option>
                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.customer_name || "Pedido"} • {sale.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="datetime-local" {...register("deadline")} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Itens</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: "", product_name: "", quantity: 1 })}>
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-2xl border border-rose-100 p-4 md:grid-cols-[1.5fr_0.6fr_auto]">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <select
                    {...register(`items.${index}.product_id`)}
                    onChange={(event) => {
                      setValue(`items.${index}.product_id`, event.target.value);
                      setValue(`items.${index}.product_name`, productsMap.get(event.target.value)?.name ?? "");
                    }}
                    className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                  >
                    <option value="">Selecione</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Qtd.</Label>
                  <Input type="number" step="0.001" min="1" {...register(`items.${index}.quantity`)} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Observações</Label>
                  <Textarea {...register(`items.${index}.notes`)} />
                </div>
                <input type="hidden" {...register(`items.${index}.product_name`)} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações gerais</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm text-stone-500">Itens na ordem</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{items.length}</p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Criar ordem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
