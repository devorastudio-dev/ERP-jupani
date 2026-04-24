import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/features/storefront/lib/format";
import type { ProductCardData } from "@/features/storefront/lib/types";
import { getCategoryLabel } from "@/features/storefront/lib/categories";
import { Badge } from "@/features/storefront/components/ui/badge";
import { AddToCartButton } from "@/features/storefront/components/cart/add-to-cart-button";

type ProductCardProps = {
  product: ProductCardData;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const image = product.images[0];
  const isDataImage = image.startsWith("data:");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition hover:-translate-y-1">
      <Link href={`/produto/${product.slug}`} className="relative block h-44">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={isDataImage}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{getCategoryLabel(product.category)}</Badge>
          {product.availableForOrder && <Badge variant="featured">Disponível</Badge>}
        </div>
        <div className="space-y-2">
          <Link href={`/produto/${product.slug}`}>
            <h3 className="text-lg font-semibold text-[#3a231c] transition hover:text-[#d37d64]">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-[#7b3b30]">{product.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-semibold text-[#3a231c]">
            {formatCurrency(product.price)}
          </span>
          <AddToCartButton
            product={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              image,
              unitPrice: product.price,
            }}
            disabled={!product.availableForOrder}
          />
        </div>
      </div>
    </div>
  );
};
