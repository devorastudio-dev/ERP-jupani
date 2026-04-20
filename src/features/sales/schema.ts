import { z } from "zod";

export const saleItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto."),
  product_name: z.string().min(1),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  unit_price: z.coerce.number().min(0),
  discount_amount: z.coerce.number().min(0).default(0),
  total_price: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const saleSchema = z.object({
  sale_type: z.enum(["balcao", "encomenda"]),
  order_type: z.enum(["retirada", "entrega"]),
  customer_name: z.string().min(2, "Informe o cliente."),
  phone: z.string().min(8, "Informe o telefone."),
  status: z.enum([
    "orcamento",
    "aguardando_confirmacao",
    "confirmado",
    "em_producao",
    "pronto",
    "entregue",
    "cancelado",
  ]),
  delivery_date: z.string().min(1, "Informe a data de entrega."),
  delivery_fee: z.coerce.number().min(0).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  payment_method: z.string().optional(),
  initial_payment_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Adicione pelo menos um item ao pedido."),
});

export const salePaymentSchema = z.object({
  sale_id: z.string().uuid(),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  payment_method: z.string().min(1, "Informe a forma de pagamento."),
  notes: z.string().optional(),
});

export const saleStatusSchema = z.object({
  sale_id: z.string().uuid(),
  status: z.enum([
    "orcamento",
    "aguardando_confirmacao",
    "confirmado",
    "em_producao",
    "pronto",
    "entregue",
    "cancelado",
  ]),
  notes: z.string().optional(),
});
