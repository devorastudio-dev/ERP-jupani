import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/features/storefront/components/layout/container";
import { SectionHeader } from "@/features/storefront/components/sections/section-header";
import { getStorefrontSettings } from "@/features/storefront/server/settings";
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

export default async function SobrePage() {
  const settings = await getStorefrontSettings();

  return (
    <div className="space-y-16 pb-20">
      <section className="pt-12">
        <Container className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <SectionHeader
              title={settings.aboutTitle}
              subtitle="Do primeiro bolo feito em casa aos pedidos que atravessam a cidade."
            />
            <p className="text-base text-[#7b3b30]">
              {settings.aboutText1}
            </p>
            <p className="text-base text-[#7b3b30]">
              {settings.aboutText2}
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
