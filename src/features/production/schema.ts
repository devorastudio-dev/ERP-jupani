import { z } from "zod";

export const productionItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto."),
  product_name: z.string().min(1),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  notes: z.string().optional(),
});

export const productionOrderSchema = z.object({
  sale_id: z.string().uuid().optional().or(z.literal("")),
  deadline: z.string().optional(),
  status: z.enum(["pendente", "em_producao", "finalizado", "cancelado"]),
  notes: z.string().optional(),
  items: z.array(productionItemSchema).min(1, "Adicione ao menos um item."),
});

export const productionStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["pendente", "em_producao", "finalizado", "cancelado"]),
});
