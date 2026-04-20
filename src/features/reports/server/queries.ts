import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type {
  EmployeePaymentRow,
  InventoryMovementRow,
  PurchaseRow,
  ReportExpenseRow,
  ReportSaleByProductRow,
  SaleSummaryRow,
} from "@/types/entities";

export async function getReportsPageData() {
  const supabase = await createClient();

  const [salesByProduct, expensesByCategory, employeePayments, sales, lowStock, purchases] = await Promise.all([
    safeQuery<ReportSaleByProductRow[]>(
      supabase
        .from("sale_items")
        .select("product_name, quantity, total_price")
        .order("quantity", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<ReportExpenseRow[]>(
      supabase
        .from("cash_movements")
        .select("category_name, amount, movement_type")
        .eq("movement_type", "saida"),
      [],
    ),
    safeQuery<EmployeePaymentRow[]>(
      supabase
        .from("employee_payments")
        .select("employee_name, amount, payment_type, payment_date")
        .order("payment_date", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<SaleSummaryRow[]>(
      supabase
        .from("sales")
        .select("id, customer_name, status, total_amount, paid_amount, pending_amount, delivery_date, fiscal_status")
        .order("delivery_date", { ascending: false })
        .limit(30),
      [],
    ),
    safeQuery<InventoryMovementRow[]>(
      supabase
        .from("inventory_movements")
        .select("id, ingredient_name, movement_type, quantity, created_at, reason")
        .order("created_at", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<PurchaseRow[]>(
      supabase
        .from("purchases")
        .select("id, purchase_date, supplier_name, total_amount, status, payment_method")
        .order("purchase_date", { ascending: false })
        .limit(10),
      [],
    ),
  ]);

  return { salesByProduct, expensesByCategory, employeePayments, sales, lowStock, purchases };
}
