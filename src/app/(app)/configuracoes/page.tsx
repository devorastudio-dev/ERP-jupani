import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "configuracoes");

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Área restrita para parâmetros sensíveis, segurança e evolução futura do módulo fiscal." />
      <Card>
        <CardHeader>
          <CardTitle>Base fiscal preparada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-600">
          <p>
            A modelagem já inclui `fiscal_documents`, `fiscal_document_items`, `fiscal_events`, `fiscal_status`,
            `external_reference`, `document_number`, `issue_date`, `xml_url` e `pdf_url`.
          </p>
          <p>
            Os pontos de extensão foram mantidos em tabelas separadas para que a emissão oficial entre depois com o menor impacto possível nas rotinas de vendas, pedidos e auditoria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
