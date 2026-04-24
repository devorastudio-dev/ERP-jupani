import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CART_COOKIE, getEmptyCart, parseCart, serializeCart } from "@/features/storefront/lib/cart";
import { ATELIER_ADDRESS } from "@/features/storefront/lib/contact";
import {
  calculateShipping,
  supportsDelivery,
  type ShippingMethod,
} from "@/features/storefront/lib/shipping";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/features/storefront/lib/whatsapp";
import { createClient } from "@/server/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  addressReference: z.string().optional(),
  paymentMethod: z.string().min(2),
  shippingMethod: z.enum(["DELIVERY", "PICKUP"]),
});

const formatAddress = ({
  street,
  number,
  district,
  city,
  state,
  zip,
}: {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zip: string;
}) =>
  `${street}, ${number} - ${district}, ${city} / ${state} - ${zip}`;

export async function POST(request: Request) {
  try {
    const payload = orderSchema.parse(await request.json());
    const cookieStore = await cookies();
    const cart = parseCart(cookieStore.get(CART_COOKIE)?.value);
    const supabase = await createClient();

    if (!cart.items.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Carrinho vazio.",
          message: "Carrinho vazio.",
        },
        { status: 400 }
      );
    }

    if (payload.shippingMethod === "DELIVERY") {
      const missingAddress =
        !payload.addressStreet ||
        !payload.addressNumber ||
        !payload.addressDistrict ||
        !payload.addressCity ||
        !payload.addressState ||
        !payload.addressZip;

      if (missingAddress) {
        return NextResponse.json(
          {
            ok: false,
            error: "Endereço incompleto para entrega.",
            message: "Endereço incompleto para entrega.",
          },
          { status: 400 }
        );
      }

      if (
        !supportsDelivery({
          city: payload.addressCity ?? "",
          method: payload.shippingMethod,
        })
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "No momento, atendemos apenas entregas em Piracema.",
            message: "No momento, atendemos apenas entregas em Piracema.",
          },
          { status: 400 }
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const shippingFee = calculateShipping({
      city: payload.addressCity ?? ATELIER_ADDRESS.city,
      district: payload.addressDistrict ?? "Outros",
      method: payload.shippingMethod as ShippingMethod,
    });

    const total = subtotal + shippingFee;

    const addressStreet =
      payload.shippingMethod === "PICKUP"
        ? "Retirada no ateliê Ju.pani"
        : payload.addressStreet ?? "";
    const addressNumber =
      payload.shippingMethod === "PICKUP" ? "-" : payload.addressNumber ?? "";
    const addressDistrict =
      payload.shippingMethod === "PICKUP"
        ? "Retirada"
        : payload.addressDistrict ?? "";
    const addressCity =
      payload.shippingMethod === "PICKUP"
        ? ATELIER_ADDRESS.city
        : payload.addressCity ?? "";
    const addressState =
      payload.shippingMethod === "PICKUP"
        ? ATELIER_ADDRESS.state
        : payload.addressState ?? "";
    const addressZip =
      payload.shippingMethod === "PICKUP"
        ? ATELIER_ADDRESS.zip
        : payload.addressZip ?? "";

    const customerPayload = {
      name: payload.customerName,
      phone: payload.customerPhone,
      whatsapp: payload.customerPhone,
      notes:
        payload.shippingMethod === "DELIVERY"
          ? formatAddress({
              street: addressStreet,
              number: addressNumber,
              district: addressDistrict,
              city: addressCity,
              state: addressState,
              zip: addressZip,
            })
          : "Retirada no ateliê",
    };

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", payload.customerPhone)
      .limit(1)
      .maybeSingle();

    let customerId = existingCustomer?.id ?? null;

    if (existingCustomer?.id) {
      await supabase.from("customers").update(customerPayload).eq("id", existingCustomer.id);
    } else {
      const { data: createdCustomer } = await supabase
        .from("customers")
        .insert(customerPayload)
        .select("id")
        .single();
      customerId = createdCustomer?.id ?? null;
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        customer_id: customerId,
        customer_name: payload.customerName,
        phone: payload.customerPhone,
        sale_type: "encomenda",
        order_type: payload.shippingMethod === "DELIVERY" ? "entrega" : "retirada",
        status: "aguardando_confirmacao",
        subtotal_amount: subtotal,
        discount_amount: 0,
        delivery_fee: shippingFee,
        total_amount: total,
        paid_amount: 0,
        pending_amount: total,
        payment_method: payload.paymentMethod,
        notes: cart.notes ?? null,
        internal_notes:
          payload.shippingMethod === "DELIVERY"
            ? `Endereço: ${formatAddress({
                street: addressStreet,
                number: addressNumber,
                district: addressDistrict,
                city: addressCity,
                state: addressState,
                zip: addressZip,
              })}${payload.addressReference ? ` | Referência: ${payload.addressReference}` : ""}`
            : "Pedido iniciado pelo site público para retirada no ateliê.",
        fiscal_status: "nao_emitido",
        external_reference: "site_publico",
      })
      .select("id")
      .single();

    if (saleError || !sale) {
      throw new Error(saleError?.message ?? "Não foi possível registrar o pedido.");
    }

    const { error: itemsError } = await supabase.from("sale_items").insert(
      cart.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: 0,
        total_price: item.unitPrice * item.quantity,
        notes: item.itemNotes ?? null,
      })),
    );

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    await supabase.from("order_status_history").insert({
      sale_id: sale.id,
      old_status: null,
      new_status: "aguardando_confirmacao",
      notes: "Pedido criado pelo site público",
    });

    const message = buildWhatsAppMessage({
      items: cart.items,
      subtotal,
      shippingFee,
      total,
      paymentMethod: payload.paymentMethod,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      address: formatAddress({
        street: addressStreet,
        number: addressNumber,
        district: addressDistrict,
        city: addressCity,
        state: addressState,
        zip: addressZip,
      }),
      addressReference: payload.addressReference ?? null,
      notes: cart.notes ?? null,
    });

    const whatsappUrl = buildWhatsAppUrl(message);

    cookieStore.set(CART_COOKIE, serializeCart(getEmptyCart()), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    revalidatePath("/dashboard");
    revalidatePath("/vendas");

    return NextResponse.json({ ok: true, orderId: sale.id, whatsappUrl });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao criar pedido.",
        message: error instanceof Error ? error.message : "Erro ao criar pedido.",
      },
      { status: 400 }
    );
  }
}
