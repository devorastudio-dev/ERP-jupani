"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProductAction, updateProductAction } from "@/features/products/actions";
import { productSchema } from "@/features/products/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { NamedCategory, PanShapeRow, ProductRow } from "@/types/entities";

interface ProductFormProps {
  categories: NamedCategory[];
  panShapes: PanShapeRow[];
  product?: ProductRow | null;
  onSuccess?: () => void;
}

export function ProductForm({ categories, panShapes, product, onSuccess }: ProductFormProps) {
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
      product_line: "geral",
      order_mode: "sob_encomenda",
      minimum_order_quantity: null,
      minimum_order_unit: "",
      lead_time_hours: null,
      accepts_flavor_selection: false,
      accepts_size_selection: false,
      accepts_theme_customization: false,
      accepts_custom_message: false,
      accepts_event_date: false,
      accepts_serving_count: false,
      accepts_variant_notes: false,
      requires_manual_quote: false,
      order_guidelines: "",
      storefront_section_title: "",
      storefront_badge_text: "",
      fulfillment_type: "sob_encomenda",
      is_active: true,
      show_on_storefront: true,
      is_storefront_featured: false,
      is_storefront_favorite: false,
      is_storefront_healthy: false,
      is_storefront_lactose_free: false,
      is_storefront_gluten_free: false,
      category_ids: [],
    },
  });

  useEffect(() => {
    reset({
      name: product?.name ?? "",
      category_id: product?.category_id ?? "",
      category_ids: product?.category_ids ?? [],
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
      product_line: product?.product_line ?? "geral",
      order_mode: product?.order_mode ?? "sob_encomenda",
      minimum_order_quantity: Number(product?.minimum_order_quantity ?? 0) || null,
      minimum_order_unit: product?.minimum_order_unit ?? "",
      lead_time_hours: Number(product?.lead_time_hours ?? 0) || null,
      accepts_flavor_selection: product?.accepts_flavor_selection ?? false,
      accepts_size_selection: product?.accepts_size_selection ?? false,
      accepts_theme_customization: product?.accepts_theme_customization ?? false,
      accepts_custom_message: product?.accepts_custom_message ?? false,
      accepts_event_date: product?.accepts_event_date ?? false,
      accepts_serving_count: product?.accepts_serving_count ?? false,
      accepts_variant_notes: product?.accepts_variant_notes ?? false,
      requires_manual_quote: product?.requires_manual_quote ?? false,
      order_guidelines: product?.order_guidelines ?? "",
      storefront_section_title: product?.storefront_section_title ?? "",
      storefront_badge_text: product?.storefront_badge_text ?? "",
      fulfillment_type: product?.fulfillment_type ?? "sob_encomenda",
      is_active: product?.is_active ?? true,
      show_on_storefront: product?.show_on_storefront ?? true,
      is_storefront_featured: product?.is_storefront_featured ?? false,
      is_storefront_favorite: product?.is_storefront_favorite ?? false,
      is_storefront_healthy: product?.is_storefront_healthy ?? false,
      is_storefront_lactose_free: product?.is_storefront_lactose_free ?? false,
      is_storefront_gluten_free: product?.is_storefront_gluten_free ?? false,
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
  const selectedPanShape = panShapes.find((panShape) => panShape.code === panShapeCode) ?? null;
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
        if (key === "category_ids" && Array.isArray(value)) {
          value
            .filter((item): item is string => typeof item === "string" && item.length > 0)
            .forEach((item) => formData.append("category_ids", item));
          return;
        }

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
          {panShapes.map((panShape) => (
            <option key={panShape.code} value={panShape.code}>
              {panShape.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-stone-500">
          {selectedPanShape
            ? `Rendimento estimado da forma: ${Number(selectedPanShape.estimated_servings).toFixed(1)} porções.`
            : "Se selecionar uma forma, o sistema usa o rendimento cadastrado nela para calcular as porções."}
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
        <Label htmlFor="category_id">Categoria principal</Label>
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
      <div className="space-y-2 xl:col-span-2">
        <Label>Multicategorias</Label>
        <div className="grid gap-3 rounded-3xl border border-rose-100 bg-[#fff8f4] p-4 md:grid-cols-2">
          {categories.length ? (
            categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" value={category.id} {...register("category_ids")} />
                {category.name}
              </label>
            ))
          ) : (
            <p className="text-sm text-stone-500">Cadastre categorias para vincular ao produto.</p>
          )}
        </div>
        <p className="text-xs text-stone-500">
          Você pode marcar várias categorias. A categoria principal acima será usada como referência principal no sistema.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="product_line">Linha comercial</Label>
        <select
          id="product_line"
          {...register("product_line")}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="geral">Geral</option>
          <option value="bolos_aniversario">Bolos de aniversario</option>
          <option value="docinhos">Docinhos</option>
          <option value="merendas">Merendas</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="order_mode">Modo de pedido</Label>
        <select
          id="order_mode"
          {...register("order_mode")}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="sob_encomenda">Sob encomenda</option>
          <option value="pronta_entrega">Pronta entrega</option>
          <option value="ambos">Ambos</option>
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
      <div className="space-y-2">
        <Label htmlFor="lead_time_hours">Antecedencia minima</Label>
        <Input id="lead_time_hours" type="number" step="1" min="0" placeholder="Horas" {...register("lead_time_hours")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minimum_order_quantity">Quantidade minima</Label>
        <Input
          id="minimum_order_quantity"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ex: 50"
          {...register("minimum_order_quantity")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minimum_order_unit">Unidade minima</Label>
        <Input id="minimum_order_unit" placeholder="un, cento, kg, caixa" {...register("minimum_order_unit")} />
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="order_guidelines">Regras e orientacoes do pedido</Label>
        <Textarea
          id="order_guidelines"
          rows={3}
          placeholder="Ex: minimo de 50 unidades, pedido com 48h de antecedencia, tema sob consulta."
          {...register("order_guidelines")}
        />
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
      <div className="space-y-2">
        <Label htmlFor="storefront_section_title">Seção do site</Label>
        <Input id="storefront_section_title" placeholder="Ex: Bolos de aniversario" {...register("storefront_section_title")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="storefront_badge_text">Selo do site</Label>
        <Input id="storefront_badge_text" placeholder="Ex: Sob encomenda" {...register("storefront_badge_text")} />
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
      <div className="grid gap-3 rounded-3xl border border-rose-100 bg-[#fff8f4] p-4 xl:col-span-2 md:grid-cols-2">
        <p className="md:col-span-2 text-sm font-medium text-stone-700">Recursos de encomenda</p>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_flavor_selection")} />
          Permite escolher sabor
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_size_selection")} />
          Permite escolher tamanho
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_theme_customization")} />
          Permite personalizacao de tema
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_custom_message")} />
          Permite texto personalizado
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_event_date")} />
          Solicita data do evento
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_serving_count")} />
          Solicita numero de pessoas
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("accepts_variant_notes")} />
          Permite observacoes por item
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("requires_manual_quote")} />
          Exige confirmacao manual de orcamento
        </label>
      </div>
      <div className="grid gap-3 rounded-3xl border border-rose-100 bg-[#fff8f4] p-4 xl:col-span-2 md:grid-cols-3">
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
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("is_storefront_lactose_free")} />
          Sem lactose
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" value="true" {...register("is_storefront_gluten_free")} />
          Sem glúten
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
