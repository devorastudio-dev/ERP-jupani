import { z } from "zod";

export const recipeItemSchema = z.object({
  ingredient_id: z.string().uuid("Selecione um insumo."),
  unit: z.string().min(1, "Informe a unidade."),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
});

export const recipeSchema = z.object({
  product_id: z.string().uuid("Selecione um produto."),
  packaging_cost: z.coerce.number().min(0).default(0),
  additional_cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(recipeItemSchema).min(1, "Adicione ao menos um insumo."),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Informe o nome da categoria.")
    .max(60, "Use no máximo 60 caracteres.")
    .transform((value) => value.trim()),
});

export type RecipeSchema = z.infer<typeof recipeSchema>;
export type RecipeItemSchema = z.infer<typeof recipeItemSchema>;
export type CategorySchema = z.infer<typeof categorySchema>;
