import { z } from "zod";

const optionalNumberField = () =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return value;
    },
    z.coerce.number().min(0).nullable().optional(),
  );

export const productSchema = z.object({
  name: z.string().min(3, "Informe o nome do produto."),
  category_id: z.string().uuid().optional().or(z.literal("")),
  category_ids: z.array(z.string().uuid()).default([]),
  description: z.string().optional(),
  sale_price: z.coerce.number().min(0),
  estimated_cost: z.coerce.number().min(0).default(0),
  finished_stock_quantity: z.coerce.number().min(0).default(0),
  minimum_finished_stock: z.coerce.number().min(0).default(0),
  yield_quantity: z.coerce.number().min(0).default(1),
  unit: z.string().min(1, "Informe a unidade."),
  pan_shape_code: z.string().optional(),
  serving_reference_quantity: z.coerce.number().min(0).optional().nullable(),
  serving_reference_unit: z.string().optional(),
  public_ingredients_text: z.string().optional(),
  notes: z.string().optional(),
  photo_path: z.string().optional(),
  product_line: z.enum(["geral", "bolos_aniversario", "docinhos", "merendas"]).default("geral"),
  order_mode: z.enum(["sob_encomenda", "pronta_entrega", "ambos"]).default("sob_encomenda"),
  minimum_order_quantity: optionalNumberField(),
  minimum_order_unit: z.string().optional(),
  lead_time_hours: optionalNumberField(),
  accepts_flavor_selection: z.coerce.boolean().default(false),
  accepts_size_selection: z.coerce.boolean().default(false),
  accepts_theme_customization: z.coerce.boolean().default(false),
  accepts_custom_message: z.coerce.boolean().default(false),
  accepts_event_date: z.coerce.boolean().default(false),
  accepts_serving_count: z.coerce.boolean().default(false),
  accepts_variant_notes: z.coerce.boolean().default(false),
  requires_manual_quote: z.coerce.boolean().default(false),
  order_guidelines: z.string().optional(),
  storefront_section_title: z.string().optional(),
  storefront_badge_text: z.string().optional(),
  fulfillment_type: z.enum(["sob_encomenda", "pronta_entrega"]),
  is_active: z.coerce.boolean().default(true),
  show_on_storefront: z.coerce.boolean().default(true),
  is_storefront_featured: z.coerce.boolean().default(false),
  is_storefront_favorite: z.coerce.boolean().default(false),
  is_storefront_healthy: z.coerce.boolean().default(false),
  is_storefront_lactose_free: z.coerce.boolean().default(false),
  is_storefront_gluten_free: z.coerce.boolean().default(false),
});

export const panShapeSchema = z.object({
  name: z.string().min(3, "Informe o nome da forma."),
  estimated_servings: z.coerce.number().positive("Informe um rendimento maior que zero."),
});

export type ProductSchema = z.infer<typeof productSchema>;
export type PanShapeSchema = z.infer<typeof panShapeSchema>;
