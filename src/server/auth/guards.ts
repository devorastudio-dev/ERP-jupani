import { notFound } from "next/navigation";
import { canAccessModule } from "@/lib/permissions";
import type { AuthUserProfile } from "@/types/app";

export function requireModule(profile: AuthUserProfile, moduleKey: Parameters<typeof canAccessModule>[0]) {
  if (!canAccessModule(moduleKey, profile.roles)) {
    notFound();
  }
}
