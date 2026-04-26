import "server-only";
import { CONTACT_PHONE_E164 } from "@/features/storefront/lib/contact";
import { formatCurrency } from "@/features/storefront/lib/format";
import type { CartItem } from "@/features/storefront/lib/types";

type WhatsAppOrder = {
  orderCode: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  address: string;
  addressReference?: string | null;
  notes?: string | null;
};

export const buildWhatsAppMessage = (order: WhatsAppOrder) => {
  const lines: string[] = [];

  lines.push("🍰🧁 Pedido Ju.pani");
  lines.push(`Pedido: #${order.orderCode}`);
  lines.push("");
  lines.push("Itens:");
  order.items.forEach((item) => {
    const obs = item.itemNotes ? ` | Obs: ${item.itemNotes}` : "";
    lines.push(
      `- ${item.quantity}x ${item.name} (${formatCurrency(item.unitPrice)})${obs}`
    );
  });
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  lines.push(`Frete: ${formatCurrency(order.shippingFee)}`);
  lines.push(`Total: ${formatCurrency(order.total)}`);
  lines.push("");
  lines.push(`Pagamento: ${order.paymentMethod}`);
  lines.push("");
  lines.push(`Endereço: ${order.address}`);
  if (order.addressReference) {
    lines.push(`Referência: ${order.addressReference}`);
  }
  lines.push(`Contato: ${order.customerName} - ${order.customerPhone}`);
  if (order.notes) {
    lines.push("");
    lines.push(`Observações gerais: ${order.notes}`);
  }

  return lines.join("\n");
};

export const buildWhatsAppUrl = (message: string) => {
  const phone =
    process.env.WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    CONTACT_PHONE_E164;

  if (!phone) {
    throw new Error("WHATSAPP_NUMBER não configurado.");
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
};
