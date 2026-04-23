import { z } from "zod";

export const purchaseItemSchema = z.object({
  ingredient_id: z.string().uuid("Selecione um insumo."),
  ingredient_name: z.string().min(1),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  purchase_unit: z.string().min(1, "Informe a unidade da compra."),
  unit_cost: z.coerce.number().min(0),
  total_cost: z.coerce.number().min(0),
});

export const purchaseSchema = z.object({
  supplier_id: z.string().uuid("Selecione um fornecedor."),
  supplier_name: z.string().min(1),
  purchase_date: z.string().min(1, "Informe a data da compra."),
  status: z.enum(["rascunho", "aprovada", "recebida", "cancelada"]),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  generate_payable: z.coerce.boolean().default(false),
  items: z.array(purchaseItemSchema).min(1, "Adicione pelo menos um item."),
});

export const payableSettlementSchema = z.object({
  account_id: z.string().uuid(),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  payment_method: z.string().min(1, "Informe a forma de pagamento."),
  notes: z.string().optional(),
});
