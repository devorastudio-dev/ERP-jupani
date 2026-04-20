"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductRow } from "@/types/entities";

export function ProductsTable({ products }: { products: ProductRow[] }) {
  return (
    <DataTable
      data={products}
      searchPlaceholder="Buscar produto"
      columns={[
        { accessorKey: "name", header: "Produto" },
        {
          accessorKey: "sale_price",
          header: "Venda",
          cell: ({ row }) => formatCurrency(Number(row.original.sale_price ?? 0)),
        },
        {
          accessorKey: "estimated_cost",
          header: "Custo",
          cell: ({ row }) => formatCurrency(Number(row.original.estimated_cost ?? 0)),
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
      ]}
    />
  );
}
