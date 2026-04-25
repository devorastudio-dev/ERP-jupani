import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { ProductCard } from "@/features/storefront/components/products/product-card";
import { ProductCarousel } from "@/features/storefront/components/products/product-carousel";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { LinkButton } from "@/features/storefront/components/ui/link-button";
import { getFavoriteProducts, getFeaturedProducts, getHealthyProducts, getProducts } from "@/features/storefront/lib/products";
import { getStorefrontSettings } from "@/features/storefront/server/settings";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Bolos, doces e tortas artesanais. Confira os destaques da semana e finalize seu pedido no WhatsApp.",
  openGraph: {
    title: "Ju.pani | Confeitaria artesanal",
    description:
      "Bolos, doces e tortas artesanais. Confira os destaques da semana e finalize seu pedido no WhatsApp.",
    url: "/",
  },
};

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const [featured, favorites, healthy, latest, settings] = await Promise.all([
    getFeaturedProducts(),
    getFavoriteProducts(),
    getHealthyProducts(),
    getProducts({ pageSize: 6 }),
    getStorefrontSettings(),
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
              {settings.heroTitle}
            </h1>
            <p className="text-base text-[#7b3b30]">
              {settings.heroDescription}
            </p>
            <div className="inline-flex w-fit items-center rounded-full border border-[#f1d0c7] bg-white/90 px-4 py-2 text-sm font-semibold text-[#7b3b30] shadow-soft">
              Entregas em {settings.deliveryCity}
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/cardapio" variant="primary">
                Fazer pedido
              </LinkButton>
              <LinkButton href="/sobre" variant="secondary">
                Conhecer história
              </LinkButton>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[#f1d0c7] bg-white px-5 py-2 text-sm font-semibold text-[#7b3b30] transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
              >
                Ver Instagram
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Receitas autorais", value: "15+" },
                { label: "Pedidos mensais", value: "25+" },
                { label: "Avaliações 5★", value: "98%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-soft"
                >
                  <p className="text-lg font-semibold text-[#3a231c]">
                    {item.value}
                  </p>
                  <p className="text-xs text-[#7b3b30]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-fade-in">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-dashed border-[#f0bfae]" />
            <div className="rounded-[48px] bg-white p-4 shadow-soft">
              <Image
                src="/images/hero.png"
                alt="Mesa de doces Ju.pani"
                width={520}
                height={520}
                priority
                className="h-auto w-full rounded-[40px]"
              />
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Destaques da semana"
            subtitle="Seleção especial com os sabores mais pedidos."
          />
          <ProductCarousel products={featured} />
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Favoritos da casa"
            subtitle="Receitas queridinhas que fazem sucesso em toda comemoração."
          />
          <ProductCarousel products={favorites} />
        </Container>
      </section>

      {healthy.length ? (
        <section>
          <Container>
            <div className="overflow-hidden rounded-[40px] border border-[#d9ead9] bg-[linear-gradient(135deg,#f4fbf2_0%,#eef8ea_52%,#f9fdf7_100%)] p-6 shadow-soft md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeader
                  title="Doces fitness"
                  subtitle="Nosso diferencial em destaque: opções mais equilibradas para quem quer leveza sem abrir mão do sabor."
                  className="[&>p:first-child]:text-[#67a26a] [&>h2]:text-[#245235] [&>p:last-child]:text-[#4f6b54]"
                />
                <div className="inline-flex w-fit items-center rounded-full border border-[#cfe4cf] bg-white/80 px-4 py-2 text-sm font-semibold text-[#356243] shadow-sm">
                  Receitas mais leves, sem perder a graça
                </div>
              </div>
              <div className="mt-6">
                <ProductCarousel products={healthy} />
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Para começar agora"
            subtitle="Monte seu carrinho com doces artesanais prontos para encantar."
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
