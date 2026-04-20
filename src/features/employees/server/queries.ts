import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { EmployeePaymentRow, EmployeeRow } from "@/types/entities";

export async function getEmployeesPageData(includeSalary: boolean) {
  const supabase = await createClient();
  const select = includeSalary
    ? "*"
    : "id, full_name, role_name, remuneration_type, is_active, phone, notes";

  const [employees, payments] = await Promise.all([
    safeQuery<EmployeeRow[]>(supabase.from("employees").select(select).order("full_name"), []),
    safeQuery<EmployeePaymentRow[]>(
      supabase
        .from("employee_payments")
        .select("id, employee_name, payment_type, amount, payment_date, notes")
        .order("payment_date", { ascending: false })
        .limit(10),
      [],
    ),
  ]);

  return { employees, payments };
}
