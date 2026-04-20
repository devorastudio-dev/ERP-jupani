"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createIngredientAction } from "@/features/ingredients/actions";
import { ingredientSchema } from "@/features/ingredients/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NamedCategory } from "@/types/entities";

export function IngredientForm({ categories }: { categories: NamedCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      stock_quantity: 0,
      minimum_stock: 0,
      average_cost: 0,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, String(value ?? ""));
      });

      const result = await createIngredientAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o insumo.");
        return;
      }

      toast.success("Insumo cadastrado com sucesso.");
      reset();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
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
          {pending ? "Salvando..." : "Salvar insumo"}
        </Button>
      </div>
    </form>
  );
}
