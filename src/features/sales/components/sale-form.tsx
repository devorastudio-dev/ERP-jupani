"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSaleAction, updateSaleAction } from "@/features/sales/actions";
import { saleSchema } from "@/features/sales/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { CashSessionRow, ProductRow, SaleSummaryRow } from "@/types/entities";

const saleTypeOptions = ["balcao", "encomenda"] as const;
const orderTypeOptions = ["retirada", "entrega"] as const;
const saleStatusOptions = [
  "orcamento",
  "aguardando_confirmacao",
  "confirmado",
  "em_producao",
  "pronto",
  "entregue",
  "cancelado",
] as const;

interface SaleFormProps {
  products: ProductRow[];
  openCashSession: CashSessionRow | null;
  sale?: SaleSummaryRow | null;
  onSuccess?: () => void;
}

export function SaleForm({
  products,
  openCashSession,
  sale,
  onSuccess,
}: SaleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_type: "encomenda",
      order_type: "retirada",
      status: "aguardando_confirmacao",
      delivery_fee: 0,
      discount_amount: 0,
      initial_payment_amount: 0,
      items: [{ product_id: "", product_name: "", quantity: 1, unit_price: 0, discount_amount: 0, total_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const deliveryFee = Number(watch("delivery_fee") ?? 0);
  const orderDiscount = Number(watch("discount_amount") ?? 0);
  const initialPayment = Number(watch("initial_payment_amount") ?? 0);

  const productsMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
  const total = subtotal + deliveryFee - orderDiscount;
  const pendingAmount = Math.max(total - initialPayment, 0);

  useEffect(() => {
    reset({
      sale_type: saleTypeOptions.includes((sale?.sale_type ?? "encomenda") as (typeof saleTypeOptions)[number])
        ? ((sale?.sale_type ?? "encomenda") as (typeof saleTypeOptions)[number])
        : "encomenda",
      order_type: orderTypeOptions.includes((sale?.order_type ?? "retirada") as (typeof orderTypeOptions)[number])
        ? ((sale?.order_type ?? "retirada") as (typeof orderTypeOptions)[number])
        : "retirada",
      customer_name: sale?.customer_name ?? "",
      phone: sale?.phone ?? "",
      status: saleStatusOptions.includes((sale?.status ?? "aguardando_confirmacao") as (typeof saleStatusOptions)[number])
        ? ((sale?.status ?? "aguardando_confirmacao") as (typeof saleStatusOptions)[number])
        : "aguardando_confirmacao",
      delivery_date: sale?.delivery_date ? new Date(sale.delivery_date).toISOString().slice(0, 16) : "",
      delivery_fee: Number(sale?.delivery_fee ?? 0),
      discount_amount: Number(sale?.discount_amount ?? 0),
      payment_method: sale?.payment_method ?? "",
      initial_payment_amount: sale?.id ? 0 : 0,
      notes: sale?.notes ?? "",
      internal_notes: sale?.internal_notes ?? "",
      items:
        sale?.sale_items?.map((item) => ({
          product_id: item.product_id ?? "",
          product_name: item.product_name,
          quantity: Number(item.quantity ?? 1),
          unit_price: Number(item.unit_price ?? 0),
          discount_amount: Number(item.discount_amount ?? 0),
          total_price: Number(item.total_price ?? 0),
          notes: item.notes ?? "",
        })) ?? [{ product_id: "", product_name: "", quantity: 1, unit_price: 0, discount_amount: 0, total_price: 0 }],
    });
  }, [sale, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sale_type", values.sale_type);
      formData.set("order_type", values.order_type);
      formData.set("customer_name", values.customer_name);
      formData.set("phone", values.phone);
      formData.set("status", values.status);
      formData.set("delivery_date", values.delivery_date);
      formData.set("delivery_fee", String(values.delivery_fee));
      formData.set("discount_amount", String(values.discount_amount));
      formData.set("payment_method", values.payment_method ?? "");
      formData.set("initial_payment_amount", String(values.initial_payment_amount));
      formData.set("notes", values.notes ?? "");
      formData.set("internal_notes", values.internal_notes ?? "");
      formData.set("items", JSON.stringify(values.items));

      const result = sale?.id ? await updateSaleAction(sale.id, formData) : await createSaleAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível criar o pedido.");
        return;
      }

      toast.success(sale?.id ? "Pedido atualizado com sucesso." : "Pedido criado com sucesso.");
      if (!sale?.id) {
        reset();
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{sale?.id ? "Editar pedido" : "Novo pedido"}</CardTitle>
          <Badge variant={openCashSession ? "success" : "warning"}>
            {openCashSession ? "Caixa aberto" : "Sem caixa aberto"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff8f6] to-[#fff1ef] p-4">
            <div className="grid gap-3 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Subtotal</p>
                <p className="mt-1 text-lg font-semibold text-stone-900">{formatCurrency(subtotal)}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Total do pedido</p>
                <p className="mt-1 text-lg font-semibold text-stone-900">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Saldo pendente</p>
                <p className="mt-1 text-lg font-semibold text-stone-900">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Cliente</Label>
              <Input id="customer_name" {...register("customer_name")} />
              {errors.customer_name ? <p className="text-sm text-red-600">{errors.customer_name.message as string}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_type">Tipo de venda</Label>
              <select id="sale_type" {...register("sale_type")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="balcao">Balcão</option>
                <option value="encomenda">Encomenda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_type">Atendimento</Label>
              <select id="order_type" {...register("order_type")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="retirada">Retirada</option>
                <option value="entrega">Entrega</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status inicial</Label>
              <select id="status" {...register("status")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="orcamento">Orçamento</option>
                <option value="aguardando_confirmacao">Aguardando confirmação</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_producao">Em produção</option>
                <option value="pronto">Pronto</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Entrega</Label>
              <Input id="delivery_date" type="datetime-local" {...register("delivery_date")} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Itens do pedido</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={() =>
                  append({
                    product_id: "",
                    product_name: "",
                    quantity: 1,
                    unit_price: 0,
                    discount_amount: 0,
                    total_price: 0,
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-3xl border border-rose-100 p-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(110px,0.52fr)_minmax(130px,0.62fr)_minmax(130px,0.62fr)_auto]">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <select
                      {...register(`items.${index}.product_id`)}
                      onChange={(event) => {
                        const product = productsMap.get(event.target.value);
                        setValue(`items.${index}.product_id`, event.target.value);
                        setValue(`items.${index}.product_name`, product?.name ?? "");
                        setValue(`items.${index}.unit_price`, Number(product?.sale_price ?? 0));
                        const quantity = Number(items[index]?.quantity ?? 1);
                        const discount = Number(items[index]?.discount_amount ?? 0);
                        setValue(`items.${index}.total_price`, quantity * Number(product?.sale_price ?? 0) - discount);
                      }}
                      className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
                    >
                      <option value="">Selecione</option>
                      {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.fulfillment_type === "pronta_entrega"
                          ? ` • estoque ${Number(product.finished_stock_quantity ?? 0).toFixed(3)} ${product.unit}`
                          : ""}
                      </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Qtd.</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="1"
                      {...register(`items.${index}.quantity`)}
                      onChange={(event) => {
                        const quantity = Number(event.target.value);
                        setValue(`items.${index}.quantity`, quantity);
                        const unitPrice = Number(items[index]?.unit_price ?? 0);
                        const discount = Number(items[index]?.discount_amount ?? 0);
                        setValue(`items.${index}.total_price`, quantity * unitPrice - discount);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unit_price`)}
                      onChange={(event) => {
                        const unitPrice = Number(event.target.value);
                        setValue(`items.${index}.unit_price`, unitPrice);
                        const quantity = Number(items[index]?.quantity ?? 1);
                        const discount = Number(items[index]?.discount_amount ?? 0);
                        setValue(`items.${index}.total_price`, quantity * unitPrice - discount);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.discount_amount`)}
                      onChange={(event) => {
                        const discount = Number(event.target.value);
                        setValue(`items.${index}.discount_amount`, discount);
                        const quantity = Number(items[index]?.quantity ?? 1);
                        const unitPrice = Number(items[index]?.unit_price ?? 0);
                        setValue(`items.${index}.total_price`, quantity * unitPrice - discount);
                      }}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2 xl:justify-end">
                    <div className="text-left xl:text-right">
                      <p className="text-xs text-stone-500">Total</p>
                      <p className="text-sm font-semibold text-stone-800">
                        {formatCurrency(Number(items[index]?.total_price ?? 0))}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <input type="hidden" {...register(`items.${index}.product_name`)} />
                  <input type="hidden" {...register(`items.${index}.total_price`)} />
                </div>
              ))}
            </div>
            {errors.items ? <p className="text-sm text-red-600">{errors.items.message as string}</p> : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Taxa de entrega</Label>
              <Input id="delivery_fee" type="number" step="0.01" min="0" {...register("delivery_fee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_amount">Desconto geral</Label>
              <Input id="discount_amount" type="number" step="0.01" min="0" {...register("discount_amount")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de pagamento inicial</Label>
              <select id="payment_method" {...register("payment_method")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="">Selecione</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
            {sale?.id ? (
              <div className="space-y-2">
                <Label>Recebido até agora</Label>
                <Input value={formatCurrency(Number(sale.paid_amount ?? 0))} readOnly />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="initial_payment_amount">Pagamento inicial</Label>
                <Input id="initial_payment_amount" type="number" step="0.01" min="0" {...register("initial_payment_amount")} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações para o cliente</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Anotação interna</Label>
            <Textarea id="internal_notes" {...register("internal_notes")} />
          </div>

          <div className="grid gap-3 rounded-3xl bg-rose-50 p-4 xl:grid-cols-4">
            <div>
              <p className="text-xs text-stone-500">Subtotal</p>
              <p className="mt-1 font-semibold text-stone-900">{formatCurrency(subtotal)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Total do pedido</p>
              <p className="mt-1 font-semibold text-stone-900">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Recebido agora</p>
              <p className="mt-1 font-semibold text-stone-900">{formatCurrency(initialPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Saldo pendente</p>
              <p className="mt-1 font-semibold text-stone-900">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando pedido..." : sale?.id ? "Atualizar pedido" : "Criar pedido"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
