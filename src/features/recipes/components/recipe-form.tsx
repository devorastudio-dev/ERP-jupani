"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRecipeAction } from "@/features/recipes/actions";
import { recipeSchema } from "@/features/recipes/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { IngredientRow, ProductRow } from "@/types/entities";

export function RecipeForm({
  products,
  ingredients,
}: {
  products: ProductRow[];
  ingredients: IngredientRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      packaging_cost: 0,
      additional_cost: 0,
      items: [{ ingredient_id: "", unit: "g", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const packagingCost = watch("packaging_cost") ?? 0;
  const additionalCost = watch("additional_cost") ?? 0;

  const ingredientsMap = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients],
  );

  const ingredientCost = items.reduce((sum, item) => {
    const ingredient = ingredientsMap.get(item.ingredient_id);
    return sum + Number(ingredient?.average_cost ?? 0) * Number(item.quantity ?? 0);
  }, 0);

  const totalCost = ingredientCost + Number(packagingCost) + Number(additionalCost);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("product_id", values.product_id);
      formData.set("packaging_cost", String(values.packaging_cost));
      formData.set("additional_cost", String(values.additional_cost));
      formData.set("notes", values.notes ?? "");
      formData.set("items", JSON.stringify(values.items));

      const result = await createRecipeAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar a ficha técnica.");
        return;
      }

      toast.success("Ficha técnica salva com sucesso.");
      reset({
        packaging_cost: 0,
        additional_cost: 0,
        notes: "",
        items: [{ ingredient_id: "", unit: "g", quantity: 1 }],
      });
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova ficha técnica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product_id">Produto</Label>
              <select
                id="product_id"
                {...register("product_id")}
                className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
              >
                <option value="">Selecione</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.product_id ? <p className="text-sm text-red-600">{errors.product_id.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="packaging_cost">Custo de embalagem</Label>
              <Input id="packaging_cost" type="number" step="0.01" min="0" {...register("packaging_cost")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_cost">Custo adicional</Label>
              <Input id="additional_cost" type="number" step="0.01" min="0" {...register("additional_cost")} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Insumos da receita</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ingredient_id: "", unit: "g", quantity: 1 })}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedIngredient = ingredientsMap.get(items[index]?.ingredient_id);
                const currentCost =
                  Number(selectedIngredient?.average_cost ?? 0) * Number(items[index]?.quantity ?? 0);

                return (
                  <div key={field.id} className="grid gap-3 rounded-2xl border border-rose-100 p-4 md:grid-cols-[1.6fr_0.6fr_0.6fr_auto]">
                    <div className="space-y-2">
                      <Label>Insumo</Label>
                      <select
                        {...register(`items.${index}.ingredient_id`)}
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
                      <Label>Unidade</Label>
                      <Input {...register(`items.${index}.unit`)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`)} />
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-stone-500">Custo</p>
                        <p className="text-sm font-semibold text-stone-800">{formatCurrency(currentCost)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.items ? <p className="text-sm text-red-600">{errors.items.message as string}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm text-stone-500">Custo calculado em tela</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{formatCurrency(totalCost)}</p>
            <p className="mt-1 text-xs text-stone-500">
              O banco recalcula o custo teórico oficial após salvar os itens da ficha técnica.
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar ficha técnica"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
