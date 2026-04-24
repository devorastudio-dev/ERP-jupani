import "server-only";

import { getCompanySettings } from "@/features/settings/server/queries";

export type StorefrontSettings = {
  brandName: string;
  phoneDisplay: string;
  phoneE164: string;
  instagramHandle: string;
  instagramUrl: string;
  address: {
    street: string;
    district: string;
    city: string;
    state: string;
    zip: string;
  };
  tagline: string;
  heroTitle: string;
  heroDescription: string;
  businessHours: string;
  deliveryCity: string;
  deliveryNote: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  metaDescription: string;
  footerNote: string;
};

const DEFAULT_SETTINGS: StorefrontSettings = {
  brandName: "Ju.pani",
  phoneDisplay: "(37) 99832-0409",
  phoneE164: "5537998320409",
  instagramHandle: "jupani.confeitaria",
  instagramUrl: "https://instagram.com/jupani.confeitaria",
  address: {
    street: "Rua Bela Vista, 40",
    district: "Planalto",
    city: "Piracema",
    state: "MG",
    zip: "35536-000",
  },
  tagline: "Confeitaria artesanal",
  heroTitle: "Doces com memória afetiva, feitos para celebrar cada detalhe.",
  heroDescription:
    "Na Ju.pani, cada receita é criada à mão com ingredientes frescos, texturas delicadas e combinações que aquecem o coração.",
  businessHours: "Segunda a sábado · 9h às 19h",
  deliveryCity: "Piracema",
  deliveryNote: "Cobertura inicial para bairros selecionados de Piracema.",
  aboutTitle: "Uma confeitaria feita de encontros",
  aboutText1:
    "A Ju.pani nasceu do desejo de criar momentos doces e acolhedores. Entre receitas familiares, cadernos de sabores e tardes de testes, fomos refinando cada detalhe para transformar celebrações simples em experiências memoráveis.",
  aboutText2:
    "Hoje trabalhamos com pequenos lotes, ingredientes frescos e um cuidado artesanal em cada etapa. Nosso ateliê é um espaço de criatividade, afeto e escuta — tudo para que você se sinta em casa.",
  metaDescription:
    "Bolos, doces e tortas artesanais. Confira os destaques da semana e finalize seu pedido no WhatsApp.",
  footerNote: "Desenvolvido por Devora Studio.",
};

const normalizePhone = (value?: string | null) => (value ?? "").replace(/\D/g, "");

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const settings = await getCompanySettings().catch(() => null);

  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  const rawWhatsapp = normalizePhone(settings.whatsapp || settings.phone);
  const phoneE164 = rawWhatsapp
    ? rawWhatsapp.startsWith("55")
      ? rawWhatsapp
      : `55${rawWhatsapp}`
    : DEFAULT_SETTINGS.phoneE164;

  const instagramHandle =
    settings.instagram_handle?.replace(/^@/, "").trim() || DEFAULT_SETTINGS.instagramHandle;

  return {
    brandName: settings.trade_name?.trim() || settings.company_name?.trim() || DEFAULT_SETTINGS.brandName,
    phoneDisplay: settings.whatsapp?.trim() || settings.phone?.trim() || DEFAULT_SETTINGS.phoneDisplay,
    phoneE164,
    instagramHandle,
    instagramUrl: `https://instagram.com/${instagramHandle}`,
    address: {
      street: settings.address?.trim() || DEFAULT_SETTINGS.address.street,
      district: DEFAULT_SETTINGS.address.district,
      city: settings.city?.trim() || DEFAULT_SETTINGS.address.city,
      state: settings.state?.trim() || DEFAULT_SETTINGS.address.state,
      zip: settings.zip_code?.trim() || DEFAULT_SETTINGS.address.zip,
    },
    tagline: settings.site_tagline?.trim() || DEFAULT_SETTINGS.tagline,
    heroTitle: settings.site_hero_title?.trim() || DEFAULT_SETTINGS.heroTitle,
    heroDescription: settings.site_hero_description?.trim() || DEFAULT_SETTINGS.heroDescription,
    businessHours: settings.site_business_hours?.trim() || DEFAULT_SETTINGS.businessHours,
    deliveryCity: settings.site_delivery_city?.trim() || settings.city?.trim() || DEFAULT_SETTINGS.deliveryCity,
    deliveryNote: settings.site_delivery_note?.trim() || DEFAULT_SETTINGS.deliveryNote,
    aboutTitle: settings.site_about_title?.trim() || DEFAULT_SETTINGS.aboutTitle,
    aboutText1: settings.site_about_text_1?.trim() || DEFAULT_SETTINGS.aboutText1,
    aboutText2: settings.site_about_text_2?.trim() || DEFAULT_SETTINGS.aboutText2,
    metaDescription: settings.site_meta_description?.trim() || DEFAULT_SETTINGS.metaDescription,
    footerNote: settings.site_footer_note?.trim() || DEFAULT_SETTINGS.footerNote,
  };
}
