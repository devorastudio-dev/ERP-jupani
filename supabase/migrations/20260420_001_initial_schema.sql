create extension if not exists "pgcrypto";

create type public.role_slug as enum ('admin', 'gerente', 'caixa', 'producao', 'estoque', 'financeiro');
create type public.sale_status as enum ('orcamento', 'aguardando_confirmacao', 'confirmado', 'em_producao', 'pronto', 'entregue', 'cancelado');
create type public.payment_status as enum ('pendente', 'parcial', 'pago', 'cancelado');
create type public.cash_session_status as enum ('aberto', 'fechado', 'cancelado');
create type public.cash_movement_type as enum ('entrada', 'saida', 'sangria', 'reforco');
create type public.purchase_status as enum ('rascunho', 'aprovada', 'recebida', 'cancelada');
create type public.production_status as enum ('pendente', 'em_producao', 'finalizado', 'cancelado');
create type public.remuneration_type as enum ('fixo', 'diaria', 'comissao', 'freelancer');
create type public.employee_payment_type as enum ('salario', 'adiantamento', 'desconto', 'bonus', 'pagamento_realizado');
create type public.inventory_movement_type as enum ('entrada_manual', 'saida_manual', 'ajuste', 'inventario', 'perda', 'desperdicio', 'compra', 'venda', 'estorno_venda');
create type public.fiscal_status as enum ('nao_emitido', 'pendente', 'emitido', 'cancelado', 'erro');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug public.role_slug not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text,
  sale_price numeric(12,2) not null default 0,
  estimated_cost numeric(12,2) not null default 0,
  photo_path text,
  yield_quantity numeric(12,3) not null default 1,
  unit text not null,
  notes text,
  fulfillment_type text not null check (fulfillment_type in ('sob_encomenda', 'pronta_entrega')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.ingredient_categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  name text not null,
  unit text not null,
  stock_quantity numeric(14,3) not null default 0,
  minimum_stock numeric(14,3) not null default 0,
  average_cost numeric(12,4) not null default 0,
  expiration_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  product_name text not null,
  packaging_cost numeric(12,2) not null default 0,
  additional_cost numeric(12,2) not null default 0,
  theoretical_cost numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  unit text not null,
  quantity numeric(14,3) not null,
  calculated_cost numeric(12,4) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (recipe_id, ingredient_id)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  phone text,
  sale_type text not null check (sale_type in ('balcao', 'encomenda')),
  order_type text not null check (order_type in ('retirada', 'entrega')),
  order_date timestamptz not null default timezone('utc', now()),
  delivery_date timestamptz,
  status public.sale_status not null default 'orcamento',
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  pending_amount numeric(12,2) not null default 0,
  payment_method text,
  notes text,
  internal_notes text,
  stock_deducted boolean not null default false,
  fiscal_status public.fiscal_status not null default 'nao_emitido',
  external_reference text,
  document_number text,
  issue_date timestamptz,
  xml_url text,
  pdf_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on column public.sales.external_reference is 'Reservado para integração futura com provedores fiscais ou ERP externo.';
comment on column public.sales.xml_url is 'URL opcional de XML fiscal futuro.';
comment on column public.sales.pdf_url is 'URL opcional de DANFE/PDF fiscal futuro.';

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  payment_date timestamptz not null default timezone('utc', now()),
  amount numeric(12,2) not null,
  payment_method text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  old_status public.sale_status,
  new_status public.sale_status not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('entrada', 'saida')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references public.profiles(id) on delete set null,
  closed_by uuid references public.profiles(id) on delete set null,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  opening_balance numeric(12,2) not null default 0,
  closing_balance numeric(12,2),
  expected_balance numeric(12,2),
  notes text,
  status public.cash_session_status not null default 'aberto',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  category_id uuid references public.financial_categories(id) on delete set null,
  category_name text,
  movement_type public.cash_movement_type not null,
  amount numeric(12,2) not null,
  description text not null,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text not null,
  purchase_date date not null default current_date,
  status public.purchase_status not null default 'rascunho',
  payment_method text,
  subtotal_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  notes text,
  generate_payable boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  ingredient_name text not null,
  quantity numeric(14,3) not null,
  unit_cost numeric(12,4) not null,
  total_cost numeric(12,2) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date not null,
  status public.payment_status not null default 'pendente',
  origin text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  received_amount numeric(12,2) not null default 0,
  due_date date not null,
  status public.payment_status not null default 'pendente',
  origin text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete set null,
  ingredient_name text,
  movement_type public.inventory_movement_type not null,
  quantity numeric(14,3) not null,
  unit_cost numeric(12,4),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete set null,
  responsible_employee_id uuid,
  deadline timestamptz,
  status public.production_status not null default 'pendente',
  notes text,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.production_order_items (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3) not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  role_name text not null,
  salary_base numeric(12,2),
  remuneration_type public.remuneration_type not null,
  is_active boolean not null default true,
  phone text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.employee_payments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_name text not null,
  payment_type public.employee_payment_type not null,
  amount numeric(12,2) not null,
  payment_date date not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete set null,
  document_type text not null,
  status public.fiscal_status not null default 'pendente',
  external_reference text,
  document_number text,
  issue_date timestamptz,
  xml_url text,
  pdf_url text,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.fiscal_documents is 'Tabela reservada para acoplar emissao fiscal futura sem alterar o fluxo principal de vendas.';

create table public.fiscal_document_items (
  id uuid primary key default gen_random_uuid(),
  fiscal_document_id uuid not null references public.fiscal_documents(id) on delete cascade,
  sale_item_id uuid references public.sale_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.fiscal_events (
  id uuid primary key default gen_random_uuid(),
  fiscal_document_id uuid not null references public.fiscal_documents(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_user_roles()
returns public.role_slug[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.slug), '{}'::public.role_slug[])
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();
$$;

create or replace function public.has_role(required_role public.role_slug)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select required_role = any(public.current_user_roles());
$$;

create or replace function public.has_any_role(required_roles public.role_slug[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from unnest(public.current_user_roles()) as role
    where role = any(required_roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.recalculate_recipe_cost(target_recipe_id uuid)
returns void
language plpgsql
as $$
declare
  base_cost numeric(12,2);
begin
  select
    coalesce(sum(calculated_cost), 0) + packaging_cost + additional_cost
  into base_cost
  from public.recipes r
  left join public.recipe_items ri on ri.recipe_id = r.id
  where r.id = target_recipe_id
  group by r.packaging_cost, r.additional_cost;

  update public.recipes
  set theoretical_cost = coalesce(base_cost, 0)
  where id = target_recipe_id;

  update public.products p
  set estimated_cost = r.theoretical_cost
  from public.recipes r
  where r.product_id = p.id
    and r.id = target_recipe_id;
end;
$$;

create or replace function public.set_recipe_item_cost()
returns trigger
language plpgsql
as $$
declare
  current_avg_cost numeric(12,4);
begin
  select average_cost into current_avg_cost
  from public.ingredients
  where id = new.ingredient_id;

  new.calculated_cost = coalesce(current_avg_cost, 0) * new.quantity;
  return new;
end;
$$;

create trigger recipe_item_cost_trigger
before insert or update on public.recipe_items
for each row execute function public.set_recipe_item_cost();

create or replace function public.refresh_recipe_cost_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.recalculate_recipe_cost(coalesce(new.recipe_id, old.recipe_id));
  return coalesce(new, old);
end;
$$;

create trigger recipe_cost_refresh_after_item_change
after insert or update or delete on public.recipe_items
for each row execute function public.refresh_recipe_cost_trigger();

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger ingredients_updated_at before update on public.ingredients for each row execute function public.set_updated_at();
create trigger recipes_updated_at before update on public.recipes for each row execute function public.set_updated_at();
create trigger sales_updated_at before update on public.sales for each row execute function public.set_updated_at();
create trigger cash_sessions_updated_at before update on public.cash_sessions for each row execute function public.set_updated_at();
create trigger purchases_updated_at before update on public.purchases for each row execute function public.set_updated_at();
create trigger accounts_payable_updated_at before update on public.accounts_payable for each row execute function public.set_updated_at();
create trigger accounts_receivable_updated_at before update on public.accounts_receivable for each row execute function public.set_updated_at();
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
create trigger production_orders_updated_at before update on public.production_orders for each row execute function public.set_updated_at();
create trigger fiscal_documents_updated_at before update on public.fiscal_documents for each row execute function public.set_updated_at();

create or replace function public.apply_inventory_for_sale(target_sale_id uuid, reverse_movement boolean default false)
returns void
language plpgsql
as $$
declare
  line_item record;
  recipe_component record;
  direction numeric := case when reverse_movement then 1 else -1 end;
  movement_kind public.inventory_movement_type := case when reverse_movement then 'estorno_venda' else 'venda' end;
begin
  for line_item in
    select si.sale_id, si.product_id, si.product_name, si.quantity
    from public.sale_items si
    where si.sale_id = target_sale_id
  loop
    for recipe_component in
      select ri.ingredient_id, i.name as ingredient_name, ri.quantity * line_item.quantity as consumption, i.average_cost
      from public.recipes r
      join public.recipe_items ri on ri.recipe_id = r.id
      join public.ingredients i on i.id = ri.ingredient_id
      where r.product_id = line_item.product_id
    loop
      update public.ingredients
      set stock_quantity = stock_quantity + (direction * recipe_component.consumption)
      where id = recipe_component.ingredient_id;

      insert into public.inventory_movements (
        ingredient_id,
        ingredient_name,
        movement_type,
        quantity,
        unit_cost,
        reason,
        reference_type,
        reference_id
      )
      values (
        recipe_component.ingredient_id,
        recipe_component.ingredient_name,
        movement_kind,
        recipe_component.consumption,
        recipe_component.average_cost,
        case when reverse_movement then 'Estorno de pedido cancelado' else 'Baixa automatica por venda confirmada' end,
        'sale',
        target_sale_id
      );
    end loop;
  end loop;

  update public.sales
  set stock_deducted = not reverse_movement
  where id = target_sale_id;
end;
$$;

create or replace function public.handle_sale_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('confirmado', 'em_producao', 'pronto', 'entregue') and old.stock_deducted = false then
    perform public.apply_inventory_for_sale(new.id, false);
  elsif new.status = 'cancelado' and old.stock_deducted = true then
    perform public.apply_inventory_for_sale(new.id, true);
  end if;

  if old.status is distinct from new.status then
    insert into public.order_status_history (sale_id, old_status, new_status, created_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

create trigger sale_status_change_trigger
after update on public.sales
for each row execute function public.handle_sale_status_change();

create or replace function public.handle_sale_payment()
returns trigger
language plpgsql
as $$
begin
  update public.sales
  set
    paid_amount = coalesce((select sum(amount) from public.sale_payments where sale_id = new.sale_id), 0),
    pending_amount = total_amount - coalesce((select sum(amount) from public.sale_payments where sale_id = new.sale_id), 0)
  where id = new.sale_id;

  update public.accounts_receivable
  set
    received_amount = coalesce((select paid_amount from public.sales where id = new.sale_id), 0),
    status = case
      when (select pending_amount from public.sales where id = new.sale_id) <= 0 then 'pago'
      when (select paid_amount from public.sales where id = new.sale_id) > 0 then 'parcial'
      else status
    end
  where sale_id = new.sale_id;

  return new;
end;
$$;

create trigger sale_payment_trigger
after insert on public.sale_payments
for each row execute function public.handle_sale_payment();

create or replace function public.handle_purchase_receipt()
returns trigger
language plpgsql
as $$
declare
  purchase_line record;
begin
  if new.status in ('aprovada', 'recebida') and old.status not in ('aprovada', 'recebida') then
    for purchase_line in
      select * from public.purchase_items where purchase_id = new.id
    loop
      update public.ingredients
      set
        stock_quantity = stock_quantity + purchase_line.quantity,
        average_cost = purchase_line.unit_cost
      where id = purchase_line.ingredient_id;

      insert into public.inventory_movements (
        ingredient_id,
        ingredient_name,
        movement_type,
        quantity,
        unit_cost,
        reason,
        reference_type,
        reference_id
      )
      values (
        purchase_line.ingredient_id,
        purchase_line.ingredient_name,
        'compra',
        purchase_line.quantity,
        purchase_line.unit_cost,
        'Entrada automatica por compra aprovada',
        'purchase',
        new.id
      );
    end loop;
  end if;

  return new;
end;
$$;

create trigger purchase_receipt_trigger
after update on public.purchases
for each row execute function public.handle_purchase_receipt();

create or replace function public.log_audit()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, payload)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old))
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_sales after insert or update or delete on public.sales for each row execute function public.log_audit();
create trigger audit_cash after insert or update or delete on public.cash_movements for each row execute function public.log_audit();
create trigger audit_purchases after insert or update or delete on public.purchases for each row execute function public.log_audit();
create trigger audit_employees after insert or update or delete on public.employees for each row execute function public.log_audit();

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.ingredient_categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.financial_categories enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.accounts_payable enable row level security;
alter table public.accounts_receivable enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_order_items enable row level security;
alter table public.employees enable row level security;
alter table public.employee_payments enable row level security;
alter table public.fiscal_documents enable row level security;
alter table public.fiscal_document_items enable row level security;
alter table public.fiscal_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles self or manager read" on public.profiles
for select using (auth.uid() = id or public.has_any_role(array['admin', 'gerente', 'financeiro']::public.role_slug[]));

create policy "profiles self update" on public.profiles
for update using (auth.uid() = id or public.has_role('admin'));

create policy "admins manage roles" on public.roles
for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "authenticated read roles" on public.roles
for select using (auth.role() = 'authenticated');

create policy "admins manage user roles" on public.user_roles
for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "users read own roles" on public.user_roles
for select using (auth.uid() = user_id or public.has_role('admin'));

create policy "authenticated read master data" on public.customers
for select using (auth.role() = 'authenticated');
create policy "managerial write customers" on public.customers
for all using (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]));

create policy "authenticated read suppliers" on public.suppliers
for select using (auth.role() = 'authenticated');
create policy "authorized write suppliers" on public.suppliers
for all using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));

create policy "authenticated read product categories" on public.product_categories for select using (auth.role() = 'authenticated');
create policy "admins managers manage product categories" on public.product_categories
for all using (public.has_any_role(array['admin', 'gerente']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente']::public.role_slug[]));

create policy "authenticated read products" on public.products for select using (auth.role() = 'authenticated');
create policy "authorized write products" on public.products
for all using (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]));

create policy "authenticated read ingredient categories" on public.ingredient_categories for select using (auth.role() = 'authenticated');
create policy "authorized manage ingredient categories" on public.ingredient_categories
for all using (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]));

create policy "authenticated read ingredients" on public.ingredients for select using (auth.role() = 'authenticated');
create policy "authorized write ingredients" on public.ingredients
for all using (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]));

create policy "authenticated read recipes" on public.recipes for select using (auth.role() = 'authenticated');
create policy "authorized write recipes" on public.recipes
for all using (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]));

create policy "authenticated read recipe items" on public.recipe_items for select using (auth.role() = 'authenticated');
create policy "authorized write recipe items" on public.recipe_items
for all using (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]));

create policy "authorized read sales" on public.sales
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'producao', 'financeiro']::public.role_slug[]));
create policy "authorized write sales" on public.sales
for all using (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]));

create policy "authorized read sale items" on public.sale_items
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'producao', 'financeiro']::public.role_slug[]));
create policy "authorized write sale items" on public.sale_items
for all using (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa']::public.role_slug[]));

create policy "authorized read sale payments" on public.sale_payments
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));
create policy "authorized write sale payments" on public.sale_payments
for all using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));

create policy "authorized read order history" on public.order_status_history
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'producao', 'financeiro']::public.role_slug[]));

create policy "authenticated read financial categories" on public.financial_categories
for select using (auth.role() = 'authenticated');
create policy "admin financeiro manage financial categories" on public.financial_categories
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));

create policy "authorized read cash sessions" on public.cash_sessions
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));
create policy "authorized write cash sessions" on public.cash_sessions
for all using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));

create policy "authorized read cash movements" on public.cash_movements
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));
create policy "authorized write cash movements" on public.cash_movements
for all using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));

create policy "authorized read purchases" on public.purchases
for select using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));
create policy "authorized write purchases" on public.purchases
for all using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));

create policy "authorized read purchase items" on public.purchase_items
for select using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));
create policy "authorized write purchase items" on public.purchase_items
for all using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));

create policy "authorized read accounts payable" on public.accounts_payable
for select using (public.has_any_role(array['admin', 'gerente', 'financeiro']::public.role_slug[]));
create policy "authorized write accounts payable" on public.accounts_payable
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));

create policy "authorized read accounts receivable" on public.accounts_receivable
for select using (public.has_any_role(array['admin', 'gerente', 'caixa', 'financeiro']::public.role_slug[]));
create policy "authorized write accounts receivable" on public.accounts_receivable
for all using (public.has_any_role(array['admin', 'caixa', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'caixa', 'financeiro']::public.role_slug[]));

create policy "authorized read inventory movements" on public.inventory_movements
for select using (public.has_any_role(array['admin', 'gerente', 'estoque', 'financeiro']::public.role_slug[]));
create policy "authorized write inventory movements" on public.inventory_movements
for all using (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]));

create policy "authorized read production orders" on public.production_orders
for select using (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]));
create policy "authorized write production orders" on public.production_orders
for all using (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]));

create policy "authorized read production order items" on public.production_order_items
for select using (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]));
create policy "authorized write production order items" on public.production_order_items
for all using (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'gerente', 'producao']::public.role_slug[]));

create policy "authorized read employees restricted" on public.employees
for select using (public.has_any_role(array['admin', 'gerente', 'financeiro']::public.role_slug[]));
create policy "authorized write employees restricted" on public.employees
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));

create policy "authorized read employee payments restricted" on public.employee_payments
for select using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));
create policy "authorized write employee payments restricted" on public.employee_payments
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));

create policy "admin financial fiscal docs" on public.fiscal_documents
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));
create policy "admin financial fiscal doc items" on public.fiscal_document_items
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));
create policy "admin financial fiscal events" on public.fiscal_events
for all using (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]))
with check (public.has_any_role(array['admin', 'financeiro']::public.role_slug[]));

create policy "admin only audit logs" on public.audit_logs
for select using (public.has_role('admin'));
