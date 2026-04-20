import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase/server";
import type { AuthUserProfile, RoleSlug } from "@/types/app";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async (): Promise<AuthUserProfile | null> => {
  const supabase = await createClient();
  const user = await getSession();

  if (!user) return null;

  const [{ data: profile }, { data: roleSlugs }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", user.id).maybeSingle(),
    supabase.rpc("current_user_roles"),
  ]);

  return {
    id: profile?.id ?? user.id,
    full_name: profile?.full_name ?? user.user_metadata.full_name ?? "Usuário",
    email: profile?.email ?? user.email ?? "",
    roles: ((roleSlugs ?? []) as RoleSlug[]) ?? [],
  };
});

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}
