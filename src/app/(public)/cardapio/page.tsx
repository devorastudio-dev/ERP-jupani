import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/features/storefront/components/layout/container";
import { ProductCard } from "@/features/storefront/components/products/product-card";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { Button } from "@/features/storefront/components/ui/button";
import { Input } from "@/features/storefront/components/ui/input";
import { Pagination } from "@/features/storefront/components/ui/pagination";
import { getProducts } from "@/features/storefront/lib/products";
import type { ProductCardData } from "@/features/storefront/lib/types";
import { getStorefrontCategories } from "@/features/storefront/server/queries";

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Explore o cardápio Ju.pani com dados reais do sistema administrativo.",
  openGraph: {
    title: "Cardápio",
    description: "Explore o cardápio Ju.pani com dados reais do sistema administrativo.",
    url: "/cardapio",
  },
};

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const getParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;
  const isTruthy = (value?: string | string[]) => {
    const parsed = getParam(value);
    return parsed === "1" || parsed === "true" || parsed === "on";
  };

  const page = Math.max(1, Number(getParam(resolvedParams.page) ?? 1) || 1);
  const query = getParam(resolvedParams.q) ?? "";
  const category = getParam(resolvedParams.category) ?? "all";
  const featured = isTruthy(resolvedParams.featured);
  const favorite = isTruthy(resolvedParams.favorite);
  const categories = await getStorefrontCategories();

  const { items, totalPages, total } = (await getProducts({
    page,
    query,
    category,
    featured,
    favorite,
  })) as {
    items: ProductCardData[];
    total: number;
    totalPages: number;
  };

  return (
    <div className="space-y-12 pb-20 pt-10">
      <Container className="space-y-6">
        <SectionHeader
          title="Catálogo Ju.pani"
          subtitle={`Mais de ${total} receitas disponíveis para encomenda.`}
        />
        <form
          method="GET"
          className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end"
        >
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Busca
            </label>
            <Input
              name="q"
              defaultValue={query}
              placeholder="Ex: red velvet, torta, brigadeiro"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Categoria
            </label>
            <select
              name="category"
              defaultValue={category}
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#3a231c] shadow-sm focus:border-[#d59a73] focus:outline-none"
            >
              <option value="all">Todas</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#7b3b30]">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" value="1" defaultChecked={featured} />
              Destaques
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="favorite" value="1" defaultChecked={favorite} />
              Favoritos
            </label>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button type="submit">Filtrar</Button>
            <Link
              href="/cardapio"
              className="rounded-full border border-[#f1d0c7] px-4 py-2 text-sm font-semibold text-[#7b3b30] transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
            >
              Limpar
            </Link>
          </div>
        </form>
      </Container>

      <Container>
        {items.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
            <p className="text-lg font-semibold text-[#3a231c]">
              Nenhum produto encontrado.
            </p>
            <p className="mt-2 text-sm text-[#7b3b30]">
              Ajuste os filtros ou tente outra busca.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((product: ProductCardData) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/cardapio"
          query={{
            q: query || undefined,
            category: category === "all" ? undefined : category,
            featured: featured ? 1 : undefined,
            favorite: favorite ? 1 : undefined,
          }}
        />
      </Container>
    </div>
  );
}
