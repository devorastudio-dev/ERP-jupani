"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import { employeePaymentSchema, employeeSchema } from "@/features/employees/schema";

export async function createEmployeeAction(formData: FormData) {
  const parsed = employeeSchema.safeParse({
    full_name: formData.get("full_name"),
    role_name: formData.get("role_name"),
    salary_base: formData.get("salary_base"),
    remuneration_type: formData.get("remuneration_type"),
    is_active: formData.get("is_active"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Funcionário inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/funcionarios");
  return { success: true };
}

export async function createEmployeePaymentAction(formData: FormData) {
  const parsed = employeePaymentSchema.safeParse({
    employee_id: formData.get("employee_id"),
    employee_name: formData.get("employee_name"),
    payment_type: formData.get("payment_type"),
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Lançamento inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_payments").insert(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/funcionarios");
  revalidatePath("/relatorios");
  return { success: true };
}
