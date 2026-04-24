import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryAdjustmentForm } from "@/features/inventory/components/inventory-adjustment-form";
import { InventoryBatchCountForm } from "@/features/inventory/components/inventory-batch-count-form";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getInventoryPageData } from "@/features/inventory/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function InventoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "estoque");

  const { movements, ingredients, expiringSoonCount } = await getInventoryPageData();
  const totalInventoryValue = ingredients.reduce(
    (sum, ingredient) => sum + Number(ingredient.stock_quantity ?? 0) * Number(ingredient.average_cost ?? 0),
    0,
  );
  const lowStockCount = ingredients.filter(
    (ingredient) => Number(ingredient.stock_quantity ?? 0) <= Number(ingredient.minimum_stock ?? 0),
  ).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário e movimentações"
        description="Consolide entradas, saídas, ajustes, perdas e desperdícios em um histórico auditável."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton
              filename="estoque-insumos.csv"
              label="Exportar estoque"
              rows={ingredients.map((ingredient) => ({
                insumo: ingredient.name,
                unidade: ingredient.unit,
                estoque_atual: ingredient.stock_quantity,
                estoque_minimo: ingredient.minimum_stock,
                custo_medio: ingredient.average_cost,
                validade: ingredient.expiration_date ?? "",
              }))}
            />
            <ExportCsvButton
              filename="movimentacoes-estoque.csv"
              label="Exportar movimentações"
              rows={movements.map((movement) => ({
                insumo: movement.ingredient_name ?? "",
                tipo: movement.movement_type,
                quantidade: movement.quantity,
                custo_unitario: movement.unit_cost,
                motivo: movement.reason ?? "",
                data: movement.created_at,
              }))}
            />
          </div>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Valor estimado em estoque</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Itens abaixo do mínimo</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{lowStockCount}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5">
          <p className="text-sm text-stone-500">Validades críticas</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{expiringSoonCount}</p>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <InventoryAdjustmentForm ingredients={ingredients} />
          <InventoryBatchCountForm ingredients={ingredients} />
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
                    {ingredient.expiration_date ? (
                      <p className="text-xs text-stone-500">Validade: {ingredient.expiration_date}</p>
                    ) : null}
                  </div>
                  <Badge variant={Number(ingredient.stock_quantity) <= Number(ingredient.minimum_stock) ? "warning" : "success"}>
                    Min. {ingredient.minimum_stock}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryMovementsTable movements={movements} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
