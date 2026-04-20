"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  closeCashSessionAction,
  createCashMovementAction,
  openCashSessionAction,
} from "@/features/cash/actions";
import {
  cashMovementSchema,
  cashSessionCloseSchema,
  cashSessionOpenSchema,
} from "@/features/cash/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CashSessionRow } from "@/types/entities";

export function CashOperations({ openSession }: { openSession: CashSessionRow | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const openForm = useForm({
    resolver: zodResolver(cashSessionOpenSchema),
    defaultValues: {
      opening_balance: 0,
    },
  });

  const movementForm = useForm({
    resolver: zodResolver(cashMovementSchema),
    defaultValues: {
      movement_type: "entrada",
      category_name: "Ajuste",
    },
  });

  const closeForm = useForm({
    resolver: zodResolver(cashSessionCloseSchema),
    defaultValues: {
      session_id: openSession?.id ?? "",
      closing_balance: 0,
    },
  });

  const submitOpen = openForm.handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("opening_balance", String(values.opening_balance));
      formData.set("notes", values.notes ?? "");
      const result = await openCashSessionAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível abrir o caixa.");
        return;
      }
      toast.success("Caixa aberto.");
      openForm.reset();
      router.refresh();
    });
  });

  const submitMovement = movementForm.handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("movement_type", values.movement_type);
      formData.set("amount", String(values.amount));
      formData.set("category_name", values.category_name);
      formData.set("description", values.description);
      const result = await createCashMovementAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível lançar a movimentação.");
        return;
      }
      toast.success("Movimentação registrada.");
      movementForm.reset({
        movement_type: "entrada",
        category_name: "Ajuste",
        amount: 0,
        description: "",
      });
      router.refresh();
    });
  });

  const submitClose = closeForm.handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("session_id", values.session_id);
      formData.set("closing_balance", String(values.closing_balance));
      formData.set("notes", values.notes ?? "");
      const result = await closeCashSessionAction(formData);
      if (!result?.success) {
        toast.error(result?.error ?? "Não foi possível fechar o caixa.");
        return;
      }
      toast.success("Caixa fechado.");
      closeForm.reset();
      router.refresh();
    });
  });

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Abertura</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitOpen} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="opening_balance">Saldo inicial</Label>
              <Input id="opening_balance" type="number" step="0.01" min="0" {...openForm.register("opening_balance")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-notes">Observações</Label>
              <Textarea id="open-notes" {...openForm.register("notes")} />
            </div>
            <Button type="submit" disabled={pending || Boolean(openSession)}>
              {openSession ? "Já existe caixa aberto" : "Abrir caixa"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Fechamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitClose} className="space-y-4">
            <input type="hidden" value={openSession?.id ?? ""} {...closeForm.register("session_id")} />
            <div className="space-y-2">
              <Label htmlFor="closing_balance">Saldo final contado</Label>
              <Input id="closing_balance" type="number" step="0.01" min="0" {...closeForm.register("closing_balance")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-notes">Observações</Label>
              <Textarea id="close-notes" {...closeForm.register("notes")} />
            </div>
            <Button type="submit" variant="outline" disabled={pending || !openSession}>
              {!openSession ? "Sem caixa aberto" : "Fechar caixa"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Lançamento manual</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitMovement} className="grid gap-4 xl:grid-cols-[0.7fr_0.8fr_0.6fr_1.2fr_auto] xl:items-end">
            <div className="space-y-2">
              <Label htmlFor="movement_type">Tipo</Label>
              <select id="movement_type" {...movementForm.register("movement_type")} className="flex h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="sangria">Sangria</option>
                <option value="reforco">Reforço</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_name">Categoria</Label>
              <Input id="category_name" {...movementForm.register("category_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" {...movementForm.register("amount")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" className="min-h-10" {...movementForm.register("description")} />
            </div>
            <Button type="submit" disabled={pending || !openSession} className="xl:mb-0.5">
              {!openSession ? "Abra o caixa primeiro" : "Registrar movimentação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
