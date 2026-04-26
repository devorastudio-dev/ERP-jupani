"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useState, useTransition } from "react";
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

const PACKAGING_HINT_TERMS = [
  "embalag",
  "caixa",
  "pote",
  "tampa",
  "fita",
  "sacola",
  "frasco",
  "rotulo",
  "rótulo",
  "colher",
  "garfo",
  "faca",
  "copo",
  "bandeja",
  "papel",
  "forminha",
  "acetato",
  "laco",
  "laço",
  "tag",
];

function isPackagingIngredient(ingredient: IngredientRow) {
  const categoryName = ingredient.categories?.name?.toLowerCase() ?? "";
  const ingredientName = ingredient.name.toLowerCase();

  return PACKAGING_HINT_TERMS.some(
    (term) => categoryName.includes(term) || ingredientName.includes(term),
  );
}

function formatIngredientOptionLabel(ingredient: IngredientRow) {
  return ingredient.categories?.name
    ? `${ingredient.name} • ${ingredient.categories.name}`
    : ingredient.name;
}

export function RecipeForm({
  products,
  ingredients,
  recipe,
  onSuccess,
}: RecipeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAllPackagingIngredients, setShowAllPackagingIngredients] = useState(false);
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
      packaging_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const {
    fields: packagingFields,
    append: appendPackaging,
    remove: removePackaging,
  } = useFieldArray({
    control,
    name: "packaging_items",
  });

  const items = watch("items") ?? [];
  const packagingItems = watch("packaging_items") ?? [];
  const packagingCost = watch("packaging_cost") ?? 0;
  const additionalCost = watch("additional_cost") ?? 0;
  const selectedProductId = watch("product_id");

  const ingredientsMap = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients],
  );
  const packagingIngredients = useMemo(
    () => ingredients.filter((ingredient) => isPackagingIngredient(ingredient)),
    [ingredients],
  );
  const packagingIngredientOptions =
    showAllPackagingIngredients || packagingIngredients.length === 0
      ? ingredients
      : packagingIngredients;

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
      packaging_items:
        recipe?.recipe_packaging_items?.map((item) => ({
          ingredient_id: item.ingredient_id,
          unit: item.unit,
          quantity: Number(item.quantity ?? 1),
        })) ?? [],
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
  const packagingItemsCost = packagingItems.reduce((sum, item) => {
    const ingredient = ingredientsMap.get(item.ingredient_id);
    if (!ingredient) {
      return sum;
    }

    const convertedQuantity = convertQuantity(Number(item.quantity ?? 0), item.unit, ingredient.unit);
    const safeQuantity =
      convertedQuantity ?? (areUnitsCompatible(item.unit, ingredient.unit) ? Number(item.quantity ?? 0) : 0);

    return sum + Number(ingredient.average_cost ?? 0) * safeQuantity;
  }, 0);

  const totalCost = ingredientCost + packagingItemsCost + Number(packagingCost) + Number(additionalCost);
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
      formData.set("packaging_items", JSON.stringify(values.packaging_items ?? []));

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
          packaging_items: [],
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
              <Label htmlFor="packaging_cost">Custo extra de embalagem</Label>
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
                            {formatIngredientOptionLabel(ingredient)}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-900">Insumos de embalagem</h3>
                <p className="text-xs text-stone-500">
                  Use esta seção para descontar caixas, potes, fitas e outros itens do estoque.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPackaging({ ingredient_id: "", unit: "un", quantity: 1 })}
              >
                <Plus className="h-4 w-4" />
                Adicionar embalagem
              </Button>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm text-stone-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAllPackagingIngredients}
                  onChange={(event) => setShowAllPackagingIngredients(event.target.checked)}
                  className="h-4 w-4 rounded border-emerald-200 text-emerald-600"
                />
                Mostrar todos os insumos no seletor de embalagem
              </label>
              {!showAllPackagingIngredients && packagingIngredients.length > 0 ? (
                <p className="text-xs text-emerald-700">
                  Mostrando primeiro os insumos que parecem ser embalagens com base no nome ou categoria.
                </p>
              ) : null}
              {!showAllPackagingIngredients && packagingIngredients.length === 0 ? (
                <p className="text-xs text-amber-700">
                  Nenhum insumo com perfil de embalagem foi identificado automaticamente. Ative a opção acima para ver todos.
                </p>
              ) : null}
            </div>
            <div className="space-y-3">
              {packagingFields.length ? (
                packagingFields.map((field, index) => {
                  const selectedIngredient = ingredientsMap.get(packagingItems[index]?.ingredient_id);
                  const unitOptions = getCompatibleUnits(selectedIngredient?.unit ?? packagingItems[index]?.unit ?? "un");
                  const convertedQuantity =
                    selectedIngredient && packagingItems[index]?.unit
                      ? convertQuantity(Number(packagingItems[index]?.quantity ?? 0), packagingItems[index]?.unit, selectedIngredient.unit)
                      : null;
                  const hasUnitMismatch =
                    selectedIngredient && packagingItems[index]?.unit
                      ? !areUnitsCompatible(packagingItems[index]?.unit, selectedIngredient.unit)
                      : false;
                  const safeQuantity =
                    convertedQuantity ?? (hasUnitMismatch ? 0 : Number(packagingItems[index]?.quantity ?? 0));
                  const currentCost = Number(selectedIngredient?.average_cost ?? 0) * safeQuantity;

                  return (
                    <div key={field.id} className="grid gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(110px,0.58fr)_minmax(120px,0.58fr)_auto]">
                      <div className="space-y-2">
                        <Label>Insumo de embalagem</Label>
                        <select
                          {...register(`packaging_items.${index}.ingredient_id`)}
                          onChange={(event) => {
                            const ingredient = ingredientsMap.get(event.target.value);
                            setValue(`packaging_items.${index}.ingredient_id`, event.target.value);
                            if (ingredient) {
                              setValue(`packaging_items.${index}.unit`, ingredient.unit);
                            }
                          }}
                          className="flex h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm"
                        >
                          <option value="">Selecione</option>
                          {packagingIngredientOptions.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {formatIngredientOptionLabel(ingredient)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unidade</Label>
                        <select
                          {...register(`packaging_items.${index}.unit`)}
                          className="flex h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm"
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
                        <Input type="number" step="0.001" min="0.001" {...register(`packaging_items.${index}.quantity`)} />
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
                                  ? `${Number(packagingItems[index]?.quantity ?? 0)} ${packagingItems[index]?.unit} viram ${convertedQuantity.toFixed(3)} ${selectedIngredient.unit}.`
                                  : `Custo base em ${selectedIngredient.unit}.`}
                            </p>
                          ) : null}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePackaging(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-200 p-4 text-sm text-stone-500">
                  Nenhum insumo de embalagem vinculado. Se preferir, você ainda pode usar só o custo extra de embalagem acima.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm text-stone-500">Custo calculado em tela</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{formatCurrency(totalCost)}</p>
            <p className="mt-1 text-xs text-stone-500">
              O banco recalcula o custo teórico oficial após salvar insumos da receita e de embalagem.
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
