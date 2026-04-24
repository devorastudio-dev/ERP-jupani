import type { Metadata } from "next";
import { Container } from "@/features/storefront/components/layout/container";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import {
  ATELIER_ADDRESS,
  CONTACT_INSTAGRAM_HANDLE,
  CONTACT_INSTAGRAM_URL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/features/storefront/lib/contact";

export const metadata: Metadata = {
  title: "Endereço",
  description:
    "Confira o endereço da Ju.pani, horários e detalhes para retirada e entregas.",
  openGraph: {
    title: "Endereço",
    description:
      "Confira o endereço da Ju.pani, horários e detalhes para retirada e entregas.",
    url: "/endereco",
  },
};

export default function EnderecoPage() {
  return (
    <div className="space-y-16 pb-20 pt-10">
      <Container className="space-y-6">
        <SectionHeader
          title="Nosso endereço"
          subtitle="Ateliê aberto para retiradas e atendimento sob agendamento."
        />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d59a73]">
              Ju.pani Ateliê
            </p>
            <h2 className="font-display text-2xl text-[#3a231c]">
              {ATELIER_ADDRESS.street}
            </h2>
            <p className="text-sm text-[#7b3b30]">
              {ATELIER_ADDRESS.district} · {ATELIER_ADDRESS.city} ·{" "}
              {ATELIER_ADDRESS.state} · {ATELIER_ADDRESS.zip}
            </p>
            <div className="grid gap-4 rounded-2xl bg-[#fff8f3] p-4 text-sm text-[#3a231c]">
              <div>
                <p className="font-semibold">Horários</p>
                <p className="text-[#7b3b30]">Segunda a sábado · 9h às 19h</p>
              </div>
              <div>
                <p className="font-semibold">Retirada no local</p>
                <p className="text-[#7b3b30]">
                  Agende a retirada pelo WhatsApp e retire seu pedido fresquinho.
                </p>
              </div>
              <div>
                <p className="font-semibold">Entregas</p>
                <p className="text-[#7b3b30]">
                  Cobertura inicial para bairros selecionados de Piracema.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[36px] bg-white p-4 shadow-soft">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1664.4431248128494!2d-44.47192502193879!3d-20.524728902692182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1769709370694!5m2!1spt-BR!2sbr"
              width="100%"
              height="540"
              style={{ border: 0, borderRadius: "28px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Ju.pani Ateliê"
            />
          </div>
        </div>
      </Container>

      <Container className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Ponto de referência",
            text: "Primeira casa da rua onde está localizada a Sans Bronze.",
          },
          {
            title: "Contato rápido",
            text: `WhatsApp ${CONTACT_PHONE_DISPLAY} · Instagram @${CONTACT_INSTAGRAM_HANDLE}.`,
          },
          {
            title: "Agendamento",
            text: "Pedidos com antecedência mínima de 24h para garantir frescor.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl bg-white p-6 shadow-soft">
            <h3 className="font-display text-xl text-[#3a231c]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm text-[#7b3b30]">{item.text}</p>
            {item.title === "Contato rápido" && (
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <a
                  href={`https://wa.me/${CONTACT_PHONE_E164}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3a231c] transition hover:text-[#d37d64]"
                >
                  Chamar no WhatsApp
                </a>
                <a
                  href={CONTACT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3a231c] transition hover:text-[#d37d64]"
                >
                  Ver Instagram
                </a>
              </div>
            )}
          </div>
        ))}
      </Container>
    </div>
  );
}
