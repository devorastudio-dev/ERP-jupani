import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { ProductCard } from "@/features/storefront/components/products/product-card";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { LinkButton } from "@/features/storefront/components/ui/link-button";
import {
  getGlutenFreeProducts,
  getHealthyProducts,
  getLactoseFreeProducts,
} from "@/features/storefront/lib/products";
import { getStorefrontSettings } from "@/features/storefront/server/settings";

export const metadata: Metadata = {
  title: "Linha saudável",
  description:
    "Explore opções fitness, sem lactose e sem glúten da Ju.pani em uma vitrine leve e acolhedora.",
  openGraph: {
    title: "Ju.pani | Linha saudável",
    description:
      "Explore opções fitness, sem lactose e sem glúten da Ju.pani em uma vitrine leve e acolhedora.",
    url: "/saudavel",
  },
};

export const dynamic = "force-dynamic";

const emptyState = (
  <div className="rounded-[32px] border border-dashed border-[#cfe4cf] bg-white/75 p-8 text-center text-sm text-[#4f6b54]">
    Nenhum item disponível nesta seleção no momento.
  </div>
);

export default async function HealthyPage() {
  const [healthy, lactoseFree, glutenFree, settings] = await Promise.all([
    getHealthyProducts(),
    getLactoseFreeProducts(),
    getGlutenFreeProducts(),
    getStorefrontSettings(),
  ]);

  const totalUnique = new Set([...healthy, ...lactoseFree, ...glutenFree].map((product) => product.id)).size;

  return (
    <div className="space-y-14 pb-20 pt-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,#dff3df_0%,rgba(223,243,223,0)_55%)]" />
        <div className="absolute right-0 top-10 h-48 w-48 rounded-full bg-[#edf7da] blur-3xl" />
        <div className="absolute left-0 top-24 h-40 w-40 rounded-full bg-[#dff0e7] blur-3xl" />
        <Container className="relative">
          <div className="overflow-hidden rounded-[40px] border border-[#d8ead8] bg-[linear-gradient(145deg,#fbfef8_0%,#f2f8ed_48%,#edf6ef_100%)] p-8 shadow-soft md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#67a26a]">
                  Linha saudável Ju.pani
                </p>
                <h1 className="font-display text-4xl leading-tight text-[#244a33] md:text-5xl">
                  Escolhas leves, limpas e pensadas para diferentes rotinas.
                </h1>
                <p className="max-w-2xl text-base text-[#4f6b54]">
                  Reunimos aqui nossas opções fitness, sem lactose e sem glúten para facilitar sua busca por doces
                  mais alinhados ao seu estilo de vida, sempre com o cuidado artesanal da {settings.brandName}.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-[#cfe4cf] bg-white/85 px-4 py-2 text-sm font-semibold text-[#356243]">
                    {totalUnique} opç{totalUnique === 1 ? "ão" : "ões"} selecionadas
                  </span>
                  <span className="rounded-full border border-[#d8e7c3] bg-white/85 px-4 py-2 text-sm font-semibold text-[#66773d]">
                    Entregas em {settings.deliveryCity}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { label: "Fitness", value: healthy.length, tone: "bg-[#dff3df] text-[#245c33]" },
                  { label: "Sem lactose", value: lactoseFree.length, tone: "bg-[#eef7dd] text-[#476128]" },
                  { label: "Sem glúten", value: glutenFree.length, tone: "bg-[#e3f3ec] text-[#1d5b4a]" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-[28px] px-5 py-4 shadow-sm ${item.tone}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              title="Doces fitness"
              subtitle="Receitas mais equilibradas para quem busca leveza sem abrir mão do sabor."
              className="[&>p:first-child]:text-[#67a26a] [&>h2]:text-[#245235] [&>p:last-child]:text-[#4f6b54]"
            />
            <LinkButton href="/cardapio" variant="secondary">
              Ver cardápio completo
            </LinkButton>
          </div>
          {healthy.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {healthy.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            emptyState
          )}
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Sem lactose"
            subtitle="Opções pensadas para quem prefere evitar lactose no dia a dia."
            className="[&>p:first-child]:text-[#7c8f43] [&>h2]:text-[#47541f] [&>p:last-child]:text-[#637146]"
          />
          {lactoseFree.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lactoseFree.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            emptyState
          )}
        </Container>
      </section>

      <section>
        <Container className="space-y-6">
          <SectionHeader
            title="Sem glúten"
            subtitle="Seleção especial para uma experiência mais leve e consciente."
            className="[&>p:first-child]:text-[#4f8b71] [&>h2]:text-[#1d5b4a] [&>p:last-child]:text-[#4f6b60]"
          />
          {glutenFree.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {glutenFree.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            emptyState
          )}
        </Container>
      </section>
    </div>
  );
}
