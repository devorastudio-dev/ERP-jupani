alter table public.products
add column if not exists product_line text not null default 'geral'
  check (product_line in ('geral', 'bolos_aniversario', 'docinhos', 'merendas'));

alter table public.products
add column if not exists order_mode text not null default 'sob_encomenda'
  check (order_mode in ('sob_encomenda', 'pronta_entrega', 'ambos'));

alter table public.products
add column if not exists minimum_order_quantity numeric(12,3),
add column if not exists minimum_order_unit text,
add column if not exists lead_time_hours integer,
add column if not exists accepts_flavor_selection boolean not null default false,
add column if not exists accepts_size_selection boolean not null default false,
add column if not exists accepts_theme_customization boolean not null default false,
add column if not exists accepts_custom_message boolean not null default false,
add column if not exists accepts_event_date boolean not null default false,
add column if not exists accepts_serving_count boolean not null default false,
add column if not exists accepts_variant_notes boolean not null default false,
add column if not exists requires_manual_quote boolean not null default false,
add column if not exists order_guidelines text,
add column if not exists storefront_section_title text,
add column if not exists storefront_badge_text text;

alter table public.sale_items
add column if not exists configuration_json jsonb;

drop function if exists public.create_storefront_order(
  text,
  text,
  text,
  text,
  text,
  text,
  public.sale_status,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  public.fiscal_status,
  text,
  jsonb
);

create or replace function public.create_storefront_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_whatsapp text,
  p_customer_notes text,
  p_sale_type text,
  p_order_type text,
  p_status public.sale_status,
  p_subtotal_amount numeric,
  p_discount_amount numeric,
  p_delivery_fee numeric,
  p_total_amount numeric,
  p_paid_amount numeric,
  p_pending_amount numeric,
  p_payment_method text,
  p_notes text,
  p_internal_notes text,
  p_fiscal_status public.fiscal_status,
  p_external_reference text,
  p_items jsonb
)
returns table (
  id uuid,
  order_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Pedido sem itens.';
  end if;

  select customers.id
  into v_customer_id
  from public.customers
  where phone = p_customer_phone
  limit 1;

  if v_customer_id is not null then
    update public.customers
    set
      name = p_customer_name,
      whatsapp = p_customer_whatsapp,
      notes = p_customer_notes
    where customers.id = v_customer_id;
  else
    insert into public.customers (
      name,
      phone,
      whatsapp,
      notes
    )
    values (
      p_customer_name,
      p_customer_phone,
      p_customer_whatsapp,
      p_customer_notes
    )
    returning customers.id into v_customer_id;
  end if;

  insert into public.sales (
    customer_id,
    customer_name,
    phone,
    sale_type,
    order_type,
    status,
    subtotal_amount,
    discount_amount,
    delivery_fee,
    total_amount,
    paid_amount,
    pending_amount,
    payment_method,
    notes,
    internal_notes,
    fiscal_status,
    external_reference
  )
  values (
    v_customer_id,
    p_customer_name,
    p_customer_phone,
    p_sale_type,
    p_order_type,
    p_status,
    p_subtotal_amount,
    p_discount_amount,
    p_delivery_fee,
    p_total_amount,
    p_paid_amount,
    p_pending_amount,
    p_payment_method,
    p_notes,
    p_internal_notes,
    p_fiscal_status,
    p_external_reference
  )
  returning sales.id, sales.order_code into id, order_code;

  insert into public.sale_items (
    sale_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    discount_amount,
    total_price,
    notes,
    configuration_json
  )
  select
    id,
    item.product_id,
    item.product_name,
    item.quantity,
    item.unit_price,
    item.discount_amount,
    item.total_price,
    item.notes,
    item.configuration_json
  from jsonb_to_recordset(p_items) as item(
    product_id uuid,
    product_name text,
    quantity numeric,
    unit_price numeric,
    discount_amount numeric,
    total_price numeric,
    notes text,
    configuration_json jsonb
  );

  insert into public.order_status_history (
    sale_id,
    old_status,
    new_status,
    notes
  )
  values (
    id,
    null,
    p_status,
    'Pedido criado pelo site público'
  );

  return query
  select create_storefront_order.id, create_storefront_order.order_code;
end;
$$;

revoke all on function public.create_storefront_order(
  text,
  text,
  text,
  text,
  text,
  text,
  public.sale_status,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  public.fiscal_status,
  text,
  jsonb
) from public;

grant execute on function public.create_storefront_order(
  text,
  text,
  text,
  text,
  text,
  text,
  public.sale_status,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  public.fiscal_status,
  text,
  jsonb
) to anon, authenticated;
