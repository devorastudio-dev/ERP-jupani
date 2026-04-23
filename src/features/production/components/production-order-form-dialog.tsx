"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductionOrderForm } from "@/features/production/components/production-order-form";
import type { ProductRow, ProductionOrderRow, SaleSummaryRow } from "@/types/entities";

interface ProductionOrderFormDialogProps {
  order: ProductionOrderRow;
  sales: SaleSummaryRow[];
  products: ProductRow[];
}

export function ProductionOrderFormDialog({ order, sales, products }: ProductionOrderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const canEdit = !order.stock_deducted;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!canEdit} title={canEdit ? "Editar ordem" : "Ordem bloqueada para edição"}>
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar ordem de produção</DialogTitle>
          <DialogDescription>
            Ordens já finalizadas com baixa de estoque ficam bloqueadas para preservar a rastreabilidade operacional.
          </DialogDescription>
        </DialogHeader>
        <ProductionOrderForm order={order} sales={sales} products={products} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
