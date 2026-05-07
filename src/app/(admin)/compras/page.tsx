import { ClipboardList, PackagePlus, Truck, Wallet } from "lucide-react";
import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import { PurchasesList } from "@/features/purchases/components/purchases-list";
import { getPurchasesPageData } from "@/features/purchases/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function PurchasesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "compras");

  const { purchases, suppliers, ingredients, payables, suggestedPurchases } = await getPurchasesPageData();
  const pendingPayables = payables.filter((payable) => payable.status !== "pago");
  const pendingPayablesAmount = pendingPayables.reduce(
    (sum, payable) => sum + Math.max(Number(payable.amount ?? 0) - Number(payable.paid_amount ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras"
        description="Registre compras com itens, gere contas a pagar e aprove o recebimento para refletir no estoque."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Compras registradas</p>
            <ClipboardList className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{purchases.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Reposições sugeridas</p>
            <PackagePlus className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{suggestedPurchases.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Fornecedores ativos</p>
            <Truck className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{suppliers.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Contas pendentes</p>
            <Wallet className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-stone-900">{formatCurrency(pendingPayablesAmount)}</p>
        </div>
      </section>

      <section className="grid items-start gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="min-w-0">
          <PurchaseForm suppliers={suppliers} ingredients={ingredients} />
        </div>
        <Card className="min-w-0 2xl:sticky 2xl:top-28">
          <CardHeader>
            <CardTitle>Reposição sugerida</CardTitle>
            <p className="text-sm text-stone-500">
              Apoio rápido para decidir o que comprar sem tirar o foco do lançamento principal.
            </p>
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
            <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
              {pendingPayables.length
                ? `${pendingPayables.length} conta(s) a pagar ainda exigem acompanhamento financeiro.`
                : "Nenhuma conta pendente no momento."}
            </div>
          </CardContent>
        </Card>
      </section>

      <PurchasesList purchases={purchases} payables={payables} suppliers={suppliers} ingredients={ingredients} />
    </div>
  );
}
