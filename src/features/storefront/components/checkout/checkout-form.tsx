"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/features/storefront/components/cart/cart-provider";
import { Button } from "@/features/storefront/components/ui/button";
import { LinkButton } from "@/features/storefront/components/ui/link-button";
import { Input } from "@/features/storefront/components/ui/input";
import { Textarea } from "@/features/storefront/components/ui/textarea";
import { ATELIER_ADDRESS } from "@/features/storefront/lib/contact";
import { formatCurrency } from "@/features/storefront/lib/format";
import {
  calculateShipping,
  getShippingBreakdown,
  SHIPPING_METHODS,
  supportsDelivery,
  type ShippingMethod,
} from "@/features/storefront/lib/shipping";

const paymentOptions = [
  "Pix",
  "Cartão de crédito",
  "Cartão de débito",
  "Dinheiro",
];

const STORAGE_FORM_KEY = "ju_checkout_form";
const STORAGE_SHIPPING_KEY = "ju_checkout_shipping";

const getStoredCheckoutForm = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedForm = sessionStorage.getItem(STORAGE_FORM_KEY);
    return storedForm ? (JSON.parse(storedForm) as Record<string, string>) : null;
  } catch {
    return null;
  }
};

const getStoredShippingMethod = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedShipping = sessionStorage.getItem(STORAGE_SHIPPING_KEY);
    return storedShipping === "DELIVERY" || storedShipping === "PICKUP"
      ? storedShipping
      : null;
  } catch {
    return null;
  }
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatZip = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const CheckoutForm = () => {
  const { cart, loading, setNotes } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(() => ({
    customerName: "",
    customerPhone: "",
    addressStreet: "",
    addressNumber: "",
    addressDistrict: "",
    addressCity: "Piracema",
    addressState: "MG",
    addressZip: "",
    addressReference: "",
    paymentMethod: paymentOptions[0],
    ...getStoredCheckoutForm(),
  }));

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    () => getStoredShippingMethod() ?? "DELIVERY"
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_FORM_KEY, JSON.stringify(form));
    } catch {
      // ignore storage errors
    }
  }, [form]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_SHIPPING_KEY, shippingMethod);
    } catch {
      // ignore storage errors
    }
  }, [shippingMethod]);

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ??
    0;

  const shippingFee = useMemo(() => {
    return calculateShipping({
      city: form.addressCity,
      district: form.addressDistrict,
      method: shippingMethod,
    });
  }, [form.addressCity, form.addressDistrict, shippingMethod]);

  const total = subtotal + shippingFee;
  const shippingBreakdown = useMemo(() => {
    return getShippingBreakdown({
      city: form.addressCity,
      district: form.addressDistrict,
      method: shippingMethod,
    });
  }, [form.addressCity, form.addressDistrict, shippingMethod]);
  const deliveryAvailable = useMemo(() => {
    return supportsDelivery({
      city: form.addressCity,
      method: shippingMethod,
    });
  }, [form.addressCity, shippingMethod]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <p className="text-sm text-[#7b3b30]">Carregando seu pedido...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
        <p className="text-lg font-semibold text-[#3a231c]">
          Você precisa adicionar itens antes de finalizar.
        </p>
        <LinkButton href="/cardapio" className="mt-6">
          Ir para catálogo
        </LinkButton>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deliveryAvailable) {
      setError("No momento, as entregas estao disponiveis apenas para Piracema.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shippingMethod,
          addressStreet: form.addressStreet,
          addressNumber: form.addressNumber,
          addressDistrict: form.addressDistrict,
          addressCity: form.addressCity,
          addressState: form.addressState,
          addressZip: form.addressZip,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Erro ao criar pedido.");
      }
      try {
        sessionStorage.removeItem(STORAGE_FORM_KEY);
        sessionStorage.removeItem(STORAGE_SHIPPING_KEY);
      } catch {
        // ignore storage errors
      }
      window.location.href = data.whatsappUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6 rounded-3xl bg-white p-6 shadow-soft">
        <div>
          <h2 className="font-display text-2xl text-[#3a231c]">
            Dados para entrega
          </h2>
          <p className="text-sm text-[#7b3b30]">
            Preencha suas informações para que possamos confirmar o pedido no
            WhatsApp.
          </p>
          <p className="mt-2 text-xs text-[#7b3b30]">
            No momento, as entregas estao disponiveis apenas para {ATELIER_ADDRESS.city}.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#7b3b30]">
              Nome completo
            </label>
            <Input
              required
              value={form.customerName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customerName: event.target.value }))
              }
              placeholder="Seu nome"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#7b3b30]">
              Telefone/WhatsApp
            </label>
            <Input
              required
              value={form.customerPhone}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  customerPhone: formatPhone(event.target.value),
                }))
              }
              placeholder="(37) 99999-9999"
              inputMode="tel"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-[#f3d6cc] bg-[#fff8f3] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d59a73]">
            Frete
          </p>
          <p className="mt-2 text-sm text-[#7b3b30]">
            {shippingBreakdown.label}: {formatCurrency(shippingBreakdown.fee)}
          </p>
          <p className="mt-1 text-xs text-[#7b3b30]">
            {shippingBreakdown.description}
          </p>
          {!deliveryAvailable && shippingMethod === "DELIVERY" && (
            <p className="mt-2 text-xs font-semibold text-[#a34e3b]">
              Entrega indisponivel para fora de {ATELIER_ADDRESS.city}. Escolha retirada no atelie.
            </p>
          )}
          <div className="mt-3 flex flex-col gap-3">
            {SHIPPING_METHODS.map((method) => (
              <label
                key={method.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-[#3a231c] shadow-sm transition hover:border-[#f3d6cc]"
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={shippingMethod === method.id}
                  onChange={() => setShippingMethod(method.id)}
                  className="mt-1"
                />
                <span>
                  <strong>{method.label}</strong>
                  <span className="block text-xs text-[#7b3b30]">
                    {method.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#7b3b30]">
              Rua
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressStreet}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, addressStreet: event.target.value }))
              }
              placeholder="Rua das Lavandas"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Número
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, addressNumber: event.target.value }))
              }
              placeholder="123"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Bairro
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressDistrict}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, addressDistrict: event.target.value }))
              }
              placeholder="Planalto"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Cidade
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressCity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, addressCity: event.target.value }))
              }
              placeholder={ATELIER_ADDRESS.city}
              readOnly
              className="bg-[#fff8f3]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Estado
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressState}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, addressState: event.target.value }))
              }
              placeholder={ATELIER_ADDRESS.state}
              readOnly
              className="bg-[#fff8f3]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              CEP
            </label>
            <Input
              required={shippingMethod === "DELIVERY"}
              value={form.addressZip}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressZip: formatZip(event.target.value),
                }))
              }
              placeholder="00000-000"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7b3b30]">
              Referência
            </label>
            <Input
              value={form.addressReference}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressReference: event.target.value,
                }))
              }
              placeholder="Próximo ao mercado"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#7b3b30]">
            Forma de pagamento
          </label>
          <select
            value={form.paymentMethod}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))
            }
            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#3a231c] shadow-sm focus:border-[#d59a73] focus:outline-none"
          >
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#7b3b30]">
            Observações gerais
          </label>
          <Textarea
            rows={3}
            value={cart.notes ?? ""}
            onChange={(event) => {
              void setNotes(event.target.value);
            }}
            placeholder="Ex: entregar após 16h, sem lactose, caprichar na calda."
          />
          <p className="mt-1 text-xs text-[#7b3b30]">
            As observações do carrinho serão enviadas ao WhatsApp.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.2em] text-[#d59a73]">
            Resumo do pedido
          </p>
          <div className="mt-4 space-y-3 text-sm text-[#3a231c]">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {item.quantity}x {item.name}
                  </p>
                  {item.itemNotes && (
                    <p className="text-xs text-[#7b3b30]">Obs: {item.itemNotes}</p>
                  )}
                </div>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-dashed border-[#f3d6cc] pt-4 text-sm text-[#3a231c]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Frete</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
            <p className="text-xs text-[#7b3b30]">{shippingBreakdown.label}</p>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={submitting || !deliveryAvailable}
          className="w-full text-base"
        >
          {submitting ? "Gerando pedido..." : "Fazer pedido via WhatsApp"}
        </Button>
        <p className="text-xs text-[#7b3b30]">
          O pagamento é finalizado diretamente no WhatsApp. Seu pedido ficará
          registrado como pendente.
        </p>
      </div>
    </form>
  );
};
