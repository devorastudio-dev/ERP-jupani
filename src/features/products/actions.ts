"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/features/products/schema";
import { recalculateRecipeAndProductMetrics } from "@/features/recipes/server/recalculate-metrics";
import { categorySchema } from "@/features/recipes/schema";
import { createClient } from "@/server/supabase/server";

const PRODUCT_IMAGES_BUCKET = "product-images";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function normalizeProductPayload(values: ReturnType<typeof productSchema.parse>) {
  const normalizedCategoryIds = Array.from(
    new Set(
      [values.category_id, ...values.category_ids].filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      ),
    ),
  );

  return {
    ...values,
    category_id: normalizedCategoryIds[0] ?? null,
    category_ids: normalizedCategoryIds,
    pan_shape_code: values.pan_shape_code?.trim() || null,
    serving_reference_quantity:
      values.serving_reference_quantity && values.serving_reference_quantity > 0
        ? values.serving_reference_quantity
        : null,
    serving_reference_unit: values.serving_reference_unit?.trim() || null,
    public_ingredients_text: values.public_ingredients_text?.trim() || null,
    description: values.description?.trim() || null,
    notes: values.notes?.trim() || null,
    photo_path: values.photo_path?.trim() || null,
  };
}

async function syncProductCategories(productId: string, categoryIds: string[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase.from("product_category_links").delete().eq("product_id", productId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!categoryIds.length) {
    return;
  }

  const { error: insertError } = await supabase.from("product_category_links").insert(
    categoryIds.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function getImageExtension(file: File) {
  const filenameExtension = file.name.split(".").pop()?.trim().toLowerCase();
  if (filenameExtension && /^[a-z0-9]+$/.test(filenameExtension)) {
    return filenameExtension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadProductImage(file: File) {
  if (!file.size) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Envie uma imagem JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const supabase = await createClient();
  const extension = getImageExtension(file);
  const objectPath = `products/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, bytes, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    category_ids: formData.getAll("category_ids"),
    description: formData.get("description"),
    sale_price: formData.get("sale_price"),
    estimated_cost: formData.get("estimated_cost"),
    finished_stock_quantity: formData.get("finished_stock_quantity"),
    minimum_finished_stock: formData.get("minimum_finished_stock"),
    yield_quantity: formData.get("yield_quantity"),
    unit: formData.get("unit"),
    pan_shape_code: formData.get("pan_shape_code"),
    serving_reference_quantity: formData.get("serving_reference_quantity"),
    serving_reference_unit: formData.get("serving_reference_unit"),
    public_ingredients_text: formData.get("public_ingredients_text"),
    notes: formData.get("notes"),
    photo_path: formData.get("photo_path"),
    fulfillment_type: formData.get("fulfillment_type"),
    is_active: formData.get("is_active") === "true",
    show_on_storefront: formData.get("show_on_storefront") === "true",
    is_storefront_featured: formData.get("is_storefront_featured") === "true",
    is_storefront_favorite: formData.get("is_storefront_favorite") === "true",
    is_storefront_healthy: formData.get("is_storefront_healthy") === "true",
    is_storefront_lactose_free: formData.get("is_storefront_lactose_free") === "true",
    is_storefront_gluten_free: formData.get("is_storefront_gluten_free") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const uploadedPhoto = formData.get("uploaded_photo");
  let uploadedPhotoUrl: string | null = null;

  try {
    if (uploadedPhoto instanceof File && uploadedPhoto.size > 0) {
      uploadedPhotoUrl = await uploadProductImage(uploadedPhoto);
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível enviar a imagem." };
  }

  const supabase = await createClient();
  const payload = normalizeProductPayload({
    ...parsed.data,
    photo_path: uploadedPhotoUrl ?? parsed.data.photo_path,
  });
  const { category_ids, ...productPayload } = payload;
  const { data: product, error } = await supabase.from("products").insert(productPayload).select("id").single();

  if (error || !product) {
    return { success: false, error: error.message };
  }

  try {
    await syncProductCategories(product.id, category_ids);
  } catch (syncError) {
    return { success: false, error: syncError instanceof Error ? syncError.message : "Não foi possível salvar as categorias." };
  }

  revalidatePath("/produtos");
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/site");
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/saudavel");
  return { success: true };
}

export async function updateProductAction(id: string, formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    category_ids: formData.getAll("category_ids"),
    description: formData.get("description"),
    sale_price: formData.get("sale_price"),
    estimated_cost: formData.get("estimated_cost"),
    finished_stock_quantity: formData.get("finished_stock_quantity"),
    minimum_finished_stock: formData.get("minimum_finished_stock"),
    yield_quantity: formData.get("yield_quantity"),
    unit: formData.get("unit"),
    pan_shape_code: formData.get("pan_shape_code"),
    serving_reference_quantity: formData.get("serving_reference_quantity"),
    serving_reference_unit: formData.get("serving_reference_unit"),
    public_ingredients_text: formData.get("public_ingredients_text"),
    notes: formData.get("notes"),
    photo_path: formData.get("photo_path"),
    fulfillment_type: formData.get("fulfillment_type"),
    is_active: formData.get("is_active") === "true",
    show_on_storefront: formData.get("show_on_storefront") === "true",
    is_storefront_featured: formData.get("is_storefront_featured") === "true",
    is_storefront_favorite: formData.get("is_storefront_favorite") === "true",
    is_storefront_healthy: formData.get("is_storefront_healthy") === "true",
    is_storefront_lactose_free: formData.get("is_storefront_lactose_free") === "true",
    is_storefront_gluten_free: formData.get("is_storefront_gluten_free") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const uploadedPhoto = formData.get("uploaded_photo");
  let uploadedPhotoUrl: string | null = null;

  try {
    if (uploadedPhoto instanceof File && uploadedPhoto.size > 0) {
      uploadedPhotoUrl = await uploadProductImage(uploadedPhoto);
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível enviar a imagem." };
  }

  const supabase = await createClient();
  const payload = normalizeProductPayload({
    ...parsed.data,
    photo_path: uploadedPhotoUrl ?? parsed.data.photo_path,
  });
  const { category_ids, ...productPayload } = payload;
  const { error } = await supabase.from("products").update(productPayload).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    await syncProductCategories(id, category_ids);
  } catch (syncError) {
    return { success: false, error: syncError instanceof Error ? syncError.message : "Não foi possível salvar as categorias." };
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("product_id", id)
    .maybeSingle();

  if (recipe?.id) {
    await recalculateRecipeAndProductMetrics(recipe.id);
  }

  revalidatePath("/produtos");
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/site");
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/saudavel");
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

export async function updateProductCategoryAction(id: string, formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Categoria inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").update(parsed.data).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/saudavel");
  return { success: true };
}

export async function deleteProductCategoryAction(id: string) {
  const supabase = await createClient();

  const { data: linkedProducts, error: linkedProductsError } = await supabase
    .from("product_category_links")
    .select("product_id")
    .eq("category_id", id);

  if (linkedProductsError) {
    return { success: false, error: linkedProductsError.message };
  }

  const affectedProductIds = Array.from(new Set((linkedProducts ?? []).map((item) => item.product_id)));

  const { error: deleteLinksError } = await supabase.from("product_category_links").delete().eq("category_id", id);
  if (deleteLinksError) {
    return { success: false, error: deleteLinksError.message };
  }

  const { error: clearPrimaryError } = await supabase.from("products").update({ category_id: null }).eq("category_id", id);
  if (clearPrimaryError) {
    return { success: false, error: clearPrimaryError.message };
  }

  for (const productId of affectedProductIds) {
    const { data: remainingLink, error: remainingLinkError } = await supabase
      .from("product_category_links")
      .select("category_id")
      .eq("product_id", productId)
      .limit(1)
      .maybeSingle();

    if (remainingLinkError) {
      return { success: false, error: remainingLinkError.message };
    }

    if (remainingLink?.category_id) {
      const { error: restorePrimaryError } = await supabase
        .from("products")
        .update({ category_id: remainingLink.category_id })
        .eq("id", productId);

      if (restorePrimaryError) {
        return { success: false, error: restorePrimaryError.message };
      }
    }
  }

  const { error: deleteCategoryError } = await supabase.from("product_categories").delete().eq("id", id);
  if (deleteCategoryError) {
    return { success: false, error: deleteCategoryError.message };
  }

  revalidatePath("/produtos");
  revalidatePath("/site");
  revalidatePath("/");
  revalidatePath("/cardapio");
  revalidatePath("/saudavel");
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
