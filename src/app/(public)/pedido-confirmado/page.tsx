import Link from "next/link";
import { Container } from "@/features/storefront/components/layout/container";
import { LinkButton } from "@/features/storefront/components/ui/link-button";

type Props = {
  searchParams: Promise<{ pedido?: string; whatsapp?: string }>;
};

export default async function PedidoConfirmadoPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.pedido;
  const whatsappUrl = params.whatsapp ? decodeURIComponent(params.whatsapp) : null;

  return (
    <div className="pb-20 pt-12">
      <Container className="max-w-3xl">
        <div className="rounded-[32px] bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d59a73]">
            Pedido criado
          </p>
          <h1 className="mt-3 font-display text-4xl text-[#3a231c]">
            Seu pedido já foi registrado no sistema.
          </h1>
          <p className="mt-4 text-sm text-[#7b3b30]">
            O painel administrativo já pode acompanhar esse pedido. Agora você pode enviar a
            confirmação pelo WhatsApp para agilizar o atendimento.
          </p>
          {orderId && (
            <p className="mt-5 rounded-2xl bg-[#fff8f3] px-4 py-3 text-sm text-[#3a231c]">
              Número do pedido: <strong>{orderId}</strong>
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {whatsappUrl && (
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#3a231c] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#5a362c]"
              >
                Abrir WhatsApp
              </Link>
            )}
            <LinkButton href="/cardapio" variant="secondary">
              Voltar ao cardápio
            </LinkButton>
          </div>
        </div>
      </Container>
    </div>
  );
}
