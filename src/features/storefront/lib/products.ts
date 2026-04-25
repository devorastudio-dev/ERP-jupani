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
  healthy?: boolean;
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

export const getHealthyProducts = async () => {
  const { items } = await getStorefrontProducts({
    healthy: true,
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
  healthy,
  page = 1,
  pageSize = PRODUCT_PAGE_SIZE,
  includeInactive = false,
}: ProductFilters) => {
  return getStorefrontProducts({
    query,
    category,
    featured,
    favorite,
    healthy,
    page,
    pageSize,
    includeInactive,
  });
};
