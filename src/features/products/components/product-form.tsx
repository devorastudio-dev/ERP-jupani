"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProductAction, updateProductAction } from "@/features/products/actions";
import { PAN_SHAPE_PRESETS, getPanShapePreset } from "@/features/products/lib/pan-shapes";
import { productSchema } from "@/features/products/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { NamedCategory, ProductRow } from "@/types/entities";

interface ProductFormProps {
  categories: NamedCategory[];
  product?: ProductRow | null;
  onSuccess?: () => void;
}

export function ProductForm({ categories, product, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      estimated_cost: 0,
      finished_stock_quantity: 0,
      minimum_finished_stock: 0,
      yield_quantity: 1,
      pan_shape_code: "",
      serving_reference_quantity: null,
      serving_reference_unit: "",
      fulfillment_type: "sob_encomenda",
      is_active: true,
      show_on_storefront: true,
      is_storefront_featured: false,
      is_storefront_favorite: false,
      is_storefront_healthy: false,
    },
  });

  useEffect(() => {
    reset({
      name: product?.name ?? "",
      category_id: product?.category_id ?? "",
      description: product?.description ?? "",
      sale_price: Number(product?.sale_price ?? 0),
      estimated_cost: Number(product?.estimated_cost ?? 0),
      finished_stock_quantity: Number(product?.finished_stock_quantity ?? 0),
      minimum_finished_stock: Number(product?.minimum_finished_stock ?? 0),
      yield_quantity: Number(product?.yield_quantity ?? 1),
      unit: product?.unit ?? "",
      pan_shape_code: product?.pan_shape_code ?? "",
      serving_reference_quantity: Number(product?.serving_reference_quantity ?? 0) || null,
      serving_reference_unit: product?.serving_reference_unit ?? "",
      public_ingredients_text: product?.public_ingredients_text ?? "",
      notes: product?.notes ?? "",
      photo_path: product?.photo_path ?? "",
      fulfillment_type: product?.fulfillment_type ?? "sob_encomenda",
      is_active: product?.is_active ?? true,
      show_on_storefront: product?.show_on_storefront ?? true,
      is_storefront_featured: product?.is_storefront_featured ?? false,
      is_storefront_favorite: product?.is_storefront_favorite ?? false,
      is_storefront_healthy: product?.is_storefront_healthy ?? false,
    });
  }, [product, reset]);

  useEffect(() => {
    setSelectedFile(null);
  }, [product]);

  const salePrice = Number(watch("sale_price") ?? 0);
  const estimatedCost = Number(watch("estimated_cost") ?? 0);
  const grossMargin = salePrice - estimatedCost;
  const marginPercent = salePrice > 0 ? (grossMargin / salePrice) * 100 : 0;
  const estimatedServings = Number(product?.estimated_servings ?? 0);
  const estimatedKcalPerServing = Number(product?.estimated_kcal_per_serving ?? 0);
  const panShapeCode = String(watch("pan_shape_code") ?? "");
  const selectedPanShape = getPanShapePreset(panShapeCode);
  const photoPath = watch("photo_path")?.trim() || "";
  const filePreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );
  const previewUrl = filePreviewUrl || photoPath || "";

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, String(value ?? ""));
      });
      if (selectedFile) {
        formData.set("uploaded_photo", selectedFile);
      }

      const result = product?.id
        ? await updateProductAction(product.id, formData)
        : await createProductAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o produto.");
        return;
      }

      toast.success(product?.id ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
      if (!product?.id) {
        reset();
        setSelectedFile(null);
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff8f4] to-[#fff1ef] p-4 xl:col-span-2">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Preço de venda</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{formatCurrency(salePrice)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Custo estimado</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{formatCurrency(estimatedCost)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Margem bruta</p>
            <p className={`mt-1 text-lg font-semibold ${grossMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {formatCurrency(grossMargin)} ({marginPercent.toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Porção estimada</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">
              {estimatedServings > 0 ? `${estimatedServings.toFixed(1)} pessoas` : "A definir"}
            </p>
            <p className="text-xs text-stone-500">
              {estimatedKcalPerServing > 0 ? `${estimatedKcalPerServing.toFixed(0)} kcal/porção` : "Sem cálculo ainda"}
            </p>
          </div>
        </div>
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
        <Label htmlFor="finished_stock_quantity">Estoque acabado</Label>
        <Input id="finished_stock_quantity" type="number" step="0.001" min="0" {...register("finished_stock_quantity")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minimum_finished_stock">Estoque mínimo acabado</Label>
        <Input id="minimum_finished_stock" type="number" step="0.001" min="0" {...register("minimum_finished_stock")} />
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
        <Label htmlFor="pan_shape_code">Tipo de forma</Label>
        <select
          id="pan_shape_code"
          {...register("pan_shape_code")}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="">Sem padrão</option>
          {PAN_SHAPE_PRESETS.map((preset) => (
            <option key={preset.code} value={preset.code}>
              {preset.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-stone-500">
          {selectedPanShape
            ? `Faixa padrão: ${selectedPanShape.minSlices} a ${selectedPanShape.maxSlices} fatias.`
            : "Se selecionar uma forma, o sistema usa a média de fatias dela para calcular as porções."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="serving_reference_quantity">Consumo por pessoa</Label>
        <Input
          id="serving_reference_quantity"
          type="number"
          step="0.01"
          min="0"
          {...register("serving_reference_quantity")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="serving_reference_unit">Unidade por pessoa</Label>
        <Input id="serving_reference_unit" placeholder="g, ml, un" {...register("serving_reference_unit")} />
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
        <p className="text-xs text-stone-500">
          Se houver forma selecionada, ela tem prioridade no cálculo. Sem forma, o sistema usa rendimento total e consumo por pessoa.
        </p>
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="public_ingredients_text">Ingredientes exibidos no site</Label>
        <Textarea
          id="public_ingredients_text"
          rows={3}
          placeholder="Ex: ovos, leite, farinha de trigo, açúcar cristal"
          {...register("public_ingredients_text")}
        />
        <p className="text-xs text-stone-500">
          Se este campo ficar vazio, o site usa automaticamente os nomes dos insumos da ficha técnica.
        </p>
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="photo_path">Imagem do site</Label>
        <Input id="photo_path" placeholder="/images/products/bolo-red-velvet.svg" {...register("photo_path")} />
        <p className="text-xs text-stone-500">
          Você pode colar uma URL/caminho manual ou enviar uma nova imagem abaixo.
        </p>
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="uploaded_photo">Upload de foto</Label>
        <Input
          id="uploaded_photo"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-stone-500">
          JPG, PNG ou WEBP com até 5 MB. Se enviar um arquivo, ele passa a valer no lugar da URL manual.
        </p>
      </div>
      <div className="xl:col-span-2 rounded-3xl border border-rose-100 bg-[#fff8f4] p-4">
        <p className="text-sm font-medium text-stone-700">Preview da imagem</p>
        {previewUrl ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-rose-100 bg-white">
              <Image
                src={previewUrl}
                alt="Preview da imagem do produto"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="space-y-1 text-sm text-stone-500">
              <p>{selectedFile ? "Preview do arquivo selecionado" : "Imagem atualmente configurada"}</p>
              <p className="break-all text-xs">{previewUrl}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">
            Nenhuma imagem definida ainda. O site usará a imagem padrão da categoria até você configurar uma.
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 xl:col-span-2">
        <input type="checkbox" value="true" {...register("is_active")} />
        Produto ativo
      </label>
      <div className="grid gap-3 rounded-3xl border border-rose-100 bg-[#fff8f4] p-4 xl:col-span-2 md:grid-cols-4">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("show_on_storefront")} />
          Publicar no site
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("is_storefront_featured")} />
          Destaque da semana
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("is_storefront_favorite")} />
          Favorito da casa
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("is_storefront_healthy")} />
          Doce fitness
        </label>
      </div>
      <div className="xl:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : product?.id ? "Atualizar produto" : "Salvar produto"}
        </Button>
      </div>
    </form>
  );
}
