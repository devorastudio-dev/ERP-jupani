import { getProductsPageData } from "@/features/products/server/queries";
import { ProductCategoriesCard } from "@/features/products/components/product-categories-card";
import { ProductForm } from "@/features/products/components/product-form";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
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
            <DataTable
              data={products}
              searchPlaceholder="Buscar produto"
              columns={[
                { accessorKey: "name", header: "Produto" },
                {
                  accessorKey: "sale_price",
                  header: "Venda",
                  cell: ({ row }) => formatCurrency(Number(row.original.sale_price ?? 0)),
                },
                {
                  accessorKey: "estimated_cost",
                  header: "Custo",
                  cell: ({ row }) => formatCurrency(Number(row.original.estimated_cost ?? 0)),
                },
                {
                  accessorKey: "fulfillment_type",
                  header: "Tipo",
                  cell: ({ row }) => (
                    <Badge variant={row.original.fulfillment_type === "pronta_entrega" ? "success" : "default"}>
                      {row.original.fulfillment_type === "pronta_entrega" ? "Pronta entrega" : "Sob encomenda"}
                    </Badge>
                  ),
                },
                {
                  accessorKey: "categories",
                  header: "Categoria",
                  cell: ({ row }) => row.original.categories?.name ?? "-",
                },
                {
                  accessorKey: "is_active",
                  header: "Status",
                  cell: ({ row }) => (
                    <Badge variant={row.original.is_active ? "success" : "muted"}>
                      {row.original.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
