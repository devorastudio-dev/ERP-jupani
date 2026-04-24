import { z } from "zod";

export const companySettingsSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  trade_name: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  logo_url: z.string().url("URL da logo inválida").optional().or(z.literal("")),
  instagram_handle: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  default_currency: z.enum(["BRL", "USD"]).default("BRL"),
  default_locale: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  timezone: z.string().default("America/Sao_Paulo"),
  order_prefix: z.string().default("PED"),
  low_stock_alert_enabled: z.boolean().default(true),
  low_stock_alert_threshold: z.coerce.number().min(0, "Limite não pode ser negativo").default(0),
  site_tagline: z.string().optional(),
  site_hero_title: z.string().optional(),
  site_hero_description: z.string().optional(),
  site_business_hours: z.string().optional(),
  site_delivery_city: z.string().optional(),
  site_delivery_note: z.string().optional(),
  site_about_title: z.string().optional(),
  site_about_text_1: z.string().optional(),
  site_about_text_2: z.string().optional(),
  site_meta_description: z.string().optional(),
  site_footer_note: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export type CompanySettings = CompanySettingsFormValues & {
  id: string;
  created_at: string;
  updated_at: string;
};
