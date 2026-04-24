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
  fulfillment_type,
  unit,
  notes,
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
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  unit: string;
  notes: string | null;
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

const buildFallbackImage = (name: string, category: string) => {
  const label = encodeURIComponent(name);
  const categoryLabel = encodeURIComponent(category);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fff4ec"/><stop offset="100%" stop-color="%23f3c6b1"/></linearGradient></defs><rect width="720" height="720" rx="56" fill="url(%23g)"/><circle cx="570" cy="150" r="120" fill="%23ffffff" opacity="0.55"/><circle cx="120" cy="610" r="150" fill="%23f8ddcf" opacity="0.8"/><text x="64" y="520" font-size="54" font-family="Arial, sans-serif" font-weight="700" fill="%233a231c">${label}</text><text x="64" y="585" font-size="28" font-family="Arial, sans-serif" fill="%237b3b30">${categoryLabel}</text><text x="64" y="645" font-size="24" font-family="Arial, sans-serif" fill="%237b3b30">Ju.pani</text></svg>`;
};

export const buildProductSlug = (id: string, name: string) =>
  `${id}--${slugify(name) || "produto"}`;

const mapProduct = (row: StorefrontProductRow): ProductCardData => {
  const categoryLabel = row.categories?.name?.trim() || "Sem categoria";
  const image = row.photo_path?.trim() || buildFallbackImage(row.name, categoryLabel);
  const availableForOrder =
    row.is_active &&
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
      supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true),
      [],
    ),
    safeQuery<StorefrontProductRow[]>(
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
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
  page = 1,
  pageSize = 9,
  includeInactive = false,
}: {
  query?: string;
  category?: string;
  featured?: boolean;
  favorite?: boolean;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}) {
  const supabase = await createClient();
  let builder = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });

  if (!includeInactive) {
    builder = builder.eq("is_active", true);
  }

  if (category && category !== "all") {
    builder = builder.eq("category_id", category);
  }

  if (featured) {
    builder = builder.eq("fulfillment_type", "pronta_entrega");
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

  let items = (result.data ?? []).map((row) => mapProduct(row as StorefrontProductRow));
  if (favorite) {
    items = items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

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
