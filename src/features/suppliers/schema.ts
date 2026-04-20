import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  contact_name: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string | null;
}