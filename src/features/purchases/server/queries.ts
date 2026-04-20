import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type {
  AccountPayableRow,
  IngredientRow,
  PurchaseRow,
  SupplierRow,
} from "@/types/entities";

export async function getPurchasesPageData() {
  const supabase = await createClient();
  const [purchases, suppliers, ingredients, payables] = await Promise.all([
    safeQuery<PurchaseRow[]>(
      supabase
        .from("purchases")
        .select(`
          id,
          purchase_date,
          supplier_name,
          total_amount,
          status,
          payment_method,
          notes,
          generate_payable,
          purchase_items (
            id,
            ingredient_id,
            ingredient_name,
            quantity,
            unit_cost,
            total_cost
          )
        `)
        .order("purchase_date", { ascending: false }),
      [],
    ),
    safeQuery<SupplierRow[]>(supabase.from("suppliers").select("id, name, phone").order("name"), []),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, unit, stock_quantity, minimum_stock, average_cost")
        .order("name"),
      [],
    ),
    safeQuery<AccountPayableRow[]>(
      supabase
        .from("accounts_payable")
        .select("id, description, amount, paid_amount, due_date, status, origin, notes")
        .order("due_date", { ascending: true })
        .limit(12),
      [],
    ),
  ]);

  return { purchases, suppliers, ingredients, payables };
}
