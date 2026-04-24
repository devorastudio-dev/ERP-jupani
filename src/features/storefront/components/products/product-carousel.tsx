import type { ProductCardData } from "@/features/storefront/lib/types";
import { ProductCard } from "@/features/storefront/components/products/product-card";

type ProductCarouselProps = {
  products: ProductCardData[];
};

export const ProductCarousel = ({ products }: ProductCarouselProps) => {
  return (
    <div className="relative">
      <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[260px] snap-start md:min-w-[320px]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
