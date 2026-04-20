"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type Supplier, type SupplierFormValues } from "../schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createSupplier, updateSupplier } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SupplierFormProps {
  supplierId?: string;
  supplier?: Supplier | null;
  onSuccess?: () => void;
}

export function SupplierForm({ supplierId, supplier, onSuccess }: SupplierFormProps) {
  const router = useRouter();
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      phone: "",
      whatsapp: "",
      email: "",
      notes: "",
    },
  });

  useEffect(() => {
    form.reset({
      name: supplier?.name ?? "",
      contact_name: supplier?.contact_name ?? "",
      phone: supplier?.phone ?? "",
      whatsapp: supplier?.whatsapp ?? "",
      email: supplier?.email ?? "",
      notes: supplier?.notes ?? "",
    });
  }, [form, supplier]);

  async function onSubmit(values: SupplierFormValues) {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, String(value ?? ""));
      });

      if (supplierId) {
        await updateSupplier(supplierId, formData);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await createSupplier(formData);
        toast.success("Fornecedor cadastrado com sucesso!");
      }
      form.reset({
        name: "",
        contact_name: "",
        phone: "",
        whatsapp: "",
        email: "",
        notes: "",
      });
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar fornecedor");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do fornecedor *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Doce Arte Ltda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do contato</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contato@fornecedor.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Informações importantes sobre o fornecedor..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-rose-100 bg-white/95 pt-4 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.reset({
                name: supplier?.name ?? "",
                contact_name: supplier?.contact_name ?? "",
                phone: supplier?.phone ?? "",
                whatsapp: supplier?.whatsapp ?? "",
                email: supplier?.email ?? "",
                notes: supplier?.notes ?? "",
              })
            }
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {supplierId ? "Atualizar" : "Criar"} Fornecedor
          </Button>
        </div>
      </form>
    </Form>
  );
}
