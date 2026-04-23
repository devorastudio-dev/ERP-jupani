import { getProductsPageData } from "@/features/products/server/queries";
import { ProductCategoriesCard } from "@/features/products/components/product-categories-card";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductStockAdjustmentCard } from "@/features/products/components/product-stock-adjustment-card";
import { ProductsTable } from "@/features/products/components/products-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function ProductsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "produtos");

  const { products, categories, productStockMovements } = await getProductsPageData();
  const activeProducts = products.filter((product) => product.is_active).length;
  const readyDeliveryProducts = products.filter((product) => product.fulfillment_type === "pronta_entrega");
  const lowFinishedGoods = readyDeliveryProducts.filter(
    (product) => Number(product.finished_stock_quantity ?? 0) <= Number(product.minimum_finished_stock ?? 0),
  ).length;
  const averageMargin =
    products.length > 0
      ? products.reduce((sum, product) => {
          const salePrice = Number(product.sale_price ?? 0);
          const estimatedCost = Number(product.estimated_cost ?? 0);
          return sum + (salePrice > 0 ? ((salePrice - estimatedCost) / salePrice) * 100 : 0);
        }, 0) / products.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Cadastre itens vendidos, acompanhe custo estimado e defina o tipo de atendimento."
        action={
          <ExportCsvButton
            filename="catalogo-produtos.csv"
            rows={products.map((product) => ({
              nome: product.name,
              categoria: product.categories?.name ?? "",
              tipo: product.fulfillment_type,
              preco_venda: product.sale_price,
              custo_estimado: product.estimated_cost,
              estoque_acabado: product.finished_stock_quantity ?? "",
              estoque_minimo_acabado: product.minimum_finished_stock ?? "",
              ativo: product.is_active ? "sim" : "nao",
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
          </CardHeader>
          <CardContent>
            <ProductsTable products={products} categories={categories} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
