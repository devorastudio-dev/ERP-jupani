export interface NamedCategory {
  id: string;
  name: string;
}

export interface ProductRow {
  id: string;
  name: string;
  sale_price: number | null;
  estimated_cost: number | null;
  is_active: boolean;
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  unit: string;
  yield_quantity?: number | null;
  categories?: { name?: string | null } | null;
}

export interface IngredientRow {
  id: string;
  name: string;
  category_id?: string | null;
  unit: string;
  stock_quantity: number | null;
  minimum_stock: number | null;
  average_cost: number | null;
  expiration_date?: string | null;
  notes?: string | null;
  categories?: { name?: string | null } | null;
}

export interface InventoryMovementRow {
  id: string;
  ingredient_name: string | null;
  movement_type: string;
  quantity: number | null;
  created_at: string;
  reason?: string | null;
}

export interface RecipeIngredientRef {
  name?: string | null;
  unit?: string | null;
}

export interface RecipeItemRow {
  id: string;
  ingredient_id: string;
  unit: string;
  quantity: number | null;
  calculated_cost: number | null;
  ingredients?: RecipeIngredientRef | null;
}

export interface RecipeRow {
  id: string;
  product_id?: string;
  product_name: string;
  theoretical_cost: number | null;
  packaging_cost: number | null;
  additional_cost: number | null;
  notes?: string | null;
  recipe_items?: RecipeItemRow[];
}

export interface SaleSummaryRow {
  id: string;
  customer_name: string | null;
  phone?: string | null;
  sale_type?: string | null;
  order_type?: string | null;
  status: string;
  subtotal_amount?: number | null;
  total_amount: number | null;
  paid_amount?: number | null;
  pending_amount?: number | null;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  payment_method?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  delivery_date: string | null;
  fiscal_status: string | null;
  sale_items?: SaleItemRow[];
  sale_payments?: SalePaymentRow[];
  order_status_history?: OrderStatusHistoryRow[];
}

export interface SaleItemRow {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number | null;
  unit_price: number | null;
  discount_amount: number | null;
  total_price: number | null;
  notes?: string | null;
}

export interface SalePaymentRow {
  id: string;
  payment_date: string;
  amount: number | null;
  payment_method: string;
  notes?: string | null;
}

export interface OrderStatusHistoryRow {
  id: string;
  old_status?: string | null;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface DashboardSaleRow {
  id: string;
  total_amount: number | null;
  delivery_date: string | null;
  status: string | null;
}

export interface PayableRow {
  id: string;
  amount: number | null;
  due_date: string;
  status: string | null;
}

export interface ReceivableRow {
  id: string;
  amount: number | null;
  due_date: string;
  status: string | null;
}

export interface TopProductRow {
  product_name: string;
  quantity: number | null;
}

export interface CashSessionRow {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number | null;
  closing_balance: number | null;
  status: string;
}

export interface CashMovementRow {
  id: string;
  movement_type: string;
  amount: number | null;
  description: string;
  created_at: string;
  category_name?: string | null;
  reference_type?: string | null;
}

export interface PurchaseRow {
  id: string;
  purchase_date: string;
  supplier_name: string;
  total_amount: number | null;
  status: string;
  payment_method: string | null;
  notes?: string | null;
  generate_payable?: boolean;
  purchase_items?: PurchaseItemRow[];
}

export interface SupplierRow {
  id: string;
  name: string;
  phone: string | null;
}

export interface PurchaseItemRow {
  id: string;
  ingredient_id?: string | null;
  ingredient_name: string;
  quantity: number | null;
  unit_cost: number | null;
  total_cost: number | null;
}

export interface EmployeeRow {
  id: string;
  full_name: string;
  role_name: string;
  salary_base?: number | null;
  commission_percentage?: number | null;
  remuneration_type: string;
  is_active: boolean;
  phone: string | null;
  notes?: string | null;
}

export interface EmployeePaymentRow {
  id: string;
  employee_name: string;
  payment_type: string;
  amount: number | null;
  payment_date: string;
  notes?: string | null;
}

export interface ReportSaleByProductRow {
  product_name: string;
  quantity: number | null;
  total_price: number | null;
}

export interface ReportExpenseRow {
  category_name: string | null;
  amount: number | null;
  movement_type: string;
}

export interface ProductionOrderRow {
  id: string;
  deadline: string | null;
  status: string;
  notes?: string | null;
  sale_id?: string | null;
  production_order_items?: ProductionOrderItemRow[];
}

export interface ProductionOrderItemRow {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number | null;
  notes?: string | null;
}

export interface AccountPayableRow {
  id: string;
  description: string;
  amount: number | null;
  paid_amount: number | null;
  due_date: string;
  status: string;
  origin?: string | null;
  notes?: string | null;
}

export interface AccountReceivableRow {
  id: string;
  description: string;
  amount: number | null;
  received_amount: number | null;
  due_date: string;
  status: string;
  origin?: string | null;
  notes?: string | null;
}
