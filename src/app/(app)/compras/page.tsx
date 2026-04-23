import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import { PurchasesList } from "@/features/purchases/components/purchases-list";
import { getPurchasesPageData } from "@/features/purchases/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhone } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function PurchasesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "compras");

  const { purchases, suppliers, ingredients, payables, suggestedPurchases } = await getPurchasesPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras"
        description="Registre compras com itens, gere contas a pagar e aprove o recebimento para refletir no estoque."
      />

      <section className="grid gap-6 2xl:grid-cols-[1.02fr_0.78fr]">
        <PurchaseForm suppliers={suppliers} ingredients={ingredients} />
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Reposição sugerida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedPurchases.length ? (
              suggestedPurchases.slice(0, 8).map((ingredient) => (
                <div key={ingredient.id} className="rounded-2xl bg-[#fff8f4] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-800">{ingredient.name}</p>
                      <p className="text-sm text-stone-500">
                        Atual {Number(ingredient.stock_quantity ?? 0).toFixed(3)} • Mínimo {Number(ingredient.minimum_stock ?? 0).toFixed(3)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">{Number((ingredient as typeof ingredient & { suggested_quantity: number }).suggested_quantity).toFixed(3)} {ingredient.unit}</p>
                      <p className="text-xs text-stone-500">
                        Custo aprox. {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number((ingredient as typeof ingredient & { projected_cost: number }).projected_cost))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : suppliers.length ? (
              suppliers.slice(0, 6).map((supplier) => (
                <div key={supplier.id} className="rounded-2xl bg-[#fff8f4] p-4">
                  <p className="font-medium text-stone-800">{supplier.name}</p>
                  <p className="text-sm text-stone-500">{formatPhone(supplier.phone)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhuma sugestão de reposição no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <PurchasesList purchases={purchases} payables={payables} suppliers={suppliers} ingredients={ingredients} />
    </div>
  );
}
