import { createClient } from "@/server/supabase/server";
import { safeQuery } from "@/server/db/safe-query";
import type { IngredientRow, InventoryMovementRow } from "@/types/entities";

export async function getInventoryPageData() {
  const supabase = await createClient();
  const [movements, ingredients] = await Promise.all([
    safeQuery<InventoryMovementRow[]>(
      supabase
        .from("inventory_movements")
        .select("id, ingredient_id, ingredient_name, movement_type, quantity, unit_cost, created_at, reason")
        .order("created_at", { ascending: false }),
      [],
    ),
    safeQuery<IngredientRow[]>(
      supabase
        .from("ingredients")
        .select("id, name, stock_quantity, minimum_stock, unit, average_cost, expiration_date")
        .order("name"),
      [],
    ),
  ]);

  const expiringSoonCount = ingredients.filter((ingredient) => {
    if (!ingredient.expiration_date) return false;
    const expiration = new Date(`${ingredient.expiration_date}T00:00:00`);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  return { movements, ingredients, expiringSoonCount };
}
