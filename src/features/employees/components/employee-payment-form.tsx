"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createEmployeePaymentAction } from "@/features/employees/actions";
import { employeePaymentSchema } from "@/features/employees/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeRow } from "@/types/entities";

export function EmployeePaymentForm({
  employees,
  allowSalary,
}: {
  employees: EmployeeRow[];
  allowSalary: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeePaymentSchema),
    defaultValues: {
      payment_type: "salario",
      payment_date: new Date().toISOString().slice(0, 10),
    },
  });

  if (!allowSalary) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 p-6 text-sm text-stone-500">
        Somente admin e financeiro podem registrar valores salariais.
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
      const result = await createEmployeePaymentAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível registrar o pagamento.");
        return;
      }

      toast.success("Lançamento registrado.");
      reset();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="employee_id">Funcionário</Label>
        <select
          id="employee_id"
          {...register("employee_id")}
          onChange={(event) => {
            const employee = employees.find((item) => item.id === event.target.value);
            setValue("employee_id", event.target.value);
            setValue("employee_name", employee?.full_name ?? "");
          }}
          className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm"
        >
          <option value="">Selecione</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        {errors.employee_id ? <p className="text-sm text-red-600">{errors.employee_id.message as string}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_type">Tipo</Label>
        <select id="payment_type" {...register("payment_type")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
          <option value="salario">Salário</option>
          <option value="adiantamento">Adiantamento</option>
          <option value="desconto">Desconto</option>
          <option value="bonus">Bônus</option>
          <option value="pagamento_realizado">Pagamento realizado</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_date">Data</Label>
        <Input id="payment_date" type="date" {...register("payment_date")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <input type="hidden" {...register("employee_name")} />
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Registrar lançamento"}
        </Button>
      </div>
    </form>
  );
}
