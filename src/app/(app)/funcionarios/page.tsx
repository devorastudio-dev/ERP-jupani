import { canViewSalary } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeePaymentForm } from "@/features/employees/components/employee-payment-form";
import { getEmployeesPageData } from "@/features/employees/server/queries";
import { getCurrentProfile } from "@/server/auth/session";
import { requireModule } from "@/server/auth/guards";

export default async function EmployeesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  requireModule(profile, "funcionarios");

  const allowSalary = canViewSalary(profile.roles);
  const { employees, payments } = await getEmployeesPageData(allowSalary);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Cadastre colaboradores, acompanhe remuneração e registre adiantamentos, bônus e pagamentos."
      />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeForm allowSalary={allowSalary} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Novo lançamento</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeePaymentForm employees={employees} allowSalary={allowSalary} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employees.length ? (
                employees.map((employee) => (
                  <div key={employee.id} className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm shadow-rose-100/40">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-stone-800">{employee.full_name}</p>
                        <p className="text-sm text-stone-500">
                          {employee.role_name} • {formatPhone(employee.phone)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="muted">{employee.remuneration_type}</Badge>
                          {allowSalary && employee.remuneration_type === "comissao" && employee.commission_percentage ? (
                            <Badge variant="default">{employee.commission_percentage}% sobre líquido</Badge>
                          ) : null}
                        </div>
                        {employee.notes ? <p className="mt-2 text-xs text-stone-500">{employee.notes}</p> : null}
                      </div>
                      <div className="text-right">
                        <Badge variant={employee.is_active ? "success" : "muted"}>
                          {employee.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <p className="mt-2 text-sm text-stone-600">
                          {allowSalary ? formatCurrency(Number(employee.salary_base ?? 0)) : "Salário restrito"}
                        </p>
                        <div className="mt-3 flex justify-end">
                          <EmployeeFormDialog employee={employee} allowSalary={allowSalary} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                  Nenhum funcionário cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length ? (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl bg-rose-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-stone-800">{payment.employee_name}</p>
                      <p className="font-semibold text-stone-900">
                        {allowSalary ? formatCurrency(Number(payment.amount ?? 0)) : "Restrito"}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      {payment.payment_type} • {formatDate(payment.payment_date)}
                    </p>
                    {payment.notes ? <p className="mt-1 text-xs text-stone-500">{payment.notes}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
                  Ainda não há lançamentos de funcionários.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
