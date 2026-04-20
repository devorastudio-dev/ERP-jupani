"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IngredientForm } from "@/features/ingredients/components/ingredient-form";
import type { IngredientRow, NamedCategory } from "@/types/entities";

interface IngredientFormDialogProps {
  ingredient: IngredientRow;
  categories: NamedCategory[];
}

export function IngredientFormDialog({ ingredient, categories }: IngredientFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar insumo</DialogTitle>
          <DialogDescription>
            Ajuste estoque mínimo, custo médio, categoria e dados operacionais do insumo.
          </DialogDescription>
        </DialogHeader>
        <IngredientForm categories={categories} ingredient={ingredient} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
