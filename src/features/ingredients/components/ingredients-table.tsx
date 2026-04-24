"use client";

import { DataTable } from "@/components/shared/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IngredientFormDialog } from "@/features/ingredients/components/ingredient-form-dialog";
import type { IngredientRow, NamedCategory } from "@/types/entities";

export function IngredientsTable({
  ingredients,
  categories,
}: {
  ingredients: IngredientRow[];
  categories: NamedCategory[];
}) {
  return (
    <DataTable
      data={ingredients}
      searchPlaceholder="Buscar insumo"
      columns={[
        { accessorKey: "name", header: "Insumo" },
        { accessorKey: "unit", header: "Unidade" },
        {
          accessorKey: "stock_quantity",
          header: "Estoque atual",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <span>{row.original.stock_quantity}</span>
              {Number(row.original.stock_quantity ?? 0) <= Number(row.original.minimum_stock ?? 0) ? (
                <Badge variant="warning">Baixo</Badge>
              ) : null}
            </div>
          ),
        },
        { accessorKey: "minimum_stock", header: "Estoque mínimo" },
        {
          accessorKey: "average_cost",
          header: "Custo médio",
          cell: ({ row }) => formatCurrency(Number(row.original.average_cost ?? 0)),
        },
        {
          id: "nutrition",
          header: "Nutrição",
          cell: ({ row }) => (
            <span>
              {Number(row.original.kcal_amount ?? 0).toFixed(0)} kcal / {Number(row.original.nutrition_quantity ?? 0)}{" "}
              {row.original.nutrition_unit ?? "-"}
            </span>
          ),
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
        {
          id: "actions",
          header: "Ações",
          cell: ({ row }) => <IngredientFormDialog ingredient={row.original} categories={categories} />,
        },
      ]}
    />
  );
}
