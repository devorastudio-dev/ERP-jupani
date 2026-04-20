import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Informe o nome do produto."),
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  sale_price: z.coerce.number().min(0),
  estimated_cost: z.coerce.number().min(0).default(0),
  yield_quantity: z.coerce.number().min(0).default(1),
  unit: z.string().min(1, "Informe a unidade."),
  notes: z.string().optional(),
  fulfillment_type: z.enum(["sob_encomenda", "pronta_entrega"]),
  is_active: z.coerce.boolean().default(true),
});

export type ProductSchema = z.infer<typeof productSchema>;
