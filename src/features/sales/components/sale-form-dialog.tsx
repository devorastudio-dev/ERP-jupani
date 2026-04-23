"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SaleForm } from "@/features/sales/components/sale-form";
import type { CashSessionRow, ProductRow, SaleSummaryRow } from "@/types/entities";

interface SaleFormDialogProps {
  sale: SaleSummaryRow;
  products: ProductRow[];
  openCashSession: CashSessionRow | null;
}

export function SaleFormDialog({ sale, products, openCashSession }: SaleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const canEdit = !sale.stock_deducted;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!canEdit} title={canEdit ? "Editar pedido" : "Pedido bloqueado para edição"}>
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
          <DialogDescription>
            Pedidos com estoque já baixado ficam bloqueados para evitar divergência entre estoque, financeiro e produção.
          </DialogDescription>
        </DialogHeader>
        <SaleForm sale={sale} products={products} openCashSession={openCashSession} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
