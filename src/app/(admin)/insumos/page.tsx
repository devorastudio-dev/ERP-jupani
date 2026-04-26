import { getIngredientsPageData } from "@/features/ingredients/server/queries";
import { IngredientCategoriesCard } from "@/features/ingredients/components/ingredient-categories-card";
import { IngredientForm } from "@/features/ingredients/components/ingredient-form";
import { IngredientsTable } from "@/features/ingredients/components/ingredients-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function IngredientsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "insumos");

  const { ingredients, categories, movements } = await getIngredientsPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insumos e estoque"
        description="Controle entrada inicial, estoque mínimo, custo médio e histórico básico de movimentações."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton
              filename="insumos.csv"
              rows={ingredients.map((ingredient) => ({
                nome: ingredient.name,
                categoria: ingredient.categories?.name ?? "",
                unidade: ingredient.unit,
                estoque_atual: ingredient.stock_quantity ?? 0,
                estoque_minimo: ingredient.minimum_stock ?? 0,
                custo_medio: formatCurrency(Number(ingredient.average_cost ?? 0)),
                valor_estimado_estoque: formatCurrency(Number(ingredient.stock_quantity ?? 0) * Number(ingredient.average_cost ?? 0)),
                vencimento: formatDate(ingredient.expiration_date),
                observacoes: ingredient.notes ?? "",
              }))}
            />
            <ExportCsvButton
              filename="movimentacoes-insumos.csv"
              rows={movements.map((movement) => ({
                insumo: movement.ingredient_name ?? "",
                tipo_movimentacao: movement.movement_type,
                quantidade: movement.quantity ?? 0,
                data: formatDate(movement.created_at, "DD/MM/YYYY HH:mm"),
              }))}
              label="Exportar movimentações"
            />
          </div>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[1_fr_1.5_fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo insumo</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientForm categories={categories} />
            </CardContent>
          </Card>
          <IngredientCategoriesCard categories={categories} />
          
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Estoque de insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <IngredientsTable ingredients={ingredients} categories={categories} />
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle>Movimentações recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="rounded-2xl bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-stone-800">{movement.ingredient_name}</p>
                    <Badge>{movement.movement_type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {movement.quantity} em {formatDate(movement.created_at, "DD/MM/YYYY HH:mm")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
      </section>
    </div>
  );
}
