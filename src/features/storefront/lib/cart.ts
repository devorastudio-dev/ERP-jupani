import "server-only";
import { z } from "zod";
import type { Cart, CartItem } from "@/features/storefront/lib/types";

const customizationSchema = z
  .object({
    flavor: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    theme: z.string().optional().nullable(),
    customMessage: z.string().optional().nullable(),
    eventDate: z.string().optional().nullable(),
    servingCount: z.number().optional().nullable(),
    variantNotes: z.string().optional().nullable(),
    selectedAddons: z.array(z.string()).optional().nullable(),
    answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().nullable(),
  })
  .optional()
  .nullable();

export const CART_COOKIE = "ju_cart";
export const CART_MAX_AGE_DAYS = 7;

const normalizeCartImage = (image?: string | null) => {
  if (!image) {
    return null;
  }
  if (image.startsWith("data:")) {
    return null;
  }
  return image;
};

const normalizeLegacyUnitPrice = (unitPrice: number) => {
  if (Number.isInteger(unitPrice) && unitPrice >= 1000) {
    return unitPrice / 100;
  }

  return unitPrice;
};

const cartItemSchema = z
  .object({
    productId: z.string(),
    name: z.string(),
    slug: z.string(),
    image: z.string().nullable().optional().default(null),
    unitPrice: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    itemNotes: z.string().nullable().optional(),
    customization: customizationSchema,
  })
  .transform((item) => ({
    ...item,
    image: normalizeCartImage(item.image ?? null),
    unitPrice: normalizeLegacyUnitPrice(item.unitPrice),
    customization: item.customization ?? null,
  }));

const cartSchema = z.object({
  items: z.array(cartItemSchema),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const getEmptyCart = (): Cart => ({
  items: [],
  notes: "",
  updatedAt: new Date().toISOString(),
});

const decodeCart = (value: string) => {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    const result = cartSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // ignore
  }
  return null;
};

export const parseCart = (cookieValue?: string | null): Cart => {
  if (!cookieValue) {
    return getEmptyCart();
  }

  const cart = decodeCart(cookieValue);
  return cart ?? getEmptyCart();
};

export const serializeCart = (cart: Cart) => {
  const sanitizedCart: Cart = {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      image: normalizeCartImage(item.image),
    })),
  };
  const serialized = JSON.stringify(sanitizedCart);
  return Buffer.from(serialized, "utf-8").toString("base64url");
};

export const addItemToCart = (cart: Cart, item: CartItem): Cart => {
  const existing = cart.items.find((entry) => entry.productId === item.productId);

  if (existing) {
    existing.quantity += item.quantity;
    existing.itemNotes = item.itemNotes ?? existing.itemNotes ?? null;
    existing.customization = item.customization ?? existing.customization ?? null;
  } else {
    cart.items.push({ ...item });
  }

  cart.updatedAt = new Date().toISOString();
  return cart;
};

export const updateItemInCart = ({
  cart,
  productId,
  quantity,
  itemNotes,
  customization,
}: {
  cart: Cart;
  productId: string;
  quantity: number;
  itemNotes?: string | null;
  customization?: CartItem["customization"];
}) => {
  const item = cart.items.find((entry) => entry.productId === productId);
  if (!item) {
    return cart;
  }

  item.quantity = quantity;
  if (itemNotes !== undefined) {
    item.itemNotes = itemNotes;
  }
  if (customization !== undefined) {
    item.customization = customization;
  }

  cart.updatedAt = new Date().toISOString();
  return cart;
};

export const removeItemFromCart = (cart: Cart, productId: string) => {
  cart.items = cart.items.filter((item) => item.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  return cart;
};

export const setCartNotes = (cart: Cart, notes: string) => {
  cart.notes = notes;
  cart.updatedAt = new Date().toISOString();
  return cart;
};
