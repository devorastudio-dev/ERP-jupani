import { AlertTriangle, BadgeDollarSign, CalendarClock, ClipboardPenLine } from "lucide-react";
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
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Valor estimado em estoque</p>
            <BadgeDollarSign className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Itens abaixo do mínimo</p>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{lowStockCount}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Validades críticas</p>
            <CalendarClock className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{expiringSoonCount}</p>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <InventoryAdjustmentForm ingredients={ingredients} />
          <InventoryBatchCountForm ingredients={ingredients} />
          <Card className="xl:sticky xl:top-28">
            <CardHeader>
              <CardTitle>Resumo do estoque</CardTitle>
              <p className="text-sm text-stone-500">
                Apoio rápido para conferência de itens críticos enquanto voce registra ajustes e contagens.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.slice(0, 10).map((ingredient) => (
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
              {ingredients.length > 10 ? (
                <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-stone-500">
                  Exibindo 10 itens para leitura rápida. O histórico ao lado continua disponível para auditoria completa.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <ClipboardPenLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Movimentações em foco</p>
                <p className="mt-1 text-sm text-stone-500">
                  Ajustes e contagens ficam separados do histórico para evitar sensação de tela carregada durante a operação.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
          <CardHeader>
            <CardTitle>Histórico de movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryMovementsTable movements={movements} />
          </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
