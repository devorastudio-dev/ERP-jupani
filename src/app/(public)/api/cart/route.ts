import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  CART_COOKIE,
  CART_MAX_AGE_DAYS,
  addItemToCart,
  getEmptyCart,
  parseCart,
  removeItemFromCart,
  serializeCart,
  setCartNotes,
  updateItemInCart,
} from "@/features/storefront/lib/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const addSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  itemNotes: z.string().optional().nullable(),
});

const updateSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  itemNotes: z.string().optional().nullable(),
});

const notesSchema = z.object({
  notes: z.string(),
});

const deleteSchema = z.object({
  productId: z.string().optional(),
  clear: z.boolean().optional(),
});

const setCookie = async (cartValue: string) => {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, cartValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE_DAYS * 24 * 60 * 60,
  });
};

export async function GET() {
  const cookieStore = await cookies();
  const cart = parseCart(cookieStore.get(CART_COOKIE)?.value);
  return NextResponse.json({ ok: true, cart });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const payload = addSchema.parse(await request.json());
    const cart = parseCart(cookieStore.get(CART_COOKIE)?.value);
    const updatedCart = addItemToCart(cart, {
      ...payload,
      image: payload.image ?? null,
      itemNotes: payload.itemNotes ?? null,
    });
    await setCookie(serializeCart(updatedCart));
    return NextResponse.json({ ok: true, cart: updatedCart });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao adicionar.",
        message: error instanceof Error ? error.message : "Erro ao adicionar.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const cart = parseCart(cookieStore.get(CART_COOKIE)?.value);

    if ("notes" in body) {
      const payload = notesSchema.parse(body);
      const updatedCart = setCartNotes(cart, payload.notes);
      await setCookie(serializeCart(updatedCart));
      return NextResponse.json({ ok: true, cart: updatedCart });
    }

    const payload = updateSchema.parse(body);
    const updatedCart = updateItemInCart({
      cart,
      productId: payload.productId,
      quantity: payload.quantity,
      itemNotes: payload.itemNotes,
    });
    await setCookie(serializeCart(updatedCart));
    return NextResponse.json({ ok: true, cart: updatedCart });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar.",
        message: error instanceof Error ? error.message : "Erro ao atualizar.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const payload = deleteSchema.parse(await request.json());
    if (payload.clear) {
      const emptyCart = getEmptyCart();
      await setCookie(serializeCart(emptyCart));
      return NextResponse.json({ ok: true, cart: emptyCart });
    }

    if (!payload.productId) {
      throw new Error("Produto não informado.");
    }

    const cart = parseCart(cookieStore.get(CART_COOKIE)?.value);
    const updatedCart = removeItemFromCart(cart, payload.productId);
    await setCookie(serializeCart(updatedCart));
    return NextResponse.json({ ok: true, cart: updatedCart });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao remover.",
        message: error instanceof Error ? error.message : "Erro ao remover.",
      },
      { status: 400 }
    );
  }
}
