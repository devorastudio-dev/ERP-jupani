import { z } from "zod";

export const cashSessionOpenSchema = z.object({
  opening_balance: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const cashMovementSchema = z.object({
  movement_type: z.enum(["entrada", "saida", "sangria", "reforco"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  category_name: z.string().min(2, "Informe a categoria."),
  description: z.string().min(3, "Descreva a movimentação."),
});

export const cashSessionCloseSchema = z.object({
  session_id: z.string().uuid(),
  closing_balance: z.coerce.number().min(0),
  notes: z.string().optional(),
});
