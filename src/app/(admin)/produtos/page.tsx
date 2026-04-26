import Link from "next/link";
import { getProductsPageData } from "@/features/products/server/queries";
import { ProductCategoriesCard } from "@/features/products/components/product-categories-card";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductStockAdjustmentCard } from "@/features/products/components/product-stock-adjustment-card";
import { ProductsTable } from "@/features/products/components/products-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "produtos");

  const resolvedSearchParams = await searchParams;
  const { products, categories, productStockMovements } = await getProductsPageData();
  const selectedCategory = resolvedSearchParams?.category ?? "all";
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category_ids?.includes(selectedCategory));
  const activeProducts = filteredProducts.filter((product) => product.is_active).length;
  const readyDeliveryProducts = filteredProducts.filter((product) => product.fulfillment_type === "pronta_entrega");
  const lowFinishedGoods = readyDeliveryProducts.filter(
    (product) => Number(product.finished_stock_quantity ?? 0) <= Number(product.minimum_finished_stock ?? 0),
  ).length;
  const averageMargin =
    filteredProducts.length > 0
      ? filteredProducts.reduce((sum, product) => {
          const salePrice = Number(product.sale_price ?? 0);
          const estimatedCost = Number(product.estimated_cost ?? 0);
          return sum + (salePrice > 0 ? ((salePrice - estimatedCost) / salePrice) * 100 : 0);
        }, 0) / filteredProducts.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Cadastre itens vendidos, acompanhe custo estimado e defina o tipo de atendimento."
        action={
          <ExportCsvButton
            filename="catalogo-produtos.csv"
            rows={filteredProducts.map((product) => ({
              id: product.id,
              nome: product.name,
              categorias: product.categories?.map((category) => category.name).join(", ") ?? "",
              tipo: product.fulfillment_type,
              unidade: product.unit,
              preco_venda: product.sale_price,
              custo_estimado: product.estimated_cost,
              margem_estimada_valor:
                Number(product.sale_price ?? 0) - Number(product.estimated_cost ?? 0),
              margem_estimada_percentual:
                Number(product.sale_price ?? 0) > 0
                  ? (
                      ((Number(product.sale_price ?? 0) - Number(product.estimated_cost ?? 0)) /
                        Number(product.sale_price ?? 0)) *
                      100
                    ).toFixed(1)
                  : "",
              descricao: product.description ?? "",
              rendimento: product.yield_quantity ?? "",
              forma: product.pan_shape_code ?? "",
              porcoes_estimadas: product.estimated_servings ?? "",
              kcal_total_estimado: product.estimated_kcal_total ?? "",
              kcal_por_porcao: product.estimated_kcal_per_serving ?? "",
              ingredientes_publicos: product.public_ingredients_text ?? "",
              estoque_acabado: product.finished_stock_quantity ?? "",
              estoque_minimo_acabado: product.minimum_finished_stock ?? "",
              ativo: product.is_active ? "sim" : "nao",
              publicado_no_site: product.show_on_storefront ? "sim" : "nao",
              destaque_site: product.is_storefront_featured ? "sim" : "nao",
              favorito_site: product.is_storefront_favorite ? "sim" : "nao",
              fitness_site: product.is_storefront_healthy ? "sim" : "nao",
              imagem: product.photo_path ?? "",
              observacoes: product.notes ?? "",
            }))}
          />
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Produtos ativos</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{activeProducts}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Pronta-entrega em atenção</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{lowFinishedGoods}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Margem média estimada</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{averageMargin.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-stone-500">
            Baseada em venda e custo estimado do catálogo.
          </p>
        </div>
      </section>
      <section className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm categories={categories} />
            </CardContent>
          </Card>
          <ProductStockAdjustmentCard products={products} movements={productStockMovements} />
          <ProductCategoriesCard categories={categories} />
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
            <p className="text-sm text-stone-500">
              Itens pronta-entrega exibem saldo acabado e ajudam a separar produção para estoque de produção sob demanda.
            </p>
            <form method="GET" className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <label htmlFor="category-filter" className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Filtrar por categoria
                </label>
                <select
                  id="category-filter"
                  name="category"
                  defaultValue={selectedCategory}
                  className="flex h-10 min-w-[240px] rounded-xl border border-rose-100 bg-white px-3 text-sm"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline">Aplicar</Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/produtos">Limpar</Link>
                </Button>
              </div>
            </form>
          </CardHeader>
          <CardContent>
            <ProductsTable products={filteredProducts} categories={categories} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
