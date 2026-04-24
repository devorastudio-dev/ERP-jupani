"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schema";
import { ADMIN_BASE_PATH } from "@/lib/route-config";
import { createClient } from "@/server/supabase/server";

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Não foi possível entrar. Verifique suas credenciais." };
  }

  redirect(`${ADMIN_BASE_PATH}/dashboard`);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
