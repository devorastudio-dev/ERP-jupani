import { z } from "zod";

export const employeeSchema = z.object({
  full_name: z.string().min(3, "Informe o nome do funcionário."),
  role_name: z.string().min(2, "Informe o cargo."),
  salary_base: z.coerce.number().min(0).optional(),
  remuneration_type: z.enum(["fixo", "diaria", "comissao", "freelancer"]),
  is_active: z.coerce.boolean().default(true),
  phone: z.string().min(8, "Informe o telefone."),
  notes: z.string().optional(),
});

export const employeePaymentSchema = z.object({
  employee_id: z.string().uuid("Selecione um funcionário."),
  employee_name: z.string().min(1),
  payment_type: z.enum(["salario", "adiantamento", "desconto", "bonus", "pagamento_realizado"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  payment_date: z.string().min(1, "Informe a data do pagamento."),
  notes: z.string().optional(),
});
