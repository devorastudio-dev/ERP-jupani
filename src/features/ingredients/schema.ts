import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(2, "Informe o nome do insumo."),
  category_id: z.string().uuid().optional().or(z.literal("")),
  unit: z.string().min(1, "Informe a unidade."),
  stock_quantity: z.coerce.number().min(0),
  minimum_stock: z.coerce.number().min(0).default(0),
  average_cost: z.coerce.number().min(0).default(0),
  nutrition_quantity: z.coerce.number().positive("A quantidade-base deve ser maior que zero.").default(100),
  nutrition_unit: z.string().min(1, "Informe a unidade-base da nutrição."),
  kcal_amount: z.coerce.number().min(0).default(0),
  expiration_date: z.string().optional(),
  notes: z.string().optional(),
});

export type IngredientSchema = z.infer<typeof ingredientSchema>;
