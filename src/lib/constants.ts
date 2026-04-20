import {
  BarChart3,
  ClipboardList,
  Croissant,
  Factory,
  GanttChartSquare,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", href: "/produtos", icon: Croissant },
  { title: "Insumos", href: "/insumos", icon: PackageSearch },
  { title: "Fichas técnicas", href: "/fichas-tecnicas", icon: ClipboardList },
  { title: "Vendas e pedidos", href: "/vendas", icon: ShoppingCart },
  { title: "Caixa", href: "/caixa", icon: Wallet },
  { title: "Compras", href: "/compras", icon: ShoppingCart },
  { title: "Fornecedores", href: "/fornecedores", icon: Users },
  { title: "Estoque", href: "/estoque", icon: Factory },
  { title: "Produção", href: "/producao", icon: GanttChartSquare },
{ title: "Funcionários", href: "/funcionarios", icon: Users },
  { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export const publicRoutes = ["/login"];

export const salaryRoles = ["admin", "financeiro"] as const;

export const manageableRoles = ["admin", "gerente", "caixa", "producao", "estoque", "financeiro"] as const;
