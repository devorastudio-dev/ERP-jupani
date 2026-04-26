alter table public.products
add column if not exists is_storefront_lactose_free boolean not null default false,
add column if not exists is_storefront_gluten_free boolean not null default false;

comment on column public.products.is_storefront_lactose_free is 'Destaca produtos sem lactose na vitrine pública.';
comment on column public.products.is_storefront_gluten_free is 'Destaca produtos sem glúten na vitrine pública.';

create table if not exists public.recipe_packaging_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  unit text not null,
  quantity numeric(14,3) not null,
  calculated_cost numeric(12,4) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (recipe_id, ingredient_id)
);

alter table public.recipe_packaging_items enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recipe_packaging_items'
      and policyname = 'authenticated read recipe packaging items'
  ) then
    execute $policy$
      create policy "authenticated read recipe packaging items"
      on public.recipe_packaging_items
      for select
      using (auth.role() = 'authenticated')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recipe_packaging_items'
      and policyname = 'authorized write recipe packaging items'
  ) then
    execute $policy$
      create policy "authorized write recipe packaging items"
      on public.recipe_packaging_items
      for all
      using (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]))
      with check (public.has_any_role(array['admin', 'gerente', 'estoque', 'producao']::public.role_slug[]))
    $policy$;
  end if;
end
$$;

create or replace function public.recalculate_recipe_cost(target_recipe_id uuid)
returns void
language plpgsql
as $$
declare
  base_cost numeric(12,2);
begin
  select
    coalesce(sum(item_cost), 0) + packaging_cost + additional_cost
  into base_cost
  from (
    select r.packaging_cost, r.additional_cost, ri.calculated_cost as item_cost
    from public.recipes r
    left join public.recipe_items ri on ri.recipe_id = r.id
    where r.id = target_recipe_id
    union all
    select r.packaging_cost, r.additional_cost, rpi.calculated_cost as item_cost
    from public.recipes r
    left join public.recipe_packaging_items rpi on rpi.recipe_id = r.id
    where r.id = target_recipe_id
  ) as costs
  group by packaging_cost, additional_cost;

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

create or replace function public.set_recipe_packaging_item_cost()
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

drop trigger if exists recipe_packaging_item_cost_trigger on public.recipe_packaging_items;

create trigger recipe_packaging_item_cost_trigger
before insert or update on public.recipe_packaging_items
for each row execute function public.set_recipe_packaging_item_cost();

create or replace function public.refresh_recipe_packaging_cost_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.recalculate_recipe_cost(coalesce(new.recipe_id, old.recipe_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists recipe_packaging_cost_refresh_after_item_change on public.recipe_packaging_items;

create trigger recipe_packaging_cost_refresh_after_item_change
after insert or update or delete on public.recipe_packaging_items
for each row execute function public.refresh_recipe_packaging_cost_trigger();

create or replace function public.apply_inventory_for_sale(target_sale_id uuid, reverse_movement boolean default false)
returns void
language plpgsql
as $$
declare
  line_item record;
  recipe_component record;
  packaging_component record;
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

    for packaging_component in
      select rpi.ingredient_id, i.name as ingredient_name, rpi.quantity * line_item.quantity as consumption, i.average_cost
      from public.recipes r
      join public.recipe_packaging_items rpi on rpi.recipe_id = r.id
      join public.ingredients i on i.id = rpi.ingredient_id
      where r.product_id = line_item.product_id
    loop
      update public.ingredients
      set stock_quantity = stock_quantity + (direction * packaging_component.consumption)
      where id = packaging_component.ingredient_id;

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
        packaging_component.ingredient_id,
        packaging_component.ingredient_name,
        movement_kind,
        packaging_component.consumption,
        packaging_component.average_cost,
        case when reverse_movement then 'Estorno de embalagem de pedido cancelado' else 'Baixa automatica de embalagem por venda confirmada' end,
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
