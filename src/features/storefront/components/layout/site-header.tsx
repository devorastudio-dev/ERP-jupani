"use client";

import { AtSign, Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CartIndicator } from "@/features/storefront/components/cart/cart-indicator";
import { Container } from "@/features/storefront/components/layout/container";
import { CONTACT_INSTAGRAM_URL, CONTACT_PHONE_E164 } from "@/features/storefront/lib/contact";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/endereco", label: "Endereço" },
];

export const SiteHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-md">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3a231c] font-display text-xl text-white">
            Ju
          </div>
          <div>
            <p className="font-display text-2xl leading-none text-[#3a231c]">Ju.pani</p>
            <span className="hidden text-sm text-[#7b3b30] md:inline">
              Confeitaria artesanal
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#3a231c]">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[#d37d64]"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${CONTACT_PHONE_E164}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#3a231c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5a362c]"
          >
            WhatsApp
          </a>
          <a
            href={CONTACT_INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram da Ju.pani"
            className="text-[#7b3b30] transition hover:text-[#d37d64]"
          >
            <AtSign width={18} height={18} />
          </a>
          <Link
            href="/carrinho"
            className="relative rounded-full border border-[#f1d0c7] px-4 py-2 text-sm font-semibold text-[#7b3b30] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
          >
            <ShoppingCart 
            width={15}
            height={15}
            />
            <CartIndicator />
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/carrinho"
            className="relative rounded-full border border-[#f1d0c7] px-3 py-2 text-sm font-semibold text-[#7b3b30] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
            aria-label="Carrinho"
          >
            <ShoppingCart width={16} height={16} />
            <CartIndicator />
          </Link>
          <button
            className="rounded-full border border-[#f1d0c7] p-2 text-[#3a231c] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-black/5 md:hidden">
            <nav className="flex flex-col py-4 px-4 gap-4 text-sm font-medium text-[#3a231c]">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#d37d64] py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={`https://wa.me/${CONTACT_PHONE_E164}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#3a231c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5a362c] self-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                WhatsApp
              </a>
              <a
                href={CONTACT_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="py-2 text-[#7b3b30] transition hover:text-[#d37d64]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <AtSign width={16} height={16} />
                  Instagram
                </span>
              </a>
              <Link
                href="/carrinho"
                className="relative rounded-full border border-[#f1d0c7] px-4 py-2 text-sm font-semibold text-[#7b3b30] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fdf3ee] self-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart 
                width={15}
                height={15}
                />
                <CartIndicator />
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};
