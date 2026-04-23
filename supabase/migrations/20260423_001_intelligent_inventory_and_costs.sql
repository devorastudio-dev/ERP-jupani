alter type public.inventory_movement_type add value if not exists 'producao';
alter type public.inventory_movement_type add value if not exists 'estorno_producao';

alter table public.production_orders
add column if not exists stock_deducted boolean not null default false;

create or replace function public.recalculate_recipes_for_ingredient(target_ingredient_id uuid)
returns void
language plpgsql
as $$
declare
  affected_recipe record;
begin
  update public.recipe_items ri
  set calculated_cost = coalesce(i.average_cost, 0) * ri.quantity
  from public.ingredients i
  where i.id = ri.ingredient_id
    and ri.ingredient_id = target_ingredient_id;

  for affected_recipe in
    select distinct recipe_id
    from public.recipe_items
    where ingredient_id = target_ingredient_id
  loop
    perform public.recalculate_recipe_cost(affected_recipe.recipe_id);
  end loop;
end;
$$;

create or replace function public.handle_ingredient_cost_change()
returns trigger
language plpgsql
as $$
begin
  if old.average_cost is distinct from new.average_cost then
    perform public.recalculate_recipes_for_ingredient(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists ingredient_cost_change_trigger on public.ingredients;

create trigger ingredient_cost_change_trigger
after update of average_cost on public.ingredients
for each row execute function public.handle_ingredient_cost_change();

create or replace function public.apply_purchase_receipt(target_purchase_id uuid)
returns void
language plpgsql
as $$
declare
  purchase_line record;
  current_stock numeric(14,3);
  current_average_cost numeric(12,4);
  incoming_quantity numeric(14,3);
  incoming_unit_cost numeric(12,4);
  new_average_cost numeric(12,4);
begin
  for purchase_line in
    select * from public.purchase_items where purchase_id = target_purchase_id
  loop
    select stock_quantity, average_cost
    into current_stock, current_average_cost
    from public.ingredients
    where id = purchase_line.ingredient_id;

    incoming_quantity := coalesce(purchase_line.quantity, 0);
    incoming_unit_cost := coalesce(purchase_line.unit_cost, 0);

    if coalesce(current_stock, 0) + incoming_quantity <= 0 then
      new_average_cost := incoming_unit_cost;
    elsif coalesce(current_stock, 0) <= 0 then
      new_average_cost := incoming_unit_cost;
    else
      new_average_cost := (
        (coalesce(current_stock, 0) * coalesce(current_average_cost, 0))
        + (incoming_quantity * incoming_unit_cost)
      ) / (coalesce(current_stock, 0) + incoming_quantity);
    end if;

    update public.ingredients
    set
      stock_quantity = coalesce(stock_quantity, 0) + incoming_quantity,
      average_cost = round(coalesce(new_average_cost, incoming_unit_cost)::numeric, 4)
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
      incoming_quantity,
      incoming_unit_cost,
      'Entrada automatica por recebimento de compra',
      'purchase',
      target_purchase_id
    );

    perform public.recalculate_recipes_for_ingredient(purchase_line.ingredient_id);
  end loop;
end;
$$;

create or replace function public.handle_purchase_receipt()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('aprovada', 'recebida') and old.status not in ('aprovada', 'recebida') then
    perform public.apply_purchase_receipt(new.id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_purchase_insert()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('aprovada', 'recebida') then
    perform public.apply_purchase_receipt(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists purchase_receipt_trigger on public.purchases;

create trigger purchase_receipt_trigger
after update on public.purchases
for each row execute function public.handle_purchase_receipt();

drop trigger if exists purchase_insert_receipt_trigger on public.purchases;

create trigger purchase_insert_receipt_trigger
after insert on public.purchases
for each row execute function public.handle_purchase_insert();

create or replace function public.handle_sale_insert()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('confirmado', 'em_producao', 'pronto', 'entregue') and new.stock_deducted = false then
    perform public.apply_inventory_for_sale(new.id, false);
  end if;

  return new;
end;
$$;

drop trigger if exists sale_insert_stock_trigger on public.sales;

create trigger sale_insert_stock_trigger
after insert on public.sales
for each row execute function public.handle_sale_insert();

create or replace function public.apply_inventory_for_production(target_order_id uuid, reverse_movement boolean default false)
returns void
language plpgsql
as $$
declare
  line_item record;
  recipe_component record;
  direction numeric := case when reverse_movement then 1 else -1 end;
  movement_kind public.inventory_movement_type := case when reverse_movement then 'estorno_producao' else 'producao' end;
begin
  for line_item in
    select poi.production_order_id, poi.product_id, poi.product_name, poi.quantity
    from public.production_order_items poi
    where poi.production_order_id = target_order_id
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
        case when reverse_movement then 'Estorno de ordem de producao cancelada' else 'Baixa automatica por ordem de producao finalizada' end,
        'production_order',
        target_order_id
      );
    end loop;
  end loop;

  update public.production_orders
  set stock_deducted = not reverse_movement
  where id = target_order_id;
end;
$$;

create or replace function public.handle_production_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'finalizado' and old.stock_deducted = false then
    perform public.apply_inventory_for_production(new.id, false);
  elsif new.status = 'cancelado' and old.stock_deducted = true then
    perform public.apply_inventory_for_production(new.id, true);
  end if;

  return new;
end;
$$;

create or replace function public.handle_production_insert()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'finalizado' and new.stock_deducted = false then
    perform public.apply_inventory_for_production(new.id, false);
  end if;

  return new;
end;
$$;

drop trigger if exists production_status_change_trigger on public.production_orders;

create trigger production_status_change_trigger
after update on public.production_orders
for each row execute function public.handle_production_status_change();

drop trigger if exists production_insert_stock_trigger on public.production_orders;

create trigger production_insert_stock_trigger
after insert on public.production_orders
for each row execute function public.handle_production_insert();
