"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRecipeAction, updateRecipeAction } from "@/features/recipes/actions";
import { calculateRecipeNutrition } from "@/features/recipes/lib/nutrition";
import { recipeSchema } from "@/features/recipes/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { areUnitsCompatible, convertQuantity, getCompatibleUnits } from "@/lib/measurement";
import { formatCurrency } from "@/lib/utils";
import type { IngredientRow, ProductRow, RecipeRow } from "@/types/entities";

interface RecipeFormProps {
  products: ProductRow[];
  ingredients: IngredientRow[];
  recipe?: RecipeRow | null;
  onSuccess?: () => void;
}

export function RecipeForm({
  products,
  ingredients,
  recipe,
  onSuccess,
}: RecipeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
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
  const selectedProductId = watch("product_id");

  const ingredientsMap = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients],
  );

  useEffect(() => {
    reset({
      product_id: recipe?.product_id ?? "",
      packaging_cost: Number(recipe?.packaging_cost ?? 0),
      additional_cost: Number(recipe?.additional_cost ?? 0),
      notes: recipe?.notes ?? "",
      items:
        recipe?.recipe_items?.map((item) => ({
          ingredient_id: item.ingredient_id,
          unit: item.unit,
          quantity: Number(item.quantity ?? 1),
        })) ?? [{ ingredient_id: "", unit: "g", quantity: 1 }],
    });
  }, [recipe, reset]);

  const ingredientCost = items.reduce((sum, item) => {
    const ingredient = ingredientsMap.get(item.ingredient_id);
    if (!ingredient) {
      return sum;
    }

    const convertedQuantity = convertQuantity(Number(item.quantity ?? 0), item.unit, ingredient.unit);
    const safeQuantity =
      convertedQuantity ?? (areUnitsCompatible(item.unit, ingredient.unit) ? Number(item.quantity ?? 0) : 0);

    return sum + Number(ingredient.average_cost ?? 0) * safeQuantity;
  }, 0);

  const totalCost = ingredientCost + Number(packagingCost) + Number(additionalCost);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const nutritionPreview = calculateRecipeNutrition({
    items: items.map((item) => ({
      ingredient_id: item.ingredient_id,
      unit: item.unit,
      quantity: Number(item.quantity ?? 0),
    })),
    ingredientsMap,
    yieldQuantity: Number(selectedProduct?.yield_quantity ?? 0),
    yieldUnit: selectedProduct?.unit,
    panShapeCode: selectedProduct?.pan_shape_code,
    servingReferenceQuantity: Number(selectedProduct?.serving_reference_quantity ?? 0),
    servingReferenceUnit: selectedProduct?.serving_reference_unit,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("product_id", values.product_id);
      formData.set("packaging_cost", String(values.packaging_cost));
      formData.set("additional_cost", String(values.additional_cost));
      formData.set("notes", values.notes ?? "");
      formData.set("items", JSON.stringify(values.items));

      const result = recipe?.id ? await updateRecipeAction(recipe.id, formData) : await createRecipeAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar a ficha técnica.");
        return;
      }

      toast.success(recipe?.id ? "Ficha técnica atualizada com sucesso." : "Ficha técnica salva com sucesso.");
      if (!recipe?.id) {
        reset({
          packaging_cost: 0,
          additional_cost: 0,
          notes: "",
          items: [{ ingredient_id: "", unit: "g", quantity: 1 }],
        });
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe?.id ? "Editar ficha técnica" : "Nova ficha técnica"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
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
                const unitOptions = getCompatibleUnits(selectedIngredient?.unit ?? items[index]?.unit ?? "g");
                const convertedQuantity =
                  selectedIngredient && items[index]?.unit
                    ? convertQuantity(Number(items[index]?.quantity ?? 0), items[index]?.unit, selectedIngredient.unit)
                    : null;
                const hasUnitMismatch =
                  selectedIngredient && items[index]?.unit
                    ? !areUnitsCompatible(items[index]?.unit, selectedIngredient.unit)
                    : false;
                const safeQuantity =
                  convertedQuantity ?? (hasUnitMismatch ? 0 : Number(items[index]?.quantity ?? 0));
                const currentCost = Number(selectedIngredient?.average_cost ?? 0) * safeQuantity;

                return (
                  <div key={field.id} className="grid gap-3 rounded-3xl border border-rose-100 p-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(110px,0.58fr)_minmax(120px,0.58fr)_auto]">
                    <div className="space-y-2">
                      <Label>Insumo</Label>
                      <select
                        {...register(`items.${index}.ingredient_id`)}
                        onChange={(event) => {
                          const ingredient = ingredientsMap.get(event.target.value);
                          setValue(`items.${index}.ingredient_id`, event.target.value);
                          if (ingredient) {
                            setValue(`items.${index}.unit`, ingredient.unit);
                          }
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
                      <Label>Unidade</Label>
                      <select
                        {...register(`items.${index}.unit`)}
                        className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`)} />
                    </div>
                    <div className="flex items-end justify-between gap-2 xl:justify-end">
                      <div className="text-left xl:text-right">
                        <p className="text-xs text-stone-500">Custo</p>
                        <p className="text-sm font-semibold text-stone-800">{formatCurrency(currentCost)}</p>
                        {selectedIngredient ? (
                          <p className={`mt-1 text-xs ${hasUnitMismatch ? "text-red-600" : "text-stone-500"}`}>
                            {hasUnitMismatch
                              ? `Unidade incompatível com o insumo base em ${selectedIngredient.unit}.`
                              : convertedQuantity !== null
                                ? `${Number(items[index]?.quantity ?? 0)} ${items[index]?.unit} viram ${convertedQuantity.toFixed(3)} ${selectedIngredient.unit}.`
                                : `Custo base em ${selectedIngredient.unit}.`}
                          </p>
                        ) : null}
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
          <div className="rounded-2xl bg-[#fff8f4] p-4">
            <p className="text-sm text-stone-500">Nutrição estimada em tela</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {nutritionPreview.estimatedKcalTotal.toFixed(0)} kcal totais
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {nutritionPreview.estimatedServings > 0
                ? `${nutritionPreview.estimatedServings.toFixed(1)} pessoas · ${nutritionPreview.estimatedKcalPerServing.toFixed(0)} kcal por porção`
                : "Defina rendimento e consumo por pessoa no produto para calcular as porções."}
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : recipe?.id ? "Atualizar ficha técnica" : "Salvar ficha técnica"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
