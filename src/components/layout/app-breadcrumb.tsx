"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
  configuracoes: "Configurações",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="hidden items-center gap-1 text-sm text-stone-500 md:flex">
      <Link href="/dashboard" className="hover:text-rose-600">
        Início
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
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
