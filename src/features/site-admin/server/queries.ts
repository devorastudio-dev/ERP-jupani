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
  fulfillment_type: "sob_encomenda" | "pronta_entrega";
  finished_stock_quantity: number | null;
  categories: { name?: string | null } | null;
};

export async function getSiteAdminPageData() {
  const supabase = await createClient();

  const [products, settings] = await Promise.all([
    safeQuery<SiteProductRow[]>(
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
          fulfillment_type,
          finished_stock_quantity,
          categories:product_categories(name)
        `)
        .order("name"),
      [],
    ),
    getStorefrontSettings(),
  ]);

  const publishedProducts = products.filter((product) => product.show_on_storefront);
  const featuredProducts = publishedProducts.filter((product) => product.is_storefront_featured);
  const favoriteProducts = publishedProducts.filter((product) => product.is_storefront_favorite);
  const hiddenProducts = products.filter((product) => !product.show_on_storefront);
  const unavailablePublishedProducts = publishedProducts.filter(
    (product) =>
      !product.is_active ||
      (product.fulfillment_type === "pronta_entrega" && Number(product.finished_stock_quantity ?? 0) <= 0),
  );

  return {
    settings,
    products,
    summary: {
      totalProducts: products.length,
      publishedProducts: publishedProducts.length,
      featuredProducts: featuredProducts.length,
      favoriteProducts: favoriteProducts.length,
      hiddenProducts: hiddenProducts.length,
      unavailablePublishedProducts: unavailablePublishedProducts.length,
    },
  };
}
