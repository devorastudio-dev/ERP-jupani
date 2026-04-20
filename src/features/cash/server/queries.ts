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

  const openSession = await safeQuery<CashSessionRow | null>(
    supabase
      .from("cash_sessions")
      .select("id, opened_at, closed_at, opening_balance, closing_balance, status")
      .eq("status", "aberto")
      .order("opened_at", { ascending: false })
      .maybeSingle(),
    null,
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const summaryQuery = openSession
    ? supabase
        .from("cash_movements")
        .select("movement_type, amount")
        .eq("cash_session_id", openSession.id)
    : supabase
        .from("cash_movements")
        .select("movement_type, amount")
        .gte("created_at", todayStart.toISOString());

  const [sessions, movements, payables, receivables, summaryMovements] = await Promise.all([
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
    safeQuery<Array<{ movement_type: string; amount: number | null }>>(summaryQuery, []),
  ]);

  const totalEntries = summaryMovements
    .filter((movement) => ["entrada", "reforco"].includes(movement.movement_type))
    .reduce((sum, movement) => sum + Number(movement.amount ?? 0), 0);

  const totalExits = summaryMovements
    .filter((movement) => ["saida", "sangria"].includes(movement.movement_type))
    .reduce((sum, movement) => sum + Number(movement.amount ?? 0), 0);

  const openingBalance = Number(openSession?.opening_balance ?? 0);
  const operationalBalance = totalEntries - totalExits;
  const currentBalance = openingBalance + operationalBalance;

  return {
    sessions,
    movements,
    payables,
    receivables,
    openSession,
    summary: {
      totalEntries,
      totalExits,
      operationalBalance,
      currentBalance,
      openingBalance,
      label: openSession ? "Sessão aberta atual" : "Movimentações de hoje",
    },
  };
}
