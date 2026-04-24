import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { ProductCard } from "@/features/storefront/components/products/product-card";
import { ProductCarousel } from "@/features/storefront/components/products/product-carousel";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { LinkButton } from "@/features/storefront/components/ui/link-button";
import { ATELIER_ADDRESS, CONTACT_INSTAGRAM_URL } from "@/features/storefront/lib/contact";
import { getFavoriteProducts, getFeaturedProducts, getProducts } from "@/features/storefront/lib/products";
import { getStorefrontSummary } from "@/features/storefront/server/queries";

export const metadata: Metadata = {
  title: "Home",
  description: "Confeitaria artesanal com cardápio conectado ao sistema de gestão da Ju.pani.",
};

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const [featured, favorites, latest, summary] = await Promise.all([
    getFeaturedProducts(),
    getFavoriteProducts(),
    getProducts({ pageSize: 6 }),
    getStorefrontSummary(),
  ]);

  return (
    <div className="space-y-20 pb-20">
      <section className="relative overflow-hidden pt-10">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-[#f5c2b0] opacity-40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-[#f7e0d6] opacity-70 blur-3xl" />
        <Container className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#d59a73]">
              Confeitaria artesanal
            </p>
            <h1 className="font-display text-4xl leading-tight text-[#3a231c] md:text-5xl">
              Doces com memória afetiva, agora integrados ao mesmo sistema da operação.
            </h1>
            <p className="text-base text-[#7b3b30]">
              O cardápio público da Ju.pani já usa os mesmos produtos, preços e disponibilidades
              cadastrados no painel administrativo.
            </p>
            <div className="inline-flex w-fit items-center rounded-full border border-[#f1d0c7] bg-white/90 px-4 py-2 text-sm font-semibold text-[#7b3b30] shadow-soft">
              Entregas e retiradas em {ATELIER_ADDRESS.city}
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/cardapio" variant="primary">
                Ver cardápio
              </LinkButton>
              <LinkButton href="/checkout" variant="secondary">
                Finalizar pedido
              </LinkButton>
              <a
                href={CONTACT_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[#f1d0c7] bg-white px-5 py-2 text-sm font-semibold text-[#7b3b30] transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
              >
                Ver Instagram
              </a>
            </div>
          </div>
          <div className="animate-fade-in">
            <div className="rounded-[40px] bg-white p-6 shadow-soft">
              <div className="rounded-[32px] bg-[radial-gradient(circle_at_top,_#fffaf6_0%,_#f4d5c8_42%,_#e9b8a4_100%)] p-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-white/85 px-5 py-6 text-center">
                    <p className="text-3xl font-semibold text-[#3a231c]">{summary.productsCount}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#7b3b30]">Produtos ativos</p>
                  </div>
                  <div className="rounded-3xl bg-white/85 px-5 py-6 text-center">
                    <p className="text-3xl font-semibold text-[#3a231c]">{summary.categoriesCount}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#7b3b30]">Categorias</p>
                  </div>
                  <div className="rounded-3xl bg-white/85 px-5 py-6 text-center">
                    <p className="text-3xl font-semibold text-[#3a231c]">{summary.prontaEntregaCount}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#7b3b30]">Pronta entrega</p>
                  </div>
                </div>
                <div className="mt-6 rounded-3xl border border-white/60 bg-white/70 p-5 text-sm text-[#7b3b30]">
                  Produtos publicados no admin aparecem automaticamente aqui, sem cadastro duplicado.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Pronta entrega"
            subtitle="Itens com destaque para atendimento mais imediato."
          />
          <ProductCarousel products={featured} />
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Seleção da casa"
            subtitle="Receitas ativas do cardápio atual da Ju.pani."
          />
          <ProductCarousel products={favorites} />
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Últimos publicados"
            subtitle="O que foi atualizado recentemente no painel também aparece aqui."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
