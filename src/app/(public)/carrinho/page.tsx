import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { CartPage } from "@/features/storefront/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise seus itens e adicione observações antes de finalizar.",
  openGraph: {
    title: "Carrinho",
    description: "Revise seus itens e adicione observações antes de finalizar.",
    url: "/carrinho",
  },
};

export default function CarrinhoPage() {
  return (
    <div className="pb-20 pt-10">
      <Container className="space-y-6">
        <SectionHeader
          title="Seu carrinho"
          subtitle="Ajuste quantidades e deixe observações especiais."
        />
        <CartPage />
      </Container>
    </div>
  );
}
