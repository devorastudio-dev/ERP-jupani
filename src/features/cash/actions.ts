"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/server/supabase/server";
import {
  cashMovementSchema,
  cashSessionCloseSchema,
  cashSessionOpenSchema,
} from "@/features/cash/schema";

async function getOpenCashSessionId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("status", "aberto")
    .order("opened_at", { ascending: false })
    .maybeSingle();

  return data?.id ?? null;
}

export async function openCashSessionAction(formData: FormData) {
  const parsed = cashSessionOpenSchema.safeParse({
    opening_balance: formData.get("opening_balance"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Abertura inválida." };
  }

  const supabase = await createClient();
  const openSessionId = await getOpenCashSessionId();
  if (openSessionId) {
    return { success: false, error: "Já existe um caixa aberto." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("cash_sessions").insert({
    opened_by: user?.id ?? null,
    opening_balance: parsed.data.opening_balance,
    expected_balance: parsed.data.opening_balance,
    notes: parsed.data.notes,
    status: "aberto",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/caixa");
  return { success: true };
}

export async function createCashMovementAction(formData: FormData) {
  const parsed = cashMovementSchema.safeParse({
    movement_type: formData.get("movement_type"),
    amount: formData.get("amount"),
    category_name: formData.get("category_name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Movimentação inválida." };
  }

  const supabase = await createClient();
  const [sessionId, userResponse] = await Promise.all([getOpenCashSessionId(), supabase.auth.getUser()]);

  if (!sessionId) {
    return { success: false, error: "Abra um caixa antes de lançar movimentações." };
  }

  const {
    data: { user },
  } = userResponse;

  const { error } = await supabase.from("cash_movements").insert({
    cash_session_id: sessionId,
    category_name: parsed.data.category_name,
    movement_type: parsed.data.movement_type,
    amount: parsed.data.amount,
    description: parsed.data.description,
    created_by: user?.id ?? null,
    reference_type: "manual",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function closeCashSessionAction(formData: FormData) {
  const parsed = cashSessionCloseSchema.safeParse({
    session_id: formData.get("session_id"),
    closing_balance: formData.get("closing_balance"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Fechamento inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("movement_type, amount")
    .eq("cash_session_id", parsed.data.session_id);

  const sessionDelta = (movements ?? []).reduce((sum, movement) => {
    const signal = movement.movement_type === "saida" || movement.movement_type === "sangria" ? -1 : 1;
    return sum + signal * Number(movement.amount ?? 0);
  }, 0);

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("opening_balance")
    .eq("id", parsed.data.session_id)
    .single();

  const expectedBalance = Number(session?.opening_balance ?? 0) + sessionDelta;

  const { error } = await supabase
    .from("cash_sessions")
    .update({
      closed_by: user?.id ?? null,
      closed_at: new Date().toISOString(),
      closing_balance: parsed.data.closing_balance,
      expected_balance: expectedBalance,
      notes: parsed.data.notes,
      status: "fechado",
    })
    .eq("id", parsed.data.session_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard");
  return { success: true };
}
