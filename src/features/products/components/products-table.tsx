"use client";

import Image from "next/image";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import type { NamedCategory, ProductRow } from "@/types/entities";

export function ProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: NamedCategory[];
}) {
  return (
    <DataTable
      data={products}
      searchPlaceholder="Buscar produto"
      columns={[
        {
          accessorKey: "name",
          header: "Produto",
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8f4]">
                {row.original.photo_path?.trim() ? (
                  <Image
                    src={row.original.photo_path}
                    alt={row.original.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{row.original.name}</p>
                <p className="truncate text-xs text-stone-500">{row.original.photo_path?.trim() || "Imagem padrão da vitrine"}</p>
              </div>
            </div>
          ),
        },
        {
          accessorKey: "sale_price",
          header: "Venda",
          cell: ({ row }) => formatCurrency(Number(row.original.sale_price ?? 0)),
        },
        {
          id: "nutrition",
          header: "Porções / kcal",
          cell: ({ row }) => (
            <div className="text-xs text-stone-600">
              <p>
                {Number(row.original.estimated_servings ?? 0) > 0
                  ? `${Number(row.original.estimated_servings ?? 0).toFixed(1)} pessoas`
                  : "Sem cálculo"}
              </p>
              <p>
                {Number(row.original.estimated_kcal_per_serving ?? 0) > 0
                  ? `${Number(row.original.estimated_kcal_per_serving ?? 0).toFixed(0)} kcal/porção`
                  : "Sem kcal"}
              </p>
            </div>
          ),
        },
        {
          accessorKey: "estimated_cost",
          header: "Custo",
          cell: ({ row }) => formatCurrency(Number(row.original.estimated_cost ?? 0)),
        },
        {
          id: "finished_stock",
          header: "Estoque",
          cell: ({ row }) =>
            row.original.fulfillment_type === "pronta_entrega"
              ? `${Number(row.original.finished_stock_quantity ?? 0).toFixed(3)} / min ${Number(row.original.minimum_finished_stock ?? 0).toFixed(3)}`
              : "-",
        },
        {
          id: "margin",
          header: "Margem",
          cell: ({ row }) => {
            const salePrice = Number(row.original.sale_price ?? 0);
            const estimatedCost = Number(row.original.estimated_cost ?? 0);
            const margin = salePrice - estimatedCost;
            const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

            return (
              <Badge variant={margin >= 0 ? (marginPercent >= 30 ? "success" : "warning") : "danger"}>
                {marginPercent.toFixed(1)}%
              </Badge>
            );
          },
        },
        {
          accessorKey: "fulfillment_type",
          header: "Tipo",
          cell: ({ row }) => (
            <Badge variant={row.original.fulfillment_type === "pronta_entrega" ? "success" : "default"}>
              {row.original.fulfillment_type === "pronta_entrega" ? "Pronta entrega" : "Sob encomenda"}
            </Badge>
          ),
        },
        {
          accessorKey: "categories",
          header: "Categoria",
          cell: ({ row }) => row.original.categories?.name ?? "-",
        },
        {
          accessorKey: "is_active",
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={row.original.is_active ? "success" : "muted"}>
              {row.original.is_active ? "Ativo" : "Inativo"}
            </Badge>
          ),
        },
        {
          id: "site",
          header: "Site",
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
              <Badge variant={row.original.show_on_storefront ? "success" : "muted"}>
                {row.original.show_on_storefront ? "Publicado" : "Oculto"}
              </Badge>
              {row.original.is_storefront_featured ? <Badge variant="warning">Destaque</Badge> : null}
              {row.original.is_storefront_favorite ? <Badge variant="default">Favorito</Badge> : null}
              {row.original.is_storefront_healthy ? <Badge variant="success">Fitness</Badge> : null}
            </div>
          ),
        },
        {
          id: "recipe",
          header: "Ficha",
          cell: ({ row }) => (
            <Badge variant={row.original.recipes?.length ? "success" : "muted"}>
              {row.original.recipes?.length ? "Vinculada" : "Sem ficha"}
            </Badge>
          ),
        },
        {
          id: "actions",
          header: "",
          cell: ({ row }) => <ProductFormDialog product={row.original} categories={categories} />,
        },
      ]}
    />
  );
}
