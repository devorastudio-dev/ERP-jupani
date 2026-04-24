import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog";
import { SuppliersTable } from "@/features/suppliers/components/suppliers-table";
import { getSuppliers } from "@/features/suppliers/queries";

export default async function FornecedoresPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "fornecedores");

  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Gerencie seus fornecedores de insumos com cadastro completo, busca e filtros avançados."
        action={
          <SupplierFormDialog triggerClassName="ml-auto h-10 px-4" />
        }
      />
      <SuppliersTable initialData={suppliers} />
    </div>
  );
}


