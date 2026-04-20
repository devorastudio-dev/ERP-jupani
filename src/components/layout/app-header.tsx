import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { AuthUserProfile } from "@/types/app";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";

export function AppHeader({ profile }: { profile: AuthUserProfile }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-[#fffdfb]/75 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 lg:hidden">
              <AppMobileNav profile={profile} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900">{profile.full_name}</p>
                <p className="text-xs text-stone-500">Painel interno da confeitaria</p>
              </div>
            </div>
            <AppBreadcrumb />
            <h2 className="mt-2 text-xl font-semibold text-stone-900 md:text-2xl">Visão operacional da confeitaria</h2>
            <p className="mt-1 hidden text-sm text-stone-500 md:block">Pedidos, produção, estoque e financeiro no mesmo fluxo.</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input placeholder="Buscar pedidos, produtos ou clientes" className="border-white bg-white/85 pl-9 shadow-sm shadow-rose-100/40" />
            </div>
            <button className="rounded-2xl border border-white bg-white/90 p-3 text-stone-500 shadow-sm shadow-rose-100/40">
              <Bell className="h-4 w-4" />
            </button>
            <Link href="/configuracoes" className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-3 py-2 shadow-sm shadow-rose-100/40">
              <Avatar>
                <AvatarFallback>{profile.full_name}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-stone-800">{profile.full_name}</p>
                <Badge variant="default">{profile.roles[0] ?? "colaborador"}</Badge>
              </div>
            </Link>
          </div>
        </div>
        <div className="md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input placeholder="Buscar pedidos, produtos ou clientes" className="border-white bg-white/85 pl-9 shadow-sm shadow-rose-100/40" />
          </div>
        </div>
      </div>
    </header>
  );
}
