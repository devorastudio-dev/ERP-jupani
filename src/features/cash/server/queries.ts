import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type {
  AccountPayableRow,
  AccountReceivableRow,
  CashMovementRow,
  CashSessionRow,
} from "@/types/entities";

export async function getCashPageData() {
  const supabase = await createClient();

  const [sessions, movements, payables, receivables] = await Promise.all([
    safeQuery<CashSessionRow[]>(
      supabase
        .from("cash_sessions")
        .select("id, opened_at, closed_at, opening_balance, closing_balance, status")
        .order("opened_at", { ascending: false })
        .limit(10),
      [],
    ),
    safeQuery<CashMovementRow[]>(
      supabase
        .from("cash_movements")
        .select("id, movement_type, amount, description, created_at, category_name, reference_type")
        .order("created_at", { ascending: false })
        .limit(12),
      [],
    ),
    safeQuery<AccountPayableRow[]>(
      supabase
        .from("accounts_payable")
        .select("id, description, amount, paid_amount, due_date, status, origin, notes")
        .neq("status", "pago")
        .order("due_date", { ascending: true })
        .limit(8),
      [],
    ),
    safeQuery<AccountReceivableRow[]>(
      supabase
        .from("accounts_receivable")
        .select("id, description, amount, received_amount, due_date, status, origin, notes")
        .neq("status", "pago")
        .order("due_date", { ascending: true })
        .limit(8),
      [],
    ),
  ]);

  return { sessions, movements, payables, receivables };
}
