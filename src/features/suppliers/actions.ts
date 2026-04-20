"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/sever";
import { supplierSchema } from "./schema";

function normalizeSupplierPayload(values: ReturnType<typeof supplierSchema.parse>) {
  return {
    name: values.name.trim(),
    contact_name: values.contact_name?.trim() || null,
    phone: values.phone?.trim() || null,
    whatsapp: values.whatsapp?.trim() || null,
    email: values.email?.trim() || null,
    notes: values.notes?.trim() || null,
  };
}

async function persistSupplier(
  mode: "create" | "update",
  payload: ReturnType<typeof normalizeSupplierPayload>,
  id?: string,
) {
  const supabase = await createClient();
  const builder =
    mode === "create"
      ? supabase.from("suppliers").insert(payload)
      : supabase.from("suppliers").update(payload).eq("id", id!);

  const { error } = await builder.select();
  if (!error) return;

  if (error.message.toLowerCase().includes("contact_name")) {
    const legacyPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== "contact_name"),
    );
    const fallbackBuilder =
      mode === "create"
        ? supabase.from("suppliers").insert(legacyPayload)
        : supabase.from("suppliers").update(legacyPayload).eq("id", id!);
    const { error: fallbackError } = await fallbackBuilder.select();
    if (!fallbackError) return;
    throw new Error(fallbackError.message);
  }

  throw new Error(error.message);
}

export async function createSupplier(formData: FormData) {
  const values = supplierSchema.parse({
    name: formData.get("name"),
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  await persistSupplier("create", normalizeSupplierPayload(values));

  revalidatePath("/fornecedores");
}

export async function updateSupplier(id: string, formData: FormData) {
  const values = supplierSchema.parse({
    name: formData.get("name"),
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  await persistSupplier("update", normalizeSupplierPayload(values), id);

  revalidatePath("/fornecedores");
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fornecedores");
}
