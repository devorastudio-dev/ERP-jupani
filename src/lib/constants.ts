import {
  BarChart3,
  ClipboardList,
  Croissant,
  Factory,
  Globe,
  GanttChartSquare,
  LayoutDashboard,
  PackageSearch,
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

export const navigation = [
  { title: "Dashboard", href: `${ADMIN_BASE_PATH}/dashboard`, icon: LayoutDashboard },
  { title: "Produtos", href: `${ADMIN_BASE_PATH}/produtos`, icon: Croissant },
  { title: "Insumos", href: `${ADMIN_BASE_PATH}/insumos`, icon: PackageSearch },
  { title: "Fichas técnicas", href: `${ADMIN_BASE_PATH}/fichas-tecnicas`, icon: ClipboardList },
  { title: "Vendas e pedidos", href: `${ADMIN_BASE_PATH}/vendas`, icon: ShoppingCart },
  { title: "Caixa", href: `${ADMIN_BASE_PATH}/caixa`, icon: Wallet },
  { title: "Compras", href: `${ADMIN_BASE_PATH}/compras`, icon: ShoppingCart },
  { title: "Fornecedores", href: `${ADMIN_BASE_PATH}/fornecedores`, icon: Users },
  { title: "Estoque", href: `${ADMIN_BASE_PATH}/estoque`, icon: Factory },
  { title: "Produção", href: `${ADMIN_BASE_PATH}/producao`, icon: GanttChartSquare },
  { title: "Funcionários", href: `${ADMIN_BASE_PATH}/funcionarios`, icon: Users },
  { title: "Relatórios", href: `${ADMIN_BASE_PATH}/relatorios`, icon: BarChart3 },
  { title: "Site", href: `${ADMIN_BASE_PATH}/site`, icon: Globe },
  { title: "Configurações", href: `${ADMIN_BASE_PATH}/configuracoes`, icon: Settings },
];

export const salaryRoles = ["admin", "financeiro"] as const;

export const manageableRoles = ["admin", "gerente", "caixa", "producao", "estoque", "financeiro"] as const;
