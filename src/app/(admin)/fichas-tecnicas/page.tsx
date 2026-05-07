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
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="min-w-0">
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Produtos cadastrados</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Insumos disponíveis</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{ingredients.length}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Fichas salvas</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{recipes.length}</p>
          </CardContent>
        </Card>
      </section>
      <section className="grid items-start gap-6 2xl:grid-cols-[1.22fr_0.78fr]">
        <div className="min-w-0">
          <RecipeForm products={products} ingredients={ingredients} />
        </div>
        <Card className="min-w-0 2xl:sticky 2xl:top-28">
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-stone-600">
              Organize a receita de cima para baixo e use o botão `+` no fim de cada bloco para continuar o preenchimento sem perder o contexto.
            </div>
            <div className="rounded-2xl bg-[#fff5ef] p-4 text-sm text-stone-600">
              Embalagens foram separadas para facilitar baixa de caixas, potes e fitas sem misturar com os insumos da produção.
            </div>
            <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
              A tabela `fiscal_documents` já está prevista no banco. Quando o módulo fiscal entrar, a receita continuará servindo como base de custo sem refatoração estrutural.
            </div>
          </CardContent>
        </Card>
      </section>
      <RecipeList recipes={recipes} products={products} ingredients={ingredients} />
    </div>
  );
}
