import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/features/storefront/components/layout/container";
import { ProductDetailActions } from "@/features/storefront/components/products/product-detail-actions";
import { Badge } from "@/features/storefront/components/ui/badge";
import { getCategoryLabel } from "@/features/storefront/lib/categories";
import { formatCurrency } from "@/features/storefront/lib/format";
import { getProductBySlug } from "@/features/storefront/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  if (!product) {
    return { title: "Produto não encontrado" };
  }
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
      url: `/produto/${product.slug}`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const image = product.images[0];
  const isUnoptimizedImage = image.startsWith("data:") || image.startsWith("http");

  return (
    <div className="pb-20 pt-10">
      <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="rounded-[40px] bg-white p-4 shadow-soft">
          <Image
            src={image}
            alt={product.name}
            width={640}
            height={640}
            className="h-auto w-full rounded-[32px]"
            unoptimized={isUnoptimizedImage}
          />
        </div>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{getCategoryLabel(product.category)}</Badge>
            {product.availableForOrder && <Badge variant="featured">Disponível</Badge>}
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl text-[#3a231c] md:text-4xl">
              {product.name}
            </h1>
            <p className="text-base text-[#7b3b30]">{product.description}</p>
            <p className="text-lg font-semibold text-[#3a231c]">
              {formatCurrency(product.price)}
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl bg-white p-5 shadow-soft">
            <div className="grid gap-2 text-sm text-[#7b3b30]">
              <p>
                <strong className="text-[#3a231c]">Ingredientes:</strong>{" "}
                {product.notes || "Consulte disponibilidade."}
              </p>
              <p>
                <strong className="text-[#3a231c]">Calorias:</strong> A definir kcal
              </p>
              <p>
                <strong className="text-[#3a231c]">Tempo de preparo:</strong>{" "}
                {product.fulfillmentType === "pronta_entrega" ? "Pronto para entrega" : "Sob encomenda"}
              </p>
              <p>
                <strong className="text-[#3a231c]">Rendimento:</strong> {product.unit}
              </p>
              <p>
                <strong className="text-[#3a231c]">Variações:</strong> Consulte disponibilidade.
              </p>
            </div>
          </div>
          <ProductDetailActions
            productId={product.id}
            name={product.name}
            slug={product.slug}
            image={image}
            unitPrice={product.price}
            disabled={!product.availableForOrder}
          />
        </div>
      </Container>
    </div>
  );
}
