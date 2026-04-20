import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("insira um email válido"),
  password: z.string().min(6, "a senha deve ter ao menos 6 caracteres"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
