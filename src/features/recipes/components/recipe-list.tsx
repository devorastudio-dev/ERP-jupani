import { RecipeFormDialog } from "@/features/recipes/components/recipe-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { IngredientRow, ProductRow, RecipeRow } from "@/types/entities";

export function RecipeList({
  recipes,
  products,
  ingredients,
}: {
  recipes: RecipeRow[];
  products: ProductRow[];
  ingredients: IngredientRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas cadastradas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipes.length ? (
          recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-2xl border border-rose-100 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-medium text-stone-900">{recipe.product_name}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Custo total teórico: {formatCurrency(Number(recipe.theoretical_cost ?? 0))}
                  </p>
                  {recipe.notes ? <p className="mt-2 text-sm text-stone-500">{recipe.notes}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">
                    Embalagem {formatCurrency(Number(recipe.packaging_cost ?? 0))}
                  </Badge>
                  <Badge variant="default">
                    Adicional {formatCurrency(Number(recipe.additional_cost ?? 0))}
                  </Badge>
                  <RecipeFormDialog recipe={recipe} products={products} ingredients={ingredients} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {recipe.recipe_items?.length ? (
                  recipe.recipe_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {item.ingredients?.name ?? "Insumo"}
                        </p>
                        <p className="text-xs text-stone-500">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-stone-800">
                        {formatCurrency(Number(item.calculated_cost ?? 0))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
                    Essa ficha técnica ainda não possui insumos vinculados.
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
            Nenhuma ficha técnica cadastrada ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
