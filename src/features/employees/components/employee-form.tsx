"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createEmployeeAction } from "@/features/employees/actions";
import { employeeSchema } from "@/features/employees/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EmployeeForm({ allowSalary }: { allowSalary: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      remuneration_type: "fixo",
      is_active: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
      const result = await createEmployeeAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível salvar o funcionário.");
        return;
      }

      toast.success("Funcionário cadastrado.");
      reset();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
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
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600 md:col-span-2">
        <input type="checkbox" value="true" defaultChecked {...register("is_active")} />
        Funcionário ativo
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar funcionário"}
        </Button>
      </div>
    </form>
  );
}
