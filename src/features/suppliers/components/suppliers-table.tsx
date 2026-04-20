"use client";

import React from "react";
import { DataTable } from "@/components/shared/data-table";
import { formatDate, formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { deleteSupplier } from "../actions";
import type { Supplier } from "../schema";
import { useTransition } from "react";

interface SuppliersTableProps {
  initialData: Supplier[];
}

export function SuppliersTable({ initialData }: SuppliersTableProps) {
  const [, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    await deleteSupplier(id);
    // Revalidate via router.refresh in parent
  };

  return (
    <DataTable
      columns={[
        {
          accessorKey: "name",
          header: "Nome",
        },
        {
          accessorKey: "contact_name",
          header: "Contato",
        },
        {
          accessorKey: "phone",
          header: "Telefone",
          cell: ({ row }) => formatPhone(row.original.phone),
        },
        {
          accessorKey: "whatsapp",
          header: "WhatsApp",
          cell: ({ row }) => formatPhone(row.original.whatsapp),
        },
        {
          accessorKey: "email",
          header: "Email",
          cell: ({ row }) => row.original.email || "-",
        },
        {
          accessorKey: "notes",
          header: "Observações",
          cell: ({ row }) => row.original.notes || "-",
        },
        {
          accessorKey: "created_at",
          header: "Criado",
          cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
          id: "actions",
          cell: ({ row }) => {
            const supplier = row.original;
            return (
              <div className="flex gap-1">
                <SupplierFormDialog supplier={supplier} />
                <Button
                  variant="outline-destructive" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => startTransition(() => handleDelete(supplier.id))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          },
        },
      ]}
      data={initialData}
      searchPlaceholder="Buscar por nome, telefone ou email..."
    />
  );
}

