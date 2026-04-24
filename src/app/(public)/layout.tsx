import type { ReactNode } from "react";
import { Manrope, Playfair_Display } from "next/font/google";
import "@/features/storefront/styles/storefront.css";
import { CartProvider } from "@/features/storefront/components/cart/cart-provider";
import { SiteFooter } from "@/features/storefront/components/layout/site-footer";
import { SiteHeader } from "@/features/storefront/components/layout/site-header";
import { getStorefrontSettings } from "@/features/storefront/server/settings";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const settings = await getStorefrontSettings();

  return {
    title: {
      default: `${settings.brandName} | ${settings.tagline}`,
      template: `%s | ${settings.brandName}`,
    },
    description: settings.metaDescription,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jupani.local"),
    openGraph: {
      title: `${settings.brandName} | ${settings.tagline}`,
      description: settings.metaDescription,
      url: "/",
      siteName: settings.brandName,
      type: "website" as const,
      locale: "pt_BR",
    },
  };
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getStorefrontSettings();

  return (
    <div className={`${manrope.variable} ${playfair.variable} min-h-screen`}>
      <CartProvider>
        <SiteHeader settings={settings} />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </CartProvider>
    </div>
  );
}
