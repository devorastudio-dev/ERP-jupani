import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Playfair_Display } from "next/font/google";
import "@/features/storefront/styles/storefront.css";
import { CartProvider } from "@/features/storefront/components/cart/cart-provider";
import { SiteFooter } from "@/features/storefront/components/layout/site-footer";
import { SiteHeader } from "@/features/storefront/components/layout/site-header";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ju.pani | Confeitaria artesanal",
    template: "%s | Ju.pani",
  },
  description:
    "Catálogo e pedidos da Ju.pani integrados ao mesmo sistema administrativo da confeitaria.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jupani.local"),
  openGraph: {
    title: "Ju.pani | Confeitaria artesanal",
    description: "Bolos, doces e encomendas da Ju.pani com catálogo conectado ao painel administrativo.",
    url: "/",
    siteName: "Ju.pani",
    type: "website",
    locale: "pt_BR",
  },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${manrope.variable} ${playfair.variable} min-h-screen`}>
      <CartProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </CartProvider>
    </div>
  );
}
