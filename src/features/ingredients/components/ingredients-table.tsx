"use client";

import { DataTable } from "@/components/shared/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IngredientRow } from "@/types/entities";

export function IngredientsTable({ ingredients }: { ingredients: IngredientRow[] }) {
  return (
    <DataTable
      data={ingredients}
      searchPlaceholder="Buscar insumo"
      columns={[
        { accessorKey: "name", header: "Insumo" },
        { accessorKey: "unit", header: "Unidade" },
        { accessorKey: "stock_quantity", header: "Estoque atual" },
        { accessorKey: "minimum_stock", header: "Estoque mínimo" },
        {
          accessorKey: "average_cost",
          header: "Custo médio",
          cell: ({ row }) => formatCurrency(Number(row.original.average_cost ?? 0)),
        },
        {
          accessorKey: "categories",
          header: "Categoria",
          cell: ({ row }) => row.original.categories?.name ?? "-",
        },
        {
          accessorKey: "expiration_date",
          header: "Validade",
          cell: ({ row }) =>
            row.original.expiration_date ? formatDate(String(row.original.expiration_date)) : "-",
        },
      ]}
    />
  );
}
