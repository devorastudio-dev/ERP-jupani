export type RoleSlug =
  | "admin"
  | "gerente"
  | "caixa"
  | "producao"
  | "estoque"
  | "financeiro";

export type OrderStatus =
  | "orcamento"
  | "aguardando_confirmacao"
  | "confirmado"
  | "em_producao"
  | "pronto"
  | "entregue"
  | "cancelado";

export type CashMovementType =
  | "entrada"
  | "saida"
  | "sangria"
  | "reforco";

export type ProductionStatus =
  | "pendente"
  | "em_producao"
  | "finalizado"
  | "cancelado";

export type PaymentStatus = "pendente" | "parcial" | "pago" | "cancelado";

export type FiscalStatus =
  | "nao_emitido"
  | "pendente"
  | "emitido"
  | "cancelado"
  | "erro";

export interface AuthUserProfile {
  id: string;
  full_name: string;
  email: string;
  roles: RoleSlug[];
}

export interface DashboardMetric {
  label: string;
  value: number;
  helper?: string;
}
