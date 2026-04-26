"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProductCategoryAction, updateProductCategoryAction } from "@/features/products/actions";
import { categorySchema, type CategorySchema } from "@/features/recipes/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NamedCategory } from "@/types/entities";

export function ProductCategoriesCard({ categories }: { categories: NamedCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
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
      const result = await createProductCategoryAction(formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar a categoria.");
        return;
      }

      toast.success("Categoria criada.");
      reset();
      router.refresh();
    });
  });

  const startEditing = (category: NamedCategory) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingName("");
  };

  const submitEditing = (categoryId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", editingName);
      const result = await updateProductCategoryAction(categoryId, formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível atualizar a categoria.");
        return;
      }

      toast.success("Categoria atualizada.");
      cancelEditing();
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de produtos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="product-category-name">Nova categoria</Label>
            <Input id="product-category-name" {...register("name")} placeholder="Ex.: Bolos premium" />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar categoria"}
          </Button>
        </form>
        <div className="space-y-3">
          {categories.length ? (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/40 px-3 py-2"
              >
                {editingCategoryId === category.id ? (
                  <>
                    <div className="min-w-[220px] flex-1">
                      <Label htmlFor={`edit-product-category-${category.id}`} className="sr-only">
                        Editar categoria
                      </Label>
                      <Input
                        id={`edit-product-category-${category.id}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        placeholder="Nome da categoria"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => submitEditing(category.id)}
                    >
                      {pending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={cancelEditing}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="muted">{category.name}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => startEditing(category)}
                    >
                      Editar
                    </Button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
