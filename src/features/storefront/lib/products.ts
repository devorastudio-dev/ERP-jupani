import "server-only";

import {
  getStorefrontProductBySlug,
  getStorefrontProducts,
} from "@/features/storefront/server/queries";

export const PRODUCT_PAGE_SIZE = 9;

export type ProductFilters = {
  query?: string;
  category?: string;
  featured?: boolean;
  favorite?: boolean;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
};

export const getFeaturedProducts = async () => {
  const { items } = await getStorefrontProducts({
    featured: true,
    pageSize: 8,
  });
  return items;
};

export const getFavoriteProducts = async () => {
  const { items } = await getStorefrontProducts({
    favorite: true,
    pageSize: 8,
  });
  return items;
};

export const getProductBySlug = async (slug: string) => getStorefrontProductBySlug(slug);

export const getProducts = async ({
  query,
  category,
  featured,
  favorite,
  page = 1,
  pageSize = PRODUCT_PAGE_SIZE,
  includeInactive = false,
}: ProductFilters) => {
  return getStorefrontProducts({
    query,
    category,
    featured,
    favorite,
    page,
    pageSize,
    includeInactive,
  });
};
