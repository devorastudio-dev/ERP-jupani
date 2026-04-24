import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { CheckoutForm } from "@/features/storefront/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Preencha seus dados e finalize o pedido no WhatsApp com total calculado.",
  openGraph: {
    title: "Checkout",
    description:
      "Preencha seus dados e finalize o pedido no WhatsApp com total calculado.",
    url: "/checkout",
  },
};

export default function CheckoutPage() {
  return (
    <div className="pb-20 pt-10">
      <Container className="space-y-6">
        <SectionHeader
          title="Finalizar pedido"
          subtitle="Confirme seus dados e siga para o WhatsApp."
        />
        <CheckoutForm />
      </Container>
    </div>
  );
}
