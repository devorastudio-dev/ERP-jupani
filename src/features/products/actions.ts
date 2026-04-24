"use server";

import { revalidatePath } from "next/cache";
import { productSchema } from "@/features/products/schema";
import { categorySchema } from "@/features/recipes/schema";
import { createClient } from "@/server/supabase/server";

function normalizeProductPayload(values: ReturnType<typeof productSchema.parse>) {
  return {
    ...values,
    category_id: values.category_id || null,
    description: values.description?.trim() || null,
    notes: values.notes?.trim() || null,
    photo_path: values.photo_path?.trim() || null,
  };
}

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    sale_price: formData.get("sale_price"),
    estimated_cost: formData.get("estimated_cost"),
    finished_stock_quantity: formData.get("finished_stock_quantity"),
    minimum_finished_stock: formData.get("minimum_finished_stock"),
    yield_quantity: formData.get("yield_quantity"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
    photo_path: formData.get("photo_path"),
    fulfillment_type: formData.get("fulfillment_type"),
    is_active: formData.get("is_active") === "true",
    show_on_storefront: formData.get("show_on_storefront") === "true",
    is_storefront_featured: formData.get("is_storefront_featured") === "true",
    is_storefront_favorite: formData.get("is_storefront_favorite") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const supabase = await createClient();
  const payload = normalizeProductPayload(parsed.data);
  const { error } = await supabase.from("products").insert(payload);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/site");
  revalidatePath("/");
  revalidatePath("/cardapio");
  return { success: true };
}

export async function updateProductAction(id: string, formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    sale_price: formData.get("sale_price"),
    estimated_cost: formData.get("estimated_cost"),
    finished_stock_quantity: formData.get("finished_stock_quantity"),
    minimum_finished_stock: formData.get("minimum_finished_stock"),
    yield_quantity: formData.get("yield_quantity"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
    photo_path: formData.get("photo_path"),
    fulfillment_type: formData.get("fulfillment_type"),
    is_active: formData.get("is_active") === "true",
    show_on_storefront: formData.get("show_on_storefront") === "true",
    is_storefront_featured: formData.get("is_storefront_featured") === "true",
    is_storefront_favorite: formData.get("is_storefront_favorite") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const supabase = await createClient();
  const payload = normalizeProductPayload(parsed.data);
  const { error } = await supabase.from("products").update(payload).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/site");
  revalidatePath("/");
  revalidatePath("/cardapio");
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

export async function createProductStockAdjustmentAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const movementType = String(formData.get("movement_type") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!productId) {
    return { success: false, error: "Selecione um produto." };
  }

  if (!["entrada_manual", "saida_manual", "ajuste"].includes(movementType)) {
    return { success: false, error: "Tipo de movimentação inválido." };
  }

  if (Number.isNaN(quantity) || quantity < 0) {
    return { success: false, error: "Informe uma quantidade válida." };
  }

  if (!reason) {
    return { success: false, error: "Informe o motivo da movimentação." };
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, fulfillment_type, finished_stock_quantity")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { success: false, error: productError?.message ?? "Produto não encontrado." };
  }

  if (product.fulfillment_type !== "pronta_entrega") {
    return { success: false, error: "Ajustes de produto acabado só se aplicam a itens de pronta-entrega." };
  }

  const currentStock = Number(product.finished_stock_quantity ?? 0);
  const nextStock =
    movementType === "entrada_manual"
      ? currentStock + quantity
      : movementType === "saida_manual"
        ? currentStock - quantity
        : quantity;

  if (nextStock < 0) {
    return { success: false, error: "A movimentação deixaria o estoque acabado negativo." };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ finished_stock_quantity: nextStock })
    .eq("id", productId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const movementQuantity = movementType === "ajuste" ? quantity : Math.abs(quantity);
  const { error: movementError } = await supabase.from("product_stock_movements").insert({
    product_id: product.id,
    product_name: product.name,
    movement_type: movementType,
    quantity: movementQuantity,
    reason,
    reference_type: "manual_finished_goods",
  });

  if (movementError) {
    return { success: false, error: movementError.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/vendas");
  return { success: true };
}
