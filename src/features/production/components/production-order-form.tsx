"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProductionOrderAction, updateProductionOrderAction } from "@/features/production/actions";
import { productionOrderSchema } from "@/features/production/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductRow, ProductionOrderRow, SaleSummaryRow } from "@/types/entities";

interface ProductionOrderFormProps {
  sales: SaleSummaryRow[];
  products: ProductRow[];
  order?: ProductionOrderRow | null;
  onSuccess?: () => void;
}

export function ProductionOrderForm({
  sales,
  products,
  order,
  onSuccess,
}: ProductionOrderFormProps) {
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

  useEffect(() => {
    reset({
      sale_id: order?.sale_id ?? "",
      deadline: order?.deadline ? new Date(order.deadline).toISOString().slice(0, 16) : "",
      status: (order?.status as "pendente" | "em_producao" | "finalizado" | "cancelado") ?? "pendente",
      notes: order?.notes ?? "",
      items:
        order?.production_order_items?.map((item) => ({
          product_id: item.product_id ?? "",
          product_name: item.product_name,
          quantity: Number(item.quantity ?? 1),
          notes: item.notes ?? "",
        })) ?? [{ product_id: "", product_name: "", quantity: 1 }],
    });
  }, [order, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sale_id", values.sale_id ?? "");
      formData.set("deadline", values.deadline ?? "");
      formData.set("status", values.status);
      formData.set("notes", values.notes ?? "");
      formData.set("items", JSON.stringify(values.items));

      const result = order?.id
        ? await updateProductionOrderAction(order.id, formData)
        : await createProductionOrderAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar a ordem.");
        return;
      }

      toast.success(order?.id ? "Ordem de produção atualizada." : "Ordem de produção criada.");
      if (!order?.id) {
        reset();
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{order?.id ? "Editar ordem de produção" : "Nova ordem de produção"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
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
              <div key={field.id} className="grid gap-3 rounded-3xl border border-rose-100 p-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(110px,0.55fr)_auto]">
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
                <div className="space-y-2 xl:col-span-3">
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
            {pending ? "Salvando..." : order?.id ? "Atualizar ordem" : "Criar ordem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
