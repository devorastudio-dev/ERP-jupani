"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  createProductPanShapeAction,
  deleteProductPanShapeAction,
  updateProductPanShapeAction,
} from "@/features/products/actions";
import { panShapeSchema } from "@/features/products/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PanShapeRow } from "@/types/entities";

export function ProductPanShapesCard({ panShapes }: { panShapes: PanShapeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingServings, setEditingServings] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof panShapeSchema>>({
    resolver: zodResolver(panShapeSchema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("estimated_servings", String(values.estimated_servings));
      const result = await createProductPanShapeAction(formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar a forma.");
        return;
      }

      toast.success("Forma cadastrada.");
      reset();
      router.refresh();
    });
  });

  const startEditing = (panShape: PanShapeRow) => {
    setEditingCode(panShape.code);
    setEditingName(panShape.name);
    setEditingServings(String(Number(panShape.estimated_servings).toFixed(1)));
  };

  const cancelEditing = () => {
    setEditingCode(null);
    setEditingName("");
    setEditingServings("");
  };

  const submitEditing = (code: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", editingName);
      formData.set("estimated_servings", editingServings);
      const result = await updateProductPanShapeAction(code, formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível atualizar a forma.");
        return;
      }

      toast.success("Forma atualizada.");
      cancelEditing();
      router.refresh();
    });
  };

  const removePanShape = (panShape: PanShapeRow) => {
    if (!window.confirm(`Excluir a forma "${panShape.name}"? Produtos vinculados ficam sem forma selecionada.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProductPanShapeAction(panShape.code);

      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível excluir a forma.");
        return;
      }

      toast.success("Forma excluída.");
      if (editingCode === panShape.code) {
        cancelEditing();
      }
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formas e rendimentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="pan-shape-name">Nova forma</Label>
            <Input id="pan-shape-name" {...register("name")} placeholder="Ex.: Redonda reta - 22 cm" />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan-shape-servings">Rendimento estimado</Label>
            <Input id="pan-shape-servings" type="number" step="0.1" min="0.1" {...register("estimated_servings")} />
            {errors.estimated_servings ? (
              <p className="text-sm text-red-600">{errors.estimated_servings.message}</p>
            ) : (
              <p className="text-xs text-stone-500">Esse valor será usado para calcular as porções dos produtos que usam essa forma.</p>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar forma"}
          </Button>
        </form>

        <div className="space-y-3">
          {panShapes.length ? (
            panShapes.map((panShape) => (
              <div
                key={panShape.code}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/40 px-3 py-3"
              >
                {editingCode === panShape.code ? (
                  <>
                    <div className="min-w-[220px] flex-1">
                      <Label htmlFor={`edit-pan-shape-name-${panShape.code}`} className="sr-only">
                        Nome da forma
                      </Label>
                      <Input
                        id={`edit-pan-shape-name-${panShape.code}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        placeholder="Nome da forma"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <Label htmlFor={`edit-pan-shape-servings-${panShape.code}`} className="sr-only">
                        Rendimento estimado
                      </Label>
                      <Input
                        id={`edit-pan-shape-servings-${panShape.code}`}
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={editingServings}
                        onChange={(event) => setEditingServings(event.target.value)}
                      />
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => submitEditing(panShape.code)}>
                      {pending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={cancelEditing}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="muted">
                      {panShape.name}
                      {` • ${Number(panShape.estimated_servings).toFixed(1)} porções`}
                      {typeof panShape.usage_count === "number" ? ` • ${panShape.usage_count} produto(s)` : ""}
                    </Badge>
                    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => startEditing(panShape)}>
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => removePanShape(panShape)}>
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">Nenhuma forma cadastrada.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
