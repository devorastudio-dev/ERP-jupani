"use client";

import { useState } from "react";
import { AddToCartButton } from "@/features/storefront/components/cart/add-to-cart-button";
import { QuantityStepper } from "@/features/storefront/components/cart/quantity-stepper";
import { Textarea } from "@/features/storefront/components/ui/textarea";

type ProductDetailActionsProps = {
  productId: string;
  name: string;
  slug: string;
  image?: string | null;
  unitPrice: number;
  disabled?: boolean;
};

export const ProductDetailActions = ({
  productId,
  name,
  slug,
  image,
  unitPrice,
  disabled = false,
}: ProductDetailActionsProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <span className="text-sm text-[#7b3b30]">
          Quantidade mínima: 1
        </span>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#7b3b30]">
          Observações do item
        </label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex: sem açúcar, com menos chocolate."
          className="mt-2"
        />
      </div>
      <AddToCartButton
        product={{ productId, name, slug, image, unitPrice }}
        quantity={quantity}
        itemNotes={notes}
        disabled={disabled}
      />
    </div>
  );
};
