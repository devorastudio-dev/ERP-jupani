"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "./supplier-form";
import type { Supplier } from "../schema";
import { Plus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierFormDialogProps {
  supplier?: Supplier | null;
  triggerClassName?: string;
}

export function SupplierFormDialog({
  supplier,
  triggerClassName
}: SupplierFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={supplier ? "outline" : "default"}
          size="sm"
          className={cn(supplier ? "h-8 w-8 p-0" : "h-10 px-4", triggerClassName)}
        >
          {supplier ? <Edit className="h-3 w-3" /> : <Plus className="h-4 w-4" />}
          {supplier ? null : "Novo fornecedor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          <DialogDescription>
            {supplier 
              ? "Atualize as informações do fornecedor."
              : "Cadastre um novo fornecedor de insumos."
            }
          </DialogDescription>
        </DialogHeader>
        <SupplierForm supplierId={supplier?.id} supplier={supplier} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
