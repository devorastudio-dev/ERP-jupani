import { createClient } from "@/lib/supabase/sever";

export async function getCompanySettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

