import { getIngredientsPageData } from "@/features/ingredients/server/queries";
import { IngredientCategoriesCard } from "@/features/ingredients/components/ingredient-categories-card";
import { IngredientForm } from "@/features/ingredients/components/ingredient-form";
import { IngredientsTable } from "@/features/ingredients/components/ingredients-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <PageHeader title="Insumos e estoque" description="Controle entrada inicial, estoque mínimo, custo médio e histórico básico de movimentações." />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Estoque de insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <IngredientsTable ingredients={ingredients} categories={categories} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
