import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { IngredientRow, InventoryMovementRow } from "@/types/entities";

export async function getInventoryPageData() {
  const supabase = await createClient();
  const [movements, ingredients] = await Promise.all([
    safeQuery<InventoryMovementRow[]>(
      supabase
        .from("inventory_movements")
        .select("id, ingredient_name, movement_type, quantity, created_at, reason")
        .order("created_at", { ascending: false }),
      [],
    ),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, stock_quantity, minimum_stock, unit")
        .order("name"),
      [],
    ),
  ]);

  return { movements, ingredients };
}
