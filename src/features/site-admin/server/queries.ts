import "server-only";

import { safeQuery } from "@/server/db/safe-query";
import { createClient } from "@/server/supabase/server";
import { getStorefrontSettings } from "@/features/storefront/server/settings";

type SiteProductRow = {
  id: string;
  name: string;
  sale_price: number | null;
  photo_path: string | null;
  is_active: boolean;
  show_on_storefront: boolean;
  is_storefront_featured: boolean;
  is_storefront_favorite: boolean;
  is_storefront_healthy: boolean;
  is_storefront_lactose_free: boolean;
  is_storefront_gluten_free: boolean;
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  finished_stock_quantity: number | null;
  categories: Array<{ id: string; name: string }>;
};

export async function getSiteAdminPageData() {
  const supabase = await createClient();

  const [products, settings] = await Promise.all([
    safeQuery<Array<Omit<SiteProductRow, "categories"> & {
      product_category_links?: Array<{
        product_categories?: Array<{ id: string; name: string }> | null;
      }> | null;
    }>>(
      supabase
        .from("products")
        .select(`
          id,
          name,
          sale_price,
          photo_path,
          is_active,
          show_on_storefront,
          is_storefront_featured,
          is_storefront_favorite,
          is_storefront_healthy,
          is_storefront_lactose_free,
          is_storefront_gluten_free,
          fulfillment_type,
          finished_stock_quantity,
          product_category_links(product_categories(id, name))
        `)
        .order("name"),
      [],
    ),
    getStorefrontSettings(),
  ]);

  const normalizedProducts: SiteProductRow[] = products.map((product) => ({
    ...product,
    categories:
      product.product_category_links
        ?.flatMap((link) => link.product_categories ?? [])
        .filter((category): category is { id: string; name: string } => Boolean(category?.id && category?.name)) ?? [],
  }));

  const publishedProducts = normalizedProducts.filter((product) => product.show_on_storefront);
  const featuredProducts = publishedProducts.filter((product) => product.is_storefront_featured);
  const favoriteProducts = publishedProducts.filter((product) => product.is_storefront_favorite);
  const hiddenProducts = normalizedProducts.filter((product) => !product.show_on_storefront);
  const unavailablePublishedProducts = publishedProducts.filter(
    (product) =>
      !product.is_active ||
      (product.fulfillment_type === "pronta_entrega" && Number(product.finished_stock_quantity ?? 0) <= 0),
  );

  return {
    settings,
    products: normalizedProducts,
    summary: {
      totalProducts: normalizedProducts.length,
      publishedProducts: publishedProducts.length,
      featuredProducts: featuredProducts.length,
      favoriteProducts: favoriteProducts.length,
      hiddenProducts: hiddenProducts.length,
      unavailablePublishedProducts: unavailablePublishedProducts.length,
    },
  };
}
