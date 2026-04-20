"use server";

import { revalidatePath } from "next/cache";
import { canViewSalary } from "@/lib/permissions";
import { createClient } from "@/server/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { employeePaymentSchema, employeeSchema } from "@/features/employees/schema";

async function buildEmployeePayload(values: ReturnType<typeof employeeSchema.parse>, mode: "create" | "update") {
  const profile = await getCurrentProfile();
  const allowSalary = profile ? canViewSalary(profile.roles) : false;
  const basePayload = {
    full_name: values.full_name.trim(),
    role_name: values.role_name.trim(),
    remuneration_type: values.remuneration_type,
    is_active: values.is_active,
    phone: values.phone.trim(),
    notes: values.notes?.trim() || null,
  };

  if (!allowSalary && mode === "update") {
    return basePayload;
  }

  return {
    ...basePayload,
    salary_base: allowSalary && values.salary_base !== undefined ? values.salary_base : null,
    commission_percentage:
      allowSalary && values.remuneration_type === "comissao" && values.commission_percentage !== undefined
        ? values.commission_percentage
        : null,
  };
}

async function persistEmployee(
  mode: "create" | "update",
  payload: Awaited<ReturnType<typeof buildEmployeePayload>>,
  id?: string,
) {
  const supabase = await createClient();
  const builder =
    mode === "create"
      ? supabase.from("employees").insert(payload)
      : supabase.from("employees").update(payload).eq("id", id!);

  const { error } = await builder;
  if (!error) return { success: true as const };

  if (error.message.toLowerCase().includes("commission_percentage") && "commission_percentage" in payload) {
    const legacyPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== "commission_percentage"),
    );
    const fallbackBuilder =
      mode === "create"
        ? supabase.from("employees").insert(legacyPayload)
        : supabase.from("employees").update(legacyPayload).eq("id", id!);
    const { error: fallbackError } = await fallbackBuilder;
    if (!fallbackError) return { success: true as const };
    return { success: false as const, error: fallbackError.message };
  }

  return { success: false as const, error: error.message };
}

export async function createEmployeeAction(formData: FormData) {
  const parsed = employeeSchema.safeParse({
    full_name: formData.get("full_name"),
    role_name: formData.get("role_name"),
    salary_base: formData.get("salary_base"),
    commission_percentage: formData.get("commission_percentage"),
    remuneration_type: formData.get("remuneration_type"),
    is_active: formData.get("is_active"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Funcionário inválido." };
  }

  const payload = await buildEmployeePayload(parsed.data, "create");
  const result = await persistEmployee("create", payload);
  if (!result.success) {
    return result;
  }

  revalidatePath("/funcionarios");
  return { success: true };
}

export async function updateEmployeeAction(id: string, formData: FormData) {
  const parsed = employeeSchema.safeParse({
    full_name: formData.get("full_name"),
    role_name: formData.get("role_name"),
    salary_base: formData.get("salary_base"),
    commission_percentage: formData.get("commission_percentage"),
    remuneration_type: formData.get("remuneration_type"),
    is_active: formData.get("is_active"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Funcionário inválido." };
  }

  const payload = await buildEmployeePayload(parsed.data, "update");
  const result = await persistEmployee("update", payload, id);
  if (!result.success) {
    return result;
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
