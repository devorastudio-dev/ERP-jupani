import {
  BarChart3,
  ClipboardList,
  Croissant,
  Factory,
  Globe,
  GanttChartSquare,
  LayoutDashboard,
  type LucideIcon,
  PackageSearch,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { ADMIN_BASE_PATH } from "@/lib/route-config";

export const APP_NAME = "Jupani Gestão";

export const roleLabels = {
  admin: "Administrador",
  gerente: "Gerente",
  caixa: "Caixa",
  producao: "Produção",
  estoque: "Estoque",
  financeiro: "Financeiro",
} as const;

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "Operacao",
    items: [
      { title: "Dashboard", href: `${ADMIN_BASE_PATH}/dashboard`, icon: LayoutDashboard },
      { title: "Vendas e pedidos", href: `${ADMIN_BASE_PATH}/vendas`, icon: ShoppingCart },
      { title: "Caixa", href: `${ADMIN_BASE_PATH}/caixa`, icon: Wallet },
      { title: "Produção", href: `${ADMIN_BASE_PATH}/producao`, icon: GanttChartSquare },
    ],
  },
  {
    title: "Catalogo e estoque",
    items: [
      { title: "Produtos", href: `${ADMIN_BASE_PATH}/produtos`, icon: Croissant },
      { title: "Fichas técnicas", href: `${ADMIN_BASE_PATH}/fichas-tecnicas`, icon: ClipboardList },
      { title: "Insumos", href: `${ADMIN_BASE_PATH}/insumos`, icon: PackageSearch },
      { title: "Estoque", href: `${ADMIN_BASE_PATH}/estoque`, icon: Factory },
      { title: "Compras", href: `${ADMIN_BASE_PATH}/compras`, icon: Receipt },
      { title: "Fornecedores", href: `${ADMIN_BASE_PATH}/fornecedores`, icon: Users },
    ],
  },
  {
    title: "Gestao",
    items: [
      { title: "Funcionários", href: `${ADMIN_BASE_PATH}/funcionarios`, icon: Users },
      { title: "Relatórios", href: `${ADMIN_BASE_PATH}/relatorios`, icon: BarChart3 },
      { title: "Site", href: `${ADMIN_BASE_PATH}/site`, icon: Globe },
      { title: "Configurações", href: `${ADMIN_BASE_PATH}/configuracoes`, icon: Settings },
    ],
  },
] as const;

export const navigation: NavigationItem[] = navigationSections.flatMap((section) => section.items);

export const quickNavigation = [
  `${ADMIN_BASE_PATH}/dashboard`,
  `${ADMIN_BASE_PATH}/vendas`,
  `${ADMIN_BASE_PATH}/fichas-tecnicas`,
  `${ADMIN_BASE_PATH}/estoque`,
  `${ADMIN_BASE_PATH}/producao`,
  `${ADMIN_BASE_PATH}/caixa`,
] as const;

export const salaryRoles = ["admin", "financeiro"] as const;

export const manageableRoles = ["admin", "gerente", "caixa", "producao", "estoque", "financeiro"] as const;
