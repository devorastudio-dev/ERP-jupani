"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/sever";
import { companySettingsSchema } from "./schema";

export async function updateCompanySettings(formData: FormData) {
  const values = companySettingsSchema.parse(Object.fromEntries(formData));

  const supabase = await createClient();

  const { data: existingSettings, error: fetchError } = await supabase
    .from("company_settings")
    .select("id")
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const id = existingSettings?.id ?? randomUUID();

  const { error } = await supabase
    .from("company_settings")
    .upsert({
      ...values,
      id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/configuracoes");
}

