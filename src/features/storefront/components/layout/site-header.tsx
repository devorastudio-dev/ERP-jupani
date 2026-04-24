"use client";

import { InstagramLogo, ShoppingCart, WhatsappLogo } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CartIndicator } from "@/features/storefront/components/cart/cart-indicator";
import { Container } from "@/features/storefront/components/layout/container";
import { CONTACT_INSTAGRAM_URL, CONTACT_PHONE_E164 } from "@/features/storefront/lib/contact";
import logoImg from "../../../../../public/images/logo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cardapio", label: "Pedidos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/endereco", label: "Endereço" },
];

export const SiteHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-md">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logoImg}
            alt="Ju.pani logo"
            width={64}
            height={64}
            className="-my-2"
          />
          <span className="hidden text-sm text-[#7b3b30] md:inline">
            Confeitaria artesanal
          </span>
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
            className="inline-flex items-center gap-2 rounded-full bg-[#3a231c] px-4 py-2 text-sm font-semibold text-white! shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5a362c]"
          >
            <WhatsappLogo width={16} height={16} />
            WhatsApp
          </a>
          <a
            href={CONTACT_INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram da Ju.pani"
            className="text-[#7b3b30] transition hover:text-[#d37d64]"
          >
            <InstagramLogo width={18} height={18} />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
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
                <WhatsappLogo width={16} height={16} />
                WhatsApp
              </a>
              <a
                href={CONTACT_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="py-2 text-[#7b3b30] transition hover:text-[#d37d64]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Instagram
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
