export interface NamedCategory {
  id: string;
  name: string;
  usage_count?: number;
}

export interface ProductRow {
  id: string;
  name: string;
  category_id?: string | null;
  category_ids?: string[];
  description?: string | null;
  sale_price: number | null;
  estimated_cost: number | null;
  finished_stock_quantity?: number | null;
  minimum_finished_stock?: number | null;
  is_active: boolean;
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  unit: string;
  yield_quantity?: number | null;
  pan_shape_code?: string | null;
  serving_reference_quantity?: number | null;
  serving_reference_unit?: string | null;
  estimated_servings?: number | null;
  estimated_kcal_total?: number | null;
  estimated_kcal_per_serving?: number | null;
  public_ingredients_text?: string | null;
  notes?: string | null;
  photo_path?: string | null;
  show_on_storefront?: boolean;
  is_storefront_featured?: boolean;
  is_storefront_favorite?: boolean;
  is_storefront_healthy?: boolean;
  is_storefront_lactose_free?: boolean;
  is_storefront_gluten_free?: boolean;
  categories?: NamedCategory[] | null;
  recipes?: Array<{
    id: string;
    theoretical_cost?: number | null;
    recipe_items?: Array<{
      id: string;
      ingredients?: { name?: string | null } | null;
    }> | null;
  }> | null;
}

export interface IngredientRow {
  id: string;
  name: string;
  category_id?: string | null;
  unit: string;
  stock_quantity: number | null;
  minimum_stock: number | null;
  average_cost: number | null;
  nutrition_quantity?: number | null;
  nutrition_unit?: string | null;
  kcal_amount?: number | null;
  expiration_date?: string | null;
  notes?: string | null;
  categories?: { name?: string | null } | null;
}

export interface InventoryMovementRow {
  id: string;
  ingredient_id?: string | null;
  ingredient_name: string | null;
  movement_type: string;
  quantity: number | null;
  unit_cost?: number | null;
  created_at: string;
  reason?: string | null;
}

export interface RecipeIngredientRef {
  name?: string | null;
  unit?: string | null;
  nutrition_quantity?: number | null;
  nutrition_unit?: string | null;
  kcal_amount?: number | null;
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
  estimated_servings?: number | null;
  estimated_kcal_total?: number | null;
  estimated_kcal_per_serving?: number | null;
  packaging_cost: number | null;
  additional_cost: number | null;
  notes?: string | null;
  recipe_items?: RecipeItemRow[];
  recipe_packaging_items?: RecipeItemRow[];
}

export interface SaleSummaryRow {
  id: string;
  order_code?: string | null;
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
  external_reference?: string | null;
  delivery_date: string | null;
  fiscal_status: string | null;
  stock_deducted?: boolean;
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
  product_id?: string | null;
  product_name: string;
  quantity: number | null;
  total_price?: number | null;
  estimated_margin?: number | null;
  margin_percent?: number | null;
}

export interface DashboardAlertRow {
  title: string;
  detail: string;
  tone: "warning" | "danger" | "success";
}

export interface ProductStockMovementRow {
  id: string;
  product_id?: string | null;
  product_name: string;
  movement_type: string;
  quantity: number | null;
  reason?: string | null;
  reference_type?: string | null;
  created_at: string;
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
  supplier_id?: string | null;
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
  purchase_unit?: string | null;
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
  product_id?: string | null;
  product_name: string;
  quantity: number | null;
  total_price: number | null;
  estimated_cost?: number | null;
  gross_revenue?: number | null;
  estimated_total_cost?: number | null;
  estimated_margin?: number | null;
  margin_percent?: number | null;
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
  stock_deducted?: boolean;
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
