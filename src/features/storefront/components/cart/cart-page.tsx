"use client";

import Image from "next/image";
import { useCart } from "@/features/storefront/components/cart/cart-provider";
import { QuantityStepper } from "@/features/storefront/components/cart/quantity-stepper";
import { LinkButton } from "@/features/storefront/components/ui/link-button";
import { Textarea } from "@/features/storefront/components/ui/textarea";
import { formatCurrency } from "@/features/storefront/lib/format";

export const CartPage = () => {
  const { cart, loading, error, updateItem, removeItem, setNotes } = useCart();

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ??
    0;
  const itemsWithImages =
    cart?.items.map((item) => ({
      ...item,
      resolvedImage:
        item.image ??
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><rect width='240' height='240' rx='24' fill='%23f7ddd1'/><text x='28' y='128' font-size='24' font-family='Arial' fill='%233a231c'>Ju.pani</text></svg>",
    })) ?? [];

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <p className="text-sm text-[#7b3b30]">Carregando seu carrinho...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
        <p className="text-lg font-semibold text-[#3a231c]">
          Seu carrinho está vazio.
        </p>
        <p className="mt-2 text-sm text-[#7b3b30]">
          Escolha seus favoritos no catálogo.
        </p>
        <LinkButton href="/cardapio" className="mt-6">
          Explorar catálogo
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-6">
        {itemsWithImages.map((item) => (
          <div
            key={item.productId}
            className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl">
                <Image
                  src={item.resolvedImage}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={item.resolvedImage.startsWith("data:")}
                />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#3a231c]">
                  {item.name}
                </p>
                <p className="text-sm text-[#7b3b30]">
                  {formatCurrency(item.unitPrice)}
                </p>
                {item.itemNotes && (
                  <p className="text-xs text-[#7b3b30]">
                    Obs: {item.itemNotes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <QuantityStepper
                value={item.quantity}
                onChange={(value) =>
                  void updateItem({
                    productId: item.productId,
                    quantity: value,
                  })
                }
              />
              <button
                type="button"
                className="text-xs font-semibold text-[#d37d64] hover:text-[#a34e3b]"
                onClick={() => void removeItem(item.productId)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <div className="rounded-3xl bg-white p-5 shadow-soft">
          <label className="text-sm font-semibold text-[#3a231c]">
            Observações gerais do pedido
          </label>
          <Textarea
            rows={3}
            value={cart.notes ?? ""}
            onChange={(event) => {
              void setNotes(event.target.value);
            }}
            placeholder="Ex: entregar após 16h, caprichar na calda."
            className="mt-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="h-fit rounded-3xl bg-white p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d59a73]">
          Resumo
        </p>
        <div className="mt-4 space-y-2 text-sm text-[#3a231c]">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#7b3b30]">
            <span>Frete leve para Piracema, calculado no checkout</span>
          </div>
        </div>
        <LinkButton href="/checkout" className="mt-6 w-full">
          Ir para checkout
        </LinkButton>
      </div>
    </div>
  );
};
