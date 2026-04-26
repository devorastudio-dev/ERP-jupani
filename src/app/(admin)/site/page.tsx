import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ADMIN_BASE_PATH } from "@/lib/route-config";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";
import { getSiteAdminPageData } from "@/features/site-admin/server/queries";

export default async function SiteAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "site");

  const { products, settings, summary } = await getSiteAdminPageData();
  const publishedProducts = products.filter((product) => product.show_on_storefront);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site e vitrine"
        description="Gerencie o que aparece no site público, revise a comunicação da marca e acompanhe a saúde da vitrine."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Abrir site</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`${ADMIN_BASE_PATH}/configuracoes`}>Editar textos do site</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Produtos publicados</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{summary.publishedProducts}</p>
          <p className="mt-1 text-sm text-stone-500">de {summary.totalProducts} cadastrados</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Destaques da semana</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{summary.featuredProducts}</p>
          <p className="mt-1 text-sm text-stone-500">curadoria ativa na home</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Favoritos da casa</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{summary.favoriteProducts}</p>
          <p className="mt-1 text-sm text-stone-500">produtos afetivos em destaque</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Publicados indisponíveis</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{summary.unavailablePublishedProducts}</p>
          <p className="mt-1 text-sm text-stone-500">itens sem estoque ou inativos</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Comunicação do site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-[#fff8f4] p-4">
              <p className="text-sm text-stone-500">Marca exibida</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">{settings.brandName}</p>
              <p className="mt-2 text-sm text-stone-600">{settings.tagline}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">Hero da home</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{settings.heroTitle}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">{settings.heroDescription}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-100 p-4">
                <p className="text-sm font-medium text-stone-800">Contato</p>
                <p className="mt-2 text-sm text-stone-500">{settings.phoneDisplay}</p>
                <p className="text-sm text-stone-500">@{settings.instagramHandle}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 p-4">
                <p className="text-sm font-medium text-stone-800">Entrega e atendimento</p>
                <p className="mt-2 text-sm text-stone-500">{settings.businessHours}</p>
                <p className="mt-1 text-sm text-stone-500">{settings.deliveryNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Checklist da vitrine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-rose-100 p-4">
              <p className="text-sm font-medium text-stone-800">Itens ocultos do site</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">{summary.hiddenProducts}</p>
              <p className="mt-1 text-sm text-stone-500">
                Produtos cadastrados no sistema, mas ainda não publicados no cardápio.
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100 p-4">
              <p className="text-sm font-medium text-stone-800">SEO atual</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">{settings.metaDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`${ADMIN_BASE_PATH}/produtos`}>Gerenciar produtos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`${ADMIN_BASE_PATH}/vendas?origem=site`}>Ver pedidos do site</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Produtos publicados na vitrine</CardTitle>
          <p className="text-sm text-stone-500">
            A lista abaixo mostra os produtos que podem aparecer no site público com os respectivos destaques.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishedProducts.length ? (
            publishedProducts.map((product) => {
              const isUnavailable =
                !product.is_active ||
                (product.fulfillment_type === "pronta_entrega" && Number(product.finished_stock_quantity ?? 0) <= 0);

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-stone-900">{product.name}</p>
                      <Badge variant={product.is_active ? "success" : "warning"}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {product.is_storefront_featured ? <Badge>Destaque</Badge> : null}
                      {product.is_storefront_favorite ? <Badge variant="muted">Favorito</Badge> : null}
                      {product.is_storefront_healthy ? <Badge variant="success">Fitness</Badge> : null}
                      {product.is_storefront_lactose_free ? <Badge variant="success">Sem lactose</Badge> : null}
                      {product.is_storefront_gluten_free ? <Badge variant="success">Sem glúten</Badge> : null}
                      {isUnavailable ? <Badge variant="warning">Indisponível agora</Badge> : null}
                    </div>
                    <p className="text-sm text-stone-500">
                      {product.categories.length
                        ? product.categories.map((category) => category.name).join(", ")
                        : "Sem categoria"}{" "}
                      • {product.fulfillment_type.replaceAll("_", " ")}
                    </p>
                    <p className="text-sm text-stone-500">
                      {product.photo_path?.trim() ? `Imagem: ${product.photo_path}` : "Sem imagem configurada"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    <div className="text-sm text-stone-500">
                      <p className="font-medium text-stone-900">{formatCurrency(Number(product.sale_price ?? 0))}</p>
                      <p>Estoque: {Number(product.finished_stock_quantity ?? 0)}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${ADMIN_BASE_PATH}/produtos`}>Editar no catálogo</Link>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
              Nenhum produto publicado no site ainda. Marque os itens no módulo de produtos para começar a montar a vitrine.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
