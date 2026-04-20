-- Add contact_name to suppliers (mismatch)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_name text;

-- Company settings table (single record)
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  trade_name text,
  phone text,
  whatsapp text,
  email text,
  logo_url text,
  address text,
  city text,
  state text,
  zip_code text,
  default_currency text NOT NULL DEFAULT 'BRL',
  default_locale text NOT NULL DEFAULT 'pt-BR',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  order_prefix text DEFAULT 'PED',
  low_stock_alert_enabled boolean NOT NULL DEFAULT true,
  low_stock_alert_threshold numeric(14,3) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at (already exists)
CREATE TRIGGER IF NOT EXISTS company_settings_updated_at 
BEFORE UPDATE ON public.company_settings 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS for admin only
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read company settings" ON public.company_settings FOR SELECT USING (public.has_role('admin'::public.role_slug));
CREATE POLICY "Admin write company settings" ON public.company_settings FOR ALL USING (public.has_role('admin'::public.role_slug)) WITH CHECK (public.has_role('admin'::public.role_slug));

-- Single record constraint (app level upsert)
COMMENT ON TABLE public.company_settings IS 'Configurações globais do sistema (1 registro apenas)';

