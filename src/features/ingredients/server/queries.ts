import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { IngredientRow, InventoryMovementRow, NamedCategory } from "@/types/entities";

export async function getIngredientsPageData() {
  const supabase = await createClient();
  const [ingredients, categories, movements] = await Promise.all([
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select(
          "id, name, category_id, unit, stock_quantity, minimum_stock, average_cost, nutrition_quantity, nutrition_unit, kcal_amount, expiration_date, notes, categories:ingredient_categories(name)",
        )
        .order("name"),
      [],
    ),
    safeQuery<NamedCategory[]>(supabase.from("ingredient_categories").select("id, name").order("name"), []),
    safeQuery<InventoryMovementRow[]>(
      supabase
        .from("inventory_movements")
        .select("id, movement_type, quantity, ingredient_name, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      [],
    ),
  ]);

  return { ingredients, categories, movements };
}
