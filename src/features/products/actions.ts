"use server";

import { revalidatePath } from "next/cache";
import { productSchema } from "@/features/products/schema";
import { categorySchema } from "@/features/recipes/schema";
import { createClient } from "@/server/supabase/server";

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    sale_price: formData.get("sale_price"),
    estimated_cost: formData.get("estimated_cost"),
    yield_quantity: formData.get("yield_quantity"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
    fulfillment_type: formData.get("fulfillment_type"),
    is_active: formData.get("is_active") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    ...parsed.data,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/fichas-tecnicas");
  return { success: true };
}

export async function createProductCategoryAction(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Categoria inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/produtos");
  return { success: true };
}
