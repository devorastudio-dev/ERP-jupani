import { getProductsPageData } from "@/features/products/server/queries";
import { ProductCategoriesCard } from "@/features/products/components/product-categories-card";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductsTable } from "@/features/products/components/products-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function ProductsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "produtos");

  const { products, categories } = await getProductsPageData();

  return (
    <div className="space-y-6">
      <PageHeader title="Produtos" description="Cadastre itens vendidos, acompanhe custo estimado e defina o tipo de atendimento." />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm categories={categories} />
            </CardContent>
          </Card>
          <ProductCategoriesCard categories={categories} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsTable products={products} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
