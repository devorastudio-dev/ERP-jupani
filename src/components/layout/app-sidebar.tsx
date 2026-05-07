"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navigationSections, APP_NAME, roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuthUserProfile } from "@/types/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function AppSidebar({ profile }: { profile: AuthUserProfile }) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[290px] shrink-0 overflow-y-auto border-r border-white/70 bg-[#fff8f3]/92 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-rose-500 via-rose-400 to-orange-300 p-5 text-white shadow-lg shadow-rose-200/80">
        <p className="text-xs uppercase tracking-[0.35em] text-white/75">Confeitaria</p>
        <h1 className="mt-2 text-2xl font-semibold">{APP_NAME}</h1>
        <p className="mt-2 text-sm leading-6 text-white/85">Operação, produção e financeiro em um fluxo mais organizado.</p>
      </div>

      <nav className="mt-6 space-y-5">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              {section.title}
            </p>
            <div className="space-y-1.5 rounded-[1.75rem] border border-white/60 bg-white/70 p-2 shadow-sm shadow-rose-100/50">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-rose-50 text-rose-700 shadow-sm shadow-rose-100"
                        : "text-stone-600 hover:bg-[#fff7f4] hover:text-stone-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        active ? "bg-white text-rose-600" : "bg-stone-100/80 text-stone-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
