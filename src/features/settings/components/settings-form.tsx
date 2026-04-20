"use client";

import { useForm, type Resolver, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySettingsSchema, type CompanySettingsFormValues } from "../schema";
import { updateCompanySettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  defaultValues?: Partial<CompanySettingsFormValues>;
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const router = useRouter();
  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema) as Resolver<CompanySettingsFormValues>,
    defaultValues: {
      company_name: "",
      trade_name: "",
      ...defaultValues,
    } as CompanySettingsFormValues,
  });

  async function onSubmit(values: CompanySettingsFormValues) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));

    try {
      await updateCompanySettings(fd);
      router.refresh();
    } catch {
      alert("Erro ao salvar configurações");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da empresa *</Label>
              <Input {...form.register("company_name")} />
            </div>
            <div>
              <Label>Nome fantasia</Label>
              <Input {...form.register("trade_name")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input {...form.register("phone")} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input {...form.register("whatsapp")} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input {...form.register("email")} type="email" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Rua Exemplo, 123" {...form.register("address")} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input {...form.register("city")} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input {...form.register("state")} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input {...form.register("zip_code")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Prefixo dos pedidos</Label>
            <Input className="w-32" {...form.register("order_prefix")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Moeda</Label>
              <Controller
                name="default_currency"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">R$ BRL</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Localidade</Label>
              <Controller
                name="default_locale"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a localidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português BR</SelectItem>
                      <SelectItem value="en-US">English US</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Fuso horário</Label>
              <Input {...form.register("timezone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Controller
              name="low_stock_alert_enabled"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="low-stock-alert"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="low-stock-alert">Habilitar alerta de estoque baixo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label>Limite padrão</Label>
            <Input type="number" step="0.001" {...form.register("low_stock_alert_threshold")} />
            <span>unidades</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL da logo</Label>
            <Input {...form.register("logo_url")} />
            <p className="text-sm text-stone-500 mt-1">Cole a URL da logo (PNG/JPG 400x150px recom)</p>
          </div>
          {form.watch("logo_url") && (
            <div className="flex justify-center p-4 border rounded-xl">
              <img src={form.watch("logo_url")} alt="Logo preview" className="max-h-32 max-w-md object-contain" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações internas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...form.register("notes")} rows={4} placeholder="Notas sobre configurações ou lembretes administrativos..." />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-6">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit">Salvar configurações</Button>
      </div>
    </form>
  );
}

