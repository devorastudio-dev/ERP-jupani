"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navigation, APP_NAME, roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuthUserProfile } from "@/types/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function AppSidebar({ profile }: { profile: AuthUserProfile }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/60 bg-[#fffaf7]/80 px-5 py-6 backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-[2rem] bg-gradient-to-br from-rose-500 via-rose-400 to-orange-300 p-5 text-white shadow-lg shadow-rose-200/80">
        <p className="text-sm uppercase tracking-[0.3em] text-white/75">Confeitaria</p>
        <h1 className="mt-2 text-2xl font-semibold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-white/85">Gestão integrada para produção, vendas e financeiro.</p>
      </div>

      <nav className="mt-8 space-y-1.5">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-white text-rose-700 shadow-sm shadow-rose-100"
                  : "text-stone-600 hover:bg-white/90 hover:text-stone-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[2rem] border border-rose-100/80 bg-white/90 p-4 shadow-sm shadow-rose-100/60">
        <p className="text-sm font-semibold text-stone-900">{profile.full_name}</p>
        <p className="mt-1 text-xs text-stone-500">{profile.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.roles.map((role) => (
            <Badge key={role} variant="muted">
              {roleLabels[role]}
            </Badge>
          ))}
        </div>
        <form action={logoutAction} className="mt-4">
          <Button type="submit" variant="outline" className="w-full justify-center">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
