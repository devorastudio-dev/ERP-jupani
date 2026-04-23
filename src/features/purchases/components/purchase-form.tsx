"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseAction, updatePurchaseAction } from "@/features/purchases/actions";
import { purchaseSchema } from "@/features/purchases/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  areUnitsCompatible,
  convertQuantity,
  convertUnitCost,
  getCompatibleUnits,
} from "@/lib/measurement";
import { formatCurrency } from "@/lib/utils";
import type { IngredientRow, PurchaseRow, SupplierRow } from "@/types/entities";

const purchaseStatusOptions = ["rascunho", "aprovada", "recebida", "cancelada"] as const;

interface PurchaseFormProps {
  suppliers: SupplierRow[];
  ingredients: IngredientRow[];
  purchase?: PurchaseRow | null;
  onSuccess?: () => void;
}

export function PurchaseForm({
  suppliers,
  ingredients,
  purchase,
  onSuccess,
}: PurchaseFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchase_date: new Date().toISOString().slice(0, 10),
      status: "rascunho",
      generate_payable: true,
      items: [{ ingredient_id: "", ingredient_name: "", quantity: 1, purchase_unit: "", unit_cost: 0, total_cost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const ingredientsMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);
  const suppliersMap = useMemo(() => new Map(suppliers.map((item) => [item.id, item])), [suppliers]);
  const total = items.reduce((sum, item) => sum + Number(item.total_cost ?? 0), 0);

  useEffect(() => {
    reset({
      supplier_id: purchase?.supplier_id ?? "",
      supplier_name: purchase?.supplier_name ?? "",
      purchase_date: purchase?.purchase_date ?? new Date().toISOString().slice(0, 10),
      status: purchaseStatusOptions.includes((purchase?.status ?? "rascunho") as (typeof purchaseStatusOptions)[number])
        ? ((purchase?.status ?? "rascunho") as (typeof purchaseStatusOptions)[number])
        : "rascunho",
      payment_method: purchase?.payment_method ?? "",
      notes: purchase?.notes ?? "",
      generate_payable: purchase?.generate_payable ?? true,
      items:
        purchase?.purchase_items?.map((item) => ({
          ingredient_id: item.ingredient_id ?? "",
          ingredient_name: item.ingredient_name,
          quantity: Number(item.quantity ?? 1),
          purchase_unit: item.purchase_unit ?? ingredientsMap.get(item.ingredient_id ?? "")?.unit ?? "",
          unit_cost: Number(item.unit_cost ?? 0),
          total_cost: Number(item.total_cost ?? 0),
        })) ?? [{ ingredient_id: "", ingredient_name: "", quantity: 1, purchase_unit: "", unit_cost: 0, total_cost: 0 }],
    });
  }, [ingredientsMap, purchase, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("supplier_id", values.supplier_id);
      formData.set("supplier_name", values.supplier_name);
      formData.set("purchase_date", values.purchase_date);
      formData.set("status", values.status);
      formData.set("payment_method", values.payment_method ?? "");
      formData.set("notes", values.notes ?? "");
      formData.set("generate_payable", String(values.generate_payable));
      formData.set("items", JSON.stringify(values.items));

      const result = purchase?.id ? await updatePurchaseAction(purchase.id, formData) : await createPurchaseAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar a compra.");
        return;
      }

      toast.success(purchase?.id ? "Compra atualizada com sucesso." : "Compra registrada com sucesso.");
      if (!purchase?.id) {
        reset();
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{purchase?.id ? "Editar compra" : "Nova compra"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff8f5] to-[#fff0ee] p-4">
            <p className="text-sm font-medium text-stone-700">Resumo da compra</p>
            <p className="mt-1 text-sm text-stone-500">O sistema agora converte a unidade da compra para a unidade base do insumo ao atualizar estoque e custo.</p>
            <p className="mt-3 text-2xl font-semibold text-stone-900">{formatCurrency(total)}</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Fornecedor</Label>
              <select
                id="supplier_id"
                {...register("supplier_id")}
                onChange={(event) => {
                  setValue("supplier_id", event.target.value);
                  setValue("supplier_name", suppliersMap.get(event.target.value)?.name ?? "");
                }}
                className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
              >
                <option value="">Selecione</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id ? <p className="text-sm text-red-600">{errors.supplier_id.message as string}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data da compra</Label>
              <Input id="purchase_date" type="date" {...register("purchase_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" {...register("status")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="rascunho">Rascunho</option>
                <option value="aprovada">Aprovada</option>
                <option value="recebida">Recebida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de pagamento</Label>
              <select id="payment_method" {...register("payment_method")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="">Selecione</option>
                <option value="boleto">Boleto</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de crédito</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Itens da compra</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ingredient_id: "", ingredient_name: "", quantity: 1, purchase_unit: "", unit_cost: 0, total_cost: 0 })}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
            {fields.map((field, index) => {
              const item = items[index];
              const selectedIngredient = ingredientsMap.get(item?.ingredient_id);
              const compatibleUnits = getCompatibleUnits(selectedIngredient?.unit ?? item?.purchase_unit ?? "");
              const purchaseUnit = item?.purchase_unit ?? selectedIngredient?.unit ?? "";
              const convertedQuantity =
                selectedIngredient && purchaseUnit
                  ? convertQuantity(Number(item?.quantity ?? 0), purchaseUnit, selectedIngredient.unit)
                  : null;
              const convertedUnitCost =
                selectedIngredient && purchaseUnit
                  ? convertUnitCost(Number(item?.unit_cost ?? 0), purchaseUnit, selectedIngredient.unit)
                  : null;
              const hasUnitMismatch =
                selectedIngredient && purchaseUnit
                  ? !areUnitsCompatible(purchaseUnit, selectedIngredient.unit)
                  : false;

              return (
                <div key={field.id} className="grid gap-3 rounded-3xl border border-rose-100 p-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(110px,0.45fr)_minmax(100px,0.42fr)_minmax(130px,0.6fr)_minmax(150px,0.7fr)_auto]">
                  <div className="space-y-2">
                    <Label>Insumo</Label>
                    <select
                      {...register(`items.${index}.ingredient_id`)}
                      onChange={(event) => {
                        const ingredient = ingredientsMap.get(event.target.value);
                        const nextUnit = ingredient?.unit ?? "";
                        setValue(`items.${index}.ingredient_id`, event.target.value);
                        setValue(`items.${index}.ingredient_name`, ingredient?.name ?? "");
                        setValue(`items.${index}.purchase_unit`, nextUnit);
                      }}
                      className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                    >
                      <option value="">Selecione</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Qtd.</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      {...register(`items.${index}.quantity`)}
                      onChange={(event) => {
                        const quantity = Number(event.target.value);
                        setValue(`items.${index}.quantity`, quantity);
                        const unitCost = Number(items[index]?.unit_cost ?? 0);
                        setValue(`items.${index}.total_cost`, quantity * unitCost);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unid.</Label>
                    <select
                      {...register(`items.${index}.purchase_unit`)}
                      className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                    >
                      <option value="">Selecione</option>
                      {compatibleUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Custo unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unit_cost`)}
                      onChange={(event) => {
                        const unitCost = Number(event.target.value);
                        setValue(`items.${index}.unit_cost`, unitCost);
                        const quantity = Number(items[index]?.quantity ?? 1);
                        setValue(`items.${index}.total_cost`, quantity * unitCost);
                      }}
                    />
                  </div>
                  <div className="flex items-end justify-between xl:justify-start">
                    <div>
                      <p className="text-xs text-stone-500">Total</p>
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(Number(item?.total_cost ?? 0))}
                      </p>
                      {selectedIngredient ? (
                        <p className={`mt-1 text-xs ${hasUnitMismatch ? "text-red-600" : "text-stone-500"}`}>
                          {hasUnitMismatch
                            ? `Unidade incompatível com o estoque em ${selectedIngredient.unit}.`
                            : convertedQuantity !== null && convertedUnitCost !== null
                              ? `${Number(item?.quantity ?? 0)} ${purchaseUnit} viram ${convertedQuantity.toFixed(3)} ${selectedIngredient.unit} a ${formatCurrency(convertedUnitCost)}/${selectedIngredient.unit}.`
                              : `Estoque base em ${selectedIngredient.unit}.`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <input type="hidden" {...register(`items.${index}.ingredient_name`)} />
                  <input type="hidden" {...register(`items.${index}.total_cost`)} />
                </div>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" value="true" defaultChecked {...register("generate_payable")} />
            Gerar conta a pagar
          </label>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <div className="rounded-3xl bg-rose-50 p-4">
            <p className="text-sm text-stone-500">Total estimado da compra</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{formatCurrency(total)}</p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : purchase?.id ? "Atualizar compra" : "Registrar compra"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
