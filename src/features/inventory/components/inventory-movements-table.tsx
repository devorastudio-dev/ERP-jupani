"use client";

import { DataTable } from "@/components/shared/data-table";
import { formatDate } from "@/lib/utils";
import type { InventoryMovementRow } from "@/types/entities";

export function InventoryMovementsTable({ movements }: { movements: InventoryMovementRow[] }) {
  return (
    <DataTable
      data={movements}
      searchPlaceholder="Buscar movimentação"
      columns={[
        { accessorKey: "ingredient_name", header: "Insumo" },
        { accessorKey: "movement_type", header: "Tipo" },
        { accessorKey: "quantity", header: "Quantidade" },
        { accessorKey: "reason", header: "Motivo" },
        {
          accessorKey: "created_at",
          header: "Data",
          cell: ({ row }) => formatDate(String(row.original.created_at), "DD/MM/YYYY HH:mm"),
        },
      ]}
    />
  );
}
