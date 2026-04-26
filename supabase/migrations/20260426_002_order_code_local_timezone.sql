create or replace function public.generate_sale_order_code(p_order_date timestamptz default timezone('utc', now()))
returns text
language plpgsql
as $$
declare
  v_period_code char(4);
  v_next_value integer;
begin
  v_period_code := to_char(
    timezone('America/Sao_Paulo', coalesce(p_order_date, timezone('utc', now()))),
    'YYMM'
  );

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
