"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import type { IngredientRow, PurchaseRow, SupplierRow } from "@/types/entities";

interface PurchaseFormDialogProps {
  purchase: PurchaseRow;
  suppliers: SupplierRow[];
  ingredients: IngredientRow[];
}

export function PurchaseFormDialog({ purchase, suppliers, ingredients }: PurchaseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const canEdit = !["aprovada", "recebida"].includes(String(purchase.status));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!canEdit} title={canEdit ? "Editar compra" : "Compra bloqueada para edição"}>
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
          <DialogDescription>
            Compras recebidas ficam bloqueadas para preservar estoque e custo médio. Esta edição atua com segurança antes do recebimento.
          </DialogDescription>
        </DialogHeader>
        <PurchaseForm suppliers={suppliers} ingredients={ingredients} purchase={purchase} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
