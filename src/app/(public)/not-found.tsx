import { Container } from "@/features/storefront/components/layout/container";
import { LinkButton } from "@/features/storefront/components/ui/link-button";

export default function PublicNotFound() {
  return (
    <div className="pb-20 pt-16">
      <Container className="text-center">
        <h1 className="font-display text-4xl text-[#3a231c]">Página não encontrada</h1>
        <p className="mt-3 text-sm text-[#7b3b30]">
          Não encontramos esse conteúdo no site da Ju.pani.
        </p>
        <LinkButton href="/cardapio" className="mt-6">
          Voltar ao cardápio
        </LinkButton>
      </Container>
    </div>
  );
}
