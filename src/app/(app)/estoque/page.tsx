import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getInventoryPageData } from "@/features/inventory/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function InventoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "estoque");

  const { movements, ingredients } = await getInventoryPageData();

  return (
    <div className="space-y-6">
      <PageHeader title="Inventário e movimentações" description="Consolide entradas, saídas, ajustes, perdas e desperdícios em um histórico auditável." />
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-4">
                <div>
                  <p className="font-medium text-stone-800">{ingredient.name}</p>
                  <p className="text-sm text-stone-500">
                    {ingredient.stock_quantity} {ingredient.unit} disponíveis
                  </p>
                </div>
                <Badge variant={Number(ingredient.stock_quantity) <= Number(ingredient.minimum_stock) ? "warning" : "success"}>
                  Min. {ingredient.minimum_stock}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={movements}
              searchPlaceholder="Buscar movimentação"
              columns={[
                { accessorKey: "ingredient_name", header: "Insumo" },
                { accessorKey: "movement_type", header: "Tipo" },
                { accessorKey: "quantity", header: "Quantidade" },
                { accessorKey: "reason", header: "Motivo" },
                {
                  accessorKey: "created_at",
                  header: "Data",
                  cell: ({ row }) => formatDate(String(row.original.created_at), "DD/MM/YYYY HH:mm"),
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
