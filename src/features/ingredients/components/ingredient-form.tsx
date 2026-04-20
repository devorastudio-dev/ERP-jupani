"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createIngredientAction, updateIngredientAction } from "@/features/ingredients/actions";
import { ingredientSchema } from "@/features/ingredients/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IngredientRow, NamedCategory } from "@/types/entities";

interface IngredientFormProps {
  categories: NamedCategory[];
  ingredient?: IngredientRow | null;
  onSuccess?: () => void;
}

export function IngredientForm({ categories, ingredient, onSuccess }: IngredientFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      category_id: "",
      unit: "",
      stock_quantity: 0,
      minimum_stock: 0,
      average_cost: 0,
      expiration_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    reset({
      name: ingredient?.name ?? "",
      category_id: ingredient?.category_id ?? "",
      unit: ingredient?.unit ?? "",
      stock_quantity: Number(ingredient?.stock_quantity ?? 0),
      minimum_stock: Number(ingredient?.minimum_stock ?? 0),
      average_cost: Number(ingredient?.average_cost ?? 0),
      expiration_date: ingredient?.expiration_date ?? "",
      notes: ingredient?.notes ?? "",
    });
  }, [ingredient, reset]);

  const currentStock = Number(watch("stock_quantity") ?? 0);
  const minimumStock = Number(watch("minimum_stock") ?? 0);
  const averageCost = Number(watch("average_cost") ?? 0);
  const stockValue = currentStock * averageCost;

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, String(value ?? ""));
      });

      const result = ingredient?.id
        ? await updateIngredientAction(ingredient.id, formData)
        : await createIngredientAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o insumo.");
        return;
      }

      toast.success(ingredient?.id ? "Insumo atualizado com sucesso." : "Insumo cadastrado com sucesso.");
      if (!ingredient?.id) {
        reset({
          name: "",
          category_id: "",
          unit: "",
          stock_quantity: 0,
          minimum_stock: 0,
          average_cost: 0,
          expiration_date: "",
          notes: "",
        });
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff9f6] to-[#fff1f0] p-4 md:col-span-2">
        <p className="text-sm font-medium text-stone-700">Resumo rápido</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Estoque atual</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{currentStock.toFixed(3)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Estoque mínimo</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{minimumStock.toFixed(3)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Valor em estoque</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stockValue)}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unidade</Label>
        <Input id="unit" placeholder="kg, g, l, un" {...register("unit")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          {...register("category_id")}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="">Selecione</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock_quantity">Estoque atual</Label>
        <Input id="stock_quantity" type="number" step="0.001" min="0" {...register("stock_quantity")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minimum_stock">Estoque mínimo</Label>
        <Input id="minimum_stock" type="number" step="0.001" min="0" {...register("minimum_stock")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="average_cost">Custo médio</Label>
        <Input id="average_cost" type="number" step="0.01" min="0" {...register("average_cost")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiration_date">Validade</Label>
        <Input id="expiration_date" type="date" {...register("expiration_date")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : ingredient?.id ? "Atualizar insumo" : "Salvar insumo"}
        </Button>
      </div>
    </form>
  );
}
