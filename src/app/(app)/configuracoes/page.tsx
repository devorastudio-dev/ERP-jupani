import { PageHeader } from "@/components/shared/page-header";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { getCompanySettings } from "@/features/settings/server/queries";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "configuracoes");

  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie as configurações globais do sistema." />
      <SettingsForm defaultValues={settings || undefined} />
    </div>
  );
}
