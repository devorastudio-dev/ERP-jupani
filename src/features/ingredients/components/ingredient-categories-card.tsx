"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createIngredientCategoryAction } from "@/features/ingredients/actions";
import { categorySchema, type CategorySchema } from "@/features/recipes/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NamedCategory } from "@/types/entities";

export function IngredientCategoriesCard({ categories }: { categories: NamedCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name);
      const result = await createIngredientCategoryAction(formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar a categoria.");
        return;
      }

      toast.success("Categoria criada.");
      reset();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de insumos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ingredient-category-name">Nova categoria</Label>
            <Input id="ingredient-category-name" {...register("name")} placeholder="Ex.: Laticínios" />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar categoria"}
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.length ? (
            categories.map((category) => (
              <Badge key={category.id} variant="muted">
                {category.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-stone-500">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
