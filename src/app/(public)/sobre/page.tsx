import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/features/storefront/components/layout/container";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import sobreImg from "../../../../public/images/sobre.jpeg";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a história da Ju.pani, nossa missão e o carinho por trás de cada receita.",
  openGraph: {
    title: "Sobre",
    description:
      "Conheça a história da Ju.pani, nossa missão e o carinho por trás de cada receita.",
    url: "/sobre",
  },
};

export default function SobrePage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="pt-12">
        <Container className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <SectionHeader
              title="Uma confeitaria feita de encontros"
              subtitle="Do primeiro bolo feito em casa aos pedidos que atravessam a cidade."
            />
            <p className="text-base text-[#7b3b30]">
              A Ju.pani nasceu do desejo de criar momentos doces e acolhedores.
              Entre receitas familiares, cadernos de sabores e tardes de testes,
              fomos refinando cada detalhe para transformar celebrações simples
              em experiências memoráveis.
            </p>
            <p className="text-base text-[#7b3b30]">
              Hoje trabalhamos com pequenos lotes, ingredientes frescos e um
              cuidado artesanal em cada etapa. Nosso ateliê é um espaço de
              criatividade, afeto e escuta — tudo para que você se sinta em
              casa.
            </p>
          </div>
          <div className="rounded-[40px] bg-white p-4 shadow-soft">
            <Image
              src={sobreImg}
              alt="Ateliê Ju.pani"
              width={520}
              height={520}
              className="h-auto w-full rounded-4xl"
            />
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "História das fundadoras",
              text: "Júlia e Juceia transformaram a família e o amor pela confeitaria em um negócio que celebra o artesanal, unindo técnica e afeto.",
            },
            {
              title: "Missão",
              text: "Criar doces que conectam pessoas, respeitando ingredientes e valorizando processos manuais em cada produção.",
            },
            {
              title: "Valores",
              text: "Cuidado com o tempo, respeito ao ingrediente, atendimento próximo e estética delicada em cada entrega.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl bg-white p-6 shadow-soft">
              <h3 className="font-display text-xl text-[#3a231c]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-[#7b3b30]">{item.text}</p>
            </div>
          ))}
        </Container>
      </section>
    </div>
  );
}
