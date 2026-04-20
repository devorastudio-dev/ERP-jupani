"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { navigation, APP_NAME, roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuthUserProfile } from "@/types/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logoutAction } from "@/features/auth/actions";

export function AppMobileNav({ profile }: { profile: AuthUserProfile }) {
  const pathname = usePathname();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-2xl lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-auto bottom-4 w-[calc(100%-1.25rem)] max-w-none -translate-x-1/2 translate-y-0 rounded-[2rem] p-0 sm:max-w-lg">
        <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-[#fffaf8]">
          <DialogHeader className="border-b border-rose-100/80 bg-gradient-to-r from-rose-500 via-rose-400 to-orange-300 px-5 py-5 text-white">
            <DialogTitle className="text-left text-white">{APP_NAME}</DialogTitle>
            <DialogDescription className="text-left text-white/85">
              Navegação rápida para operação, estoque e financeiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-5">
            <div className="rounded-[1.5rem] border border-rose-100 bg-white/90 p-4 shadow-sm shadow-rose-100/60">
              <p className="text-sm font-semibold text-stone-900">{profile.full_name}</p>
              <p className="mt-1 text-xs text-stone-500">{profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <Badge key={role} variant="muted">
                    {roleLabels[role]}
                  </Badge>
                ))}
              </div>
            </div>

            <nav className="grid gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-rose-100 text-rose-700 shadow-sm shadow-rose-100"
                        : "bg-white text-stone-600 hover:bg-rose-50 hover:text-stone-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="w-full justify-center rounded-2xl">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
