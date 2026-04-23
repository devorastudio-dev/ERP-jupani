"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import type { IngredientRow, ProductRow, RecipeRow } from "@/types/entities";

interface RecipeFormDialogProps {
  recipe: RecipeRow;
  products: ProductRow[];
  ingredients: IngredientRow[];
}

export function RecipeFormDialog({ recipe, products, ingredients }: RecipeFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar ficha técnica</DialogTitle>
          <DialogDescription>
            Ajuste insumos, embalagem e custos adicionais mantendo o recálculo automático do custo teórico do produto.
          </DialogDescription>
        </DialogHeader>
        <RecipeForm recipe={recipe} products={products} ingredients={ingredients} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
