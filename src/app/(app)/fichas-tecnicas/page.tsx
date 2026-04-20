import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { getRecipesPageData } from "@/features/recipes/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function RecipesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "receitas");

  const { recipes, products, ingredients } = await getRecipesPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fichas técnicas"
        description="Base de custo teórico por produto, pronta para automatizar baixa de estoque e recalcular preço."
      />
      <section className="grid gap-6 2xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-sm text-stone-500">Produtos cadastrados</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{products.length}</p>
            </div>
            <div className="rounded-2xl bg-[#fff5ef] p-4">
              <p className="text-sm text-stone-500">Insumos disponíveis</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{ingredients.length}</p>
            </div>
            <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
              A tabela `fiscal_documents` já está prevista no banco. Quando o módulo fiscal entrar, a receita continuará servindo como base de custo sem refatoração estrutural.
            </div>
          </CardContent>
        </Card>
        <RecipeForm products={products} ingredients={ingredients} />
      </section>
      <RecipeList recipes={recipes} />
    </div>
  );
}
