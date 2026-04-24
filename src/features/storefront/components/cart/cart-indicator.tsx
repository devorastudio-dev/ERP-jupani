"use client";

import { useCart } from "@/features/storefront/components/cart/cart-provider";

export const CartIndicator = () => {
  const { cart } = useCart();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!count) {
    return null;
  }

  return (
    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#d37d64] text-xs font-semibold text-white">
      {count}
    </span>
  );
};
