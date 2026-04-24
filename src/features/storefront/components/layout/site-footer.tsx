import Link from "next/link";
import { Container } from "@/features/storefront/components/layout/container";
import type { StorefrontSettings } from "@/features/storefront/server/settings";

export const SiteFooter = ({ settings }: { settings: StorefrontSettings }) => {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white/70">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <h2 className="font-display text-2xl text-[#3a231c]">{settings.brandName}</h2>
          <p className="text-sm text-[#7b3b30]">
            {settings.tagline}
          </p>
        </div>
        <div className="space-y-2 text-sm text-[#3a231c]">
          <p className="font-semibold text-[#7b3b30]">Atendimento</p>
          <p>{settings.businessHours}</p>
          <p>{settings.deliveryNote}</p>
          <a
            href={`https://wa.me/${settings.phoneE164}`}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-[#d37d64]"
          >
            WhatsApp: {settings.phoneDisplay}
          </a>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-[#d37d64]"
          >
            Instagram: @{settings.instagramHandle}
          </a>
        </div>
        <div className="space-y-2 text-sm text-[#3a231c]">
          <p className="font-semibold text-[#7b3b30]">Navegação</p>
          <div className="flex flex-col gap-1">
            <Link href="/cardapio" className="hover:text-[#d37d64]">
              Catálogo
            </Link>
            <Link href="/sobre" className="hover:text-[#d37d64]">
              Sobre a Ju.pani
            </Link>
            <Link href="/endereco" className="hover:text-[#d37d64]">
              Endereço
            </Link>
            <Link href="/checkout" className="hover:text-[#d37d64]">
              Finalizar pedido
            </Link>
          </div>
        </div>
      </Container>
      <div className="border-t border-black/5 py-4 text-center text-xs text-[#7b3b30]">
        {settings.footerNote} © {new Date().getFullYear()} {settings.brandName}.
      </div>
    </footer>
  );
};
