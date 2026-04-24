"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ADMIN_BASE_PATH } from "@/lib/route-config";

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  insumos: "Insumos",
  "fichas-tecnicas": "Fichas técnicas",
  vendas: "Vendas",
  caixa: "Caixa",
  compras: "Compras",
  estoque: "Estoque",
  producao: "Produção",
  funcionarios: "Funcionários",
  relatorios: "Relatórios",
  site: "Site",
  configuracoes: "Configurações",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const cleanedPath = pathname.startsWith(ADMIN_BASE_PATH)
    ? pathname.slice(ADMIN_BASE_PATH.length) || "/dashboard"
    : pathname;
  const segments = cleanedPath.split("/").filter(Boolean);

  return (
    <div className="hidden items-center gap-1 text-sm text-stone-500 md:flex">
      <Link href={`${ADMIN_BASE_PATH}/dashboard`} className="hover:text-rose-600">
        Início
      </Link>
      {segments.map((segment, index) => {
        const href = `${ADMIN_BASE_PATH}/${segments.slice(0, index + 1).join("/")}`;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={href} className="hover:text-rose-600">
              {titles[segment] ?? segment}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
