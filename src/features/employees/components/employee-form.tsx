"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createEmployeeAction, updateEmployeeAction } from "@/features/employees/actions";
import { employeeSchema } from "@/features/employees/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeRow } from "@/types/entities";

interface EmployeeFormProps {
  allowSalary: boolean;
  employee?: EmployeeRow | null;
  onSuccess?: () => void;
}

export function EmployeeForm({ allowSalary, employee, onSuccess }: EmployeeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: "",
      role_name: "",
      phone: "",
      remuneration_type: "fixo",
      salary_base: 0,
      commission_percentage: 0,
      is_active: true,
      notes: "",
    },
  });

  useEffect(() => {
    reset({
      full_name: employee?.full_name ?? "",
      role_name: employee?.role_name ?? "",
      phone: employee?.phone ?? "",
      remuneration_type: (employee?.remuneration_type as "fixo" | "diaria" | "comissao" | "freelancer") ?? "fixo",
      salary_base: Number(employee?.salary_base ?? 0),
      commission_percentage: Number(employee?.commission_percentage ?? 0),
      is_active: employee?.is_active ?? true,
      notes: employee?.notes ?? "",
    });
  }, [employee, reset]);

  const remunerationType = watch("remuneration_type");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
      const result = employee?.id
        ? await updateEmployeeAction(employee.id, formData)
        : await createEmployeeAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o funcionário.");
        return;
      }

      toast.success(employee?.id ? "Funcionário atualizado." : "Funcionário cadastrado.");
      if (!employee?.id) {
        reset({
          full_name: "",
          role_name: "",
          phone: "",
          remuneration_type: "fixo",
          salary_base: 0,
          commission_percentage: 0,
          is_active: true,
          notes: "",
        });
      }
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fff7f4] to-[#fff0ef] p-4 md:col-span-2">
        <p className="text-sm font-medium text-stone-700">Modelo de remuneração</p>
        <p className="mt-1 text-sm text-stone-500">
          Para comissão, informe o percentual sobre o valor líquido das vendas. O campo fica salvo no cadastro
          para apoiar o cálculo operacional e financeiro depois.
        </p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="full_name">Nome</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name ? <p className="text-sm text-red-600">{errors.full_name.message as string}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role_name">Cargo</Label>
        <Input id="role_name" {...register("role_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="remuneration_type">Tipo de remuneração</Label>
        <select id="remuneration_type" {...register("remuneration_type")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
          <option value="fixo">Fixo</option>
          <option value="diaria">Diária</option>
          <option value="comissao">Comissão</option>
          <option value="freelancer">Freelancer</option>
        </select>
      </div>
      {allowSalary ? (
        <div className="space-y-2">
          <Label htmlFor="salary_base">Salário base</Label>
          <Input id="salary_base" type="number" step="0.01" min="0" {...register("salary_base")} />
        </div>
      ) : null}
      {allowSalary && remunerationType === "comissao" ? (
        <div className="space-y-2">
          <Label htmlFor="commission_percentage">% sobre vendas líquidas</Label>
          <Input id="commission_percentage" type="number" step="0.01" min="0" max="100" {...register("commission_percentage")} />
        </div>
      ) : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 md:col-span-2">
        <input type="checkbox" value="true" defaultChecked {...register("is_active")} />
        Funcionário ativo
      </label>
      <div className="sticky bottom-0 z-10 border-t border-rose-100 bg-white/95 pt-4 backdrop-blur md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : employee?.id ? "Atualizar funcionário" : "Salvar funcionário"}
        </Button>
      </div>
    </form>
  );
}
