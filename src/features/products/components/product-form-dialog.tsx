"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "@/features/products/components/product-form";
import type { NamedCategory, PanShapeRow, ProductRow } from "@/types/entities";

interface ProductFormDialogProps {
  product: ProductRow;
  categories: NamedCategory[];
  panShapes: PanShapeRow[];
}

export function ProductFormDialog({ product, categories, panShapes }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>
            Ajuste preço, categoria, rendimento e dados comerciais sem perder o histórico de custo do produto.
          </DialogDescription>
        </DialogHeader>
        <ProductForm categories={categories} panShapes={panShapes} product={product} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
