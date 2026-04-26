create table if not exists public.sales_order_counters (
  period_code char(4) primary key,
  last_value integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_sales_order_counters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists sales_order_counters_set_updated_at on public.sales_order_counters;

create trigger sales_order_counters_set_updated_at
before update on public.sales_order_counters
for each row
execute function public.touch_sales_order_counters_updated_at();

alter table public.sales
add column if not exists order_code text;

create or replace function public.generate_sale_order_code(p_order_date timestamptz default timezone('utc', now()))
returns text
language plpgsql
as $$
declare
  v_period_code char(4);
  v_next_value integer;
begin
  v_period_code := to_char(coalesce(p_order_date, timezone('utc', now())), 'YYMM');

  insert into public.sales_order_counters (period_code, last_value)
  values (v_period_code, 1)
  on conflict (period_code)
  do update set
    last_value = public.sales_order_counters.last_value + 1,
    updated_at = timezone('utc', now())
  returning last_value into v_next_value;

  return v_period_code || lpad(v_next_value::text, 4, '0');
end;
$$;

create or replace function public.assign_sale_order_code()
returns trigger
language plpgsql
as $$
begin
  if new.order_code is null or btrim(new.order_code) = '' then
    new.order_code := public.generate_sale_order_code(coalesce(new.order_date, timezone('utc', now())));
  end if;

  return new;
end;
$$;

drop trigger if exists sales_assign_order_code on public.sales;

create trigger sales_assign_order_code
before insert on public.sales
for each row
execute function public.assign_sale_order_code();

with ranked_sales as (
  select
    id,
    to_char(coalesce(order_date, created_at, timezone('utc', now())), 'YYMM') as period_code,
    row_number() over (
      partition by to_char(coalesce(order_date, created_at, timezone('utc', now())), 'YYMM')
      order by coalesce(order_date, created_at, timezone('utc', now())), created_at, id
    ) as sequence_number
  from public.sales
)
update public.sales as sales
set order_code = ranked_sales.period_code || lpad(ranked_sales.sequence_number::text, 4, '0')
from ranked_sales
where sales.id = ranked_sales.id
  and (sales.order_code is null or btrim(sales.order_code) = '');

insert into public.sales_order_counters (period_code, last_value)
select
  to_char(coalesce(order_date, created_at, timezone('utc', now())), 'YYMM') as period_code,
  count(*)::integer as last_value
from public.sales
group by 1
on conflict (period_code)
do update set
  last_value = excluded.last_value,
  updated_at = timezone('utc', now());

alter table public.sales
alter column order_code set not null;

create unique index if not exists sales_order_code_key on public.sales (order_code);
