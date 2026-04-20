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

  const { purchases, suppliers, ingredients, payables } = await getPurchasesPageData();

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
            <CardTitle>Fornecedores cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suppliers.length ? (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-2xl bg-[#fff8f4] p-4">
                  <p className="font-medium text-stone-800">{supplier.name}</p>
                  <p className="text-sm text-stone-500">{formatPhone(supplier.phone)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                Nenhum fornecedor cadastrado.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <PurchasesList purchases={purchases} payables={payables} />
    </div>
  );
}
