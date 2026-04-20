"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProductAction } from "@/features/products/actions";
import { productSchema } from "@/features/products/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NamedCategory } from "@/types/entities";

export function ProductForm({ categories }: { categories: NamedCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      estimated_cost: 0,
      yield_quantity: 1,
      fulfillment_type: "sob_encomenda",
      is_active: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, String(value ?? ""));
      });

      const result = await createProductAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o produto.");
        return;
      }

      toast.success("Produto cadastrado com sucesso.");
      reset();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff8f4] to-[#fff1ef] p-4 xl:col-span-2">
        <p className="text-sm font-medium text-stone-700">Ficha comercial</p>
        <p className="mt-1 text-sm text-stone-500">
          Cadastre preço, rendimento, categoria e tipo de atendimento sem apertar o formulário em telas médias.
        </p>
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale_price">Preço de venda</Label>
        <Input id="sale_price" type="number" step="0.01" min="0" {...register("sale_price")} />
        {errors.sale_price ? <p className="text-sm text-red-600">{errors.sale_price.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="estimated_cost">Custo estimado</Label>
        <Input id="estimated_cost" type="number" step="0.01" min="0" {...register("estimated_cost")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unidade</Label>
        <Input id="unit" placeholder="un, kg, bandeja" {...register("unit")} />
        {errors.unit ? <p className="text-sm text-red-600">{errors.unit.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="yield_quantity">Rendimento</Label>
        <Input id="yield_quantity" type="number" step="0.01" min="0" {...register("yield_quantity")} />
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
        <Label htmlFor="fulfillment_type">Tipo</Label>
        <select
          id="fulfillment_type"
          {...register("fulfillment_type")}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="sob_encomenda">Sob encomenda</option>
          <option value="pronta_entrega">Pronta entrega</option>
        </select>
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 xl:col-span-2">
        <input type="checkbox" value="true" defaultChecked {...register("is_active")} />
        Produto ativo
      </label>
      <div className="xl:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar produto"}
        </Button>
      </div>
    </form>
  );
}
