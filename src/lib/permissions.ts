import type { RoleSlug } from "@/types/app";

const modulePermissions: Record<string, RoleSlug[]> = {
  dashboard: ["admin", "gerente", "caixa", "producao", "estoque", "financeiro"],
  produtos: ["admin", "gerente", "estoque"],
  insumos: ["admin", "gerente", "estoque"],
  fornecedores: ["admin", "gerente", "estoque", "financeiro"],
  receitas: ["admin", "gerente", "estoque", "producao"],
  vendas: ["admin", "gerente", "caixa"],
  caixa: ["admin", "gerente", "caixa", "financeiro"],
  compras: ["admin", "gerente", "estoque", "financeiro"],
  estoque: ["admin", "gerente", "estoque"],
  producao: ["admin", "gerente", "producao"],
  funcionarios: ["admin", "financeiro", "gerente"],
  relatorios: ["admin", "gerente", "financeiro"],
  configuracoes: ["admin"],
};

export function hasRole(userRoles: RoleSlug[], allowed: RoleSlug[]) {
  return userRoles.some((role) => allowed.includes(role));
}

export function canAccessModule(moduleKey: keyof typeof modulePermissions, userRoles: RoleSlug[]) {
  return hasRole(userRoles, modulePermissions[moduleKey]);
}

export function canViewSalary(userRoles: RoleSlug[]) {
  return hasRole(userRoles, ["admin", "financeiro"]);
}

export function isAdmin(userRoles: RoleSlug[]) {
  return userRoles.includes("admin");
}
