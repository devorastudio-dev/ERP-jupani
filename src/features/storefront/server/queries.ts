import "server-only";

import { safeQuery } from "@/server/db/safe-query";
import { createClient } from "@/server/supabase/server";
import type { ProductCardData, StorefrontCategory } from "@/features/storefront/lib/types";

const PRODUCT_SELECT = `
  id,
  name,
  description,
  sale_price,
  photo_path,
  category_id,
  is_active,
  show_on_storefront,
  is_storefront_featured,
  is_storefront_favorite,
  is_storefront_healthy,
  fulfillment_type,
  unit,
  notes,
  estimated_servings,
  estimated_kcal_total,
  estimated_kcal_per_serving,
  public_ingredients_text,
  created_at,
  finished_stock_quantity,
  categories:product_categories(name)
`;

type StorefrontProductRow = {
  id: string;
  name: string;
  description: string | null;
  sale_price: number | null;
  photo_path: string | null;
  category_id: string | null;
  is_active: boolean;
  show_on_storefront: boolean;
  is_storefront_featured: boolean;
  is_storefront_favorite: boolean;
  is_storefront_healthy: boolean;
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  unit: string;
  notes: string | null;
  estimated_servings: number | null;
  estimated_kcal_total: number | null;
  estimated_kcal_per_serving: number | null;
  public_ingredients_text: string | null;
  created_at: string;
  finished_stock_quantity: number | null;
  categories: { name?: string | null } | null;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const slugify = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const FALLBACK_IMAGES = [
  { match: ["bolo"], image: "/images/products/bolo-red-velvet.svg" },
  { match: ["doce", "brigadeiro"], image: "/images/products/brigadeiro-gourmet.svg" },
  { match: ["torta"], image: "/images/products/torta-limao.svg" },
  { match: ["kit"], image: "/images/products/kit-festa.svg" },
  { match: ["salgado", "quiche"], image: "/images/products/quiche-alho-poro.svg" },
];

const buildFallbackImage = (category: string) => {
  const normalizedCategory = normalizeText(category);
  return (
    FALLBACK_IMAGES.find((item) =>
      item.match.some((term) => normalizedCategory.includes(term))
    )?.image ?? "/images/products/brownie-belga.svg"
  );
};

export const buildProductSlug = (id: string, name: string) =>
  `${id}--${slugify(name) || "produto"}`;

const mapProduct = (row: StorefrontProductRow): ProductCardData => {
  const categoryLabel = row.categories?.name?.trim() || "Sem categoria";
  const image = row.photo_path?.trim() || buildFallbackImage(categoryLabel);
  const displayIngredients = row.public_ingredients_text?.trim() || null;
  const availableForOrder =
    row.is_active &&
    row.show_on_storefront &&
    (row.fulfillment_type === "sob_encomenda" || Number(row.finished_stock_quantity ?? 0) > 0);

  return {
    id: row.id,
    name: row.name,
    slug: buildProductSlug(row.id, row.name),
    description: row.description?.trim() || "Receita artesanal feita sob encomenda.",
    price: Number(row.sale_price ?? 0),
    images: [image],
    category: categoryLabel,
    categoryId: row.category_id,
    active: row.is_active,
    fulfillmentType: row.fulfillment_type,
    unit: row.unit,
    stockQuantity: Number(row.finished_stock_quantity ?? 0),
    estimatedServings: Number(row.estimated_servings ?? 0),
    estimatedKcalTotal: Number(row.estimated_kcal_total ?? 0),
    estimatedKcalPerServing: Number(row.estimated_kcal_per_serving ?? 0),
    displayIngredients,
    isHealthy: row.is_storefront_healthy,
    notes: row.notes,
    availableForOrder,
  };
};

export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  const supabase = await createClient();
  const categories = await safeQuery<{ id: string; name: string }[]>(
    supabase.from("product_categories").select("id, name").order("name"),
    [],
  );

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));
}

export async function getStorefrontSummary() {
  const supabase = await createClient();
  const [categories, products, readyProducts] = await Promise.all([
    getStorefrontCategories(),
    safeQuery<StorefrontProductRow[]>(
      supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).eq("show_on_storefront", true),
      [],
    ),
    safeQuery<StorefrontProductRow[]>(
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .eq("show_on_storefront", true)
        .eq("fulfillment_type", "pronta_entrega"),
      [],
    ),
  ]);

  return {
    categoriesCount: categories.length,
    productsCount: products.length,
    prontaEntregaCount: readyProducts.filter((item) => Number(item.finished_stock_quantity ?? 0) > 0).length,
  };
}

export async function getStorefrontProducts({
  query,
  category,
  featured,
  favorite,
  healthy,
  page = 1,
  pageSize = 9,
  includeInactive = false,
}: {
  query?: string;
  category?: string;
  featured?: boolean;
  favorite?: boolean;
  healthy?: boolean;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}) {
  const supabase = await createClient();
  let builder = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });

  if (!includeInactive) {
    builder = builder.eq("is_active", true);
    builder = builder.eq("show_on_storefront", true);
  }

  if (category && category !== "all") {
    builder = builder.eq("category_id", category);
  }

  if (featured) {
    builder = builder.eq("is_storefront_featured", true);
  }

  if (favorite) {
    builder = builder.eq("is_storefront_favorite", true);
  }

  if (healthy) {
    builder = builder.eq("is_storefront_healthy", true);
  }

  if (query?.trim()) {
    const sanitized = query.trim().replace(/[%_,]/g, " ");
    builder = builder.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
  }

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const result = await builder.order("created_at", { ascending: false }).range(from, to);

  if (result.error) {
    console.error(result.error.message);
    return { items: [] as ProductCardData[], total: 0, totalPages: 1 };
  }

  const items = (result.data ?? []).map((row) => mapProduct(row as StorefrontProductRow));

  const total = result.count ?? 0;
  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStorefrontProductBySlug(slug: string) {
  const productId = slug.split("--")[0];
  if (!productId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("is_active", true)
    .eq("show_on_storefront", true)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapProduct(data as StorefrontProductRow);
}
