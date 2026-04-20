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

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("roles:role_id(slug)")
      .eq("user_id", user.id),
  ]);

  const roles =
    roleRows
      ?.map((row) => {
        const role = row.roles as { slug?: RoleSlug } | null;
        return role?.slug;
      })
      .filter(Boolean) ?? [];

  return {
    id: profile?.id ?? user.id,
    full_name: profile?.full_name ?? user.user_metadata.full_name ?? "Usuário",
    email: profile?.email ?? user.email ?? "",
    roles: roles as RoleSlug[],
  };
});

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}
