alter table public.purchase_items
add column if not exists purchase_unit text;

update public.purchase_items pi
set purchase_unit = i.unit
from public.ingredients i
where i.id = pi.ingredient_id
  and (pi.purchase_unit is null or btrim(pi.purchase_unit) = '');

create or replace function public.normalize_measurement_unit(unit_value text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text := lower(trim(coalesce(unit_value, '')));
begin
  normalized := replace(normalized, '.', '');
  normalized := replace(normalized, ' ', '');

  case normalized
    when 'quilo' then return 'kg';
    when 'quilos' then return 'kg';
    when 'quilograma' then return 'kg';
    when 'quilogramas' then return 'kg';
    when 'kilo' then return 'kg';
    when 'kilos' then return 'kg';
    when 'grama' then return 'g';
    when 'gramas' then return 'g';
    when 'litro' then return 'l';
    when 'litros' then return 'l';
    when 'mililitro' then return 'ml';
    when 'mililitros' then return 'ml';
    when 'unidade' then return 'un';
    when 'unidades' then return 'un';
    when 'und' then return 'un';
    when 'dz' then return 'duzia';
    when 'dúzia' then return 'duzia';
    when 'duzia' then return 'duzia';
    else return normalized;
  end case;
end;
$$;

create or replace function public.measurement_unit_group(unit_value text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text := public.normalize_measurement_unit(unit_value);
begin
  case normalized
    when 'mg', 'g', 'kg' then return 'weight';
    when 'ml', 'l' then return 'volume';
    when 'un', 'duzia' then return 'count';
    else return null;
  end case;
end;
$$;

create or replace function public.measurement_unit_factor(unit_value text)
returns numeric
language plpgsql
immutable
as $$
declare
  normalized text := public.normalize_measurement_unit(unit_value);
begin
  case normalized
    when 'mg' then return 0.001;
    when 'g' then return 1;
    when 'kg' then return 1000;
    when 'ml' then return 1;
    when 'l' then return 1000;
    when 'un' then return 1;
    when 'duzia' then return 12;
    else return null;
  end case;
end;
$$;

create or replace function public.convert_measurement_quantity(quantity_value numeric, from_unit text, to_unit text)
returns numeric
language plpgsql
immutable
as $$
declare
  from_group text := public.measurement_unit_group(from_unit);
  to_group text := public.measurement_unit_group(to_unit);
  from_factor numeric := public.measurement_unit_factor(from_unit);
  to_factor numeric := public.measurement_unit_factor(to_unit);
begin
  if from_group is null or to_group is null or from_group <> to_group then
    return null;
  end if;

  return (coalesce(quantity_value, 0) * from_factor) / nullif(to_factor, 0);
end;
$$;

create or replace function public.convert_measurement_unit_cost(unit_cost_value numeric, from_unit text, to_unit text)
returns numeric
language plpgsql
immutable
as $$
declare
  converted_unit_quantity numeric := public.convert_measurement_quantity(1, from_unit, to_unit);
begin
  if converted_unit_quantity is null or converted_unit_quantity = 0 then
    return null;
  end if;

  return coalesce(unit_cost_value, 0) / converted_unit_quantity;
end;
$$;

create or replace function public.set_recipe_item_cost()
returns trigger
language plpgsql
as $$
declare
  ingredient_unit text;
  current_avg_cost numeric(12,4);
  converted_quantity numeric(14,3);
begin
  select unit, average_cost
  into ingredient_unit, current_avg_cost
  from public.ingredients
  where id = new.ingredient_id;

  converted_quantity := public.convert_measurement_quantity(new.quantity, new.unit, ingredient_unit);

  if converted_quantity is null then
    if public.normalize_measurement_unit(new.unit) = public.normalize_measurement_unit(ingredient_unit) then
      converted_quantity := new.quantity;
    else
      raise exception 'Unidade incompatível para o insumo. Receita: %, insumo base: %', new.unit, ingredient_unit;
    end if;
  end if;

  new.calculated_cost = round((coalesce(current_avg_cost, 0) * coalesce(converted_quantity, 0))::numeric, 4);
  return new;
end;
$$;

create or replace function public.recalculate_recipes_for_ingredient(target_ingredient_id uuid)
returns void
language plpgsql
as $$
declare
  affected_recipe record;
begin
  update public.recipe_items ri
  set calculated_cost = round((
    coalesce(i.average_cost, 0) * coalesce(
      public.convert_measurement_quantity(ri.quantity, ri.unit, i.unit),
      case
        when public.normalize_measurement_unit(ri.unit) = public.normalize_measurement_unit(i.unit)
          then ri.quantity
        else 0
      end
    )
  )::numeric, 4)
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

create or replace function public.apply_purchase_receipt(target_purchase_id uuid)
returns void
language plpgsql
as $$
declare
  purchase_line record;
  current_stock numeric(14,3);
  current_average_cost numeric(12,4);
  ingredient_unit text;
  source_purchase_unit text;
  incoming_quantity numeric(14,3);
  incoming_unit_cost numeric(12,4);
  new_average_cost numeric(12,4);
begin
  for purchase_line in
    select * from public.purchase_items where purchase_id = target_purchase_id
  loop
    select stock_quantity, average_cost, unit
    into current_stock, current_average_cost, ingredient_unit
    from public.ingredients
    where id = purchase_line.ingredient_id;

    source_purchase_unit := coalesce(nullif(btrim(purchase_line.purchase_unit), ''), ingredient_unit);

    incoming_quantity := public.convert_measurement_quantity(
      coalesce(purchase_line.quantity, 0),
      source_purchase_unit,
      ingredient_unit
    );

    incoming_unit_cost := public.convert_measurement_unit_cost(
      coalesce(purchase_line.unit_cost, 0),
      source_purchase_unit,
      ingredient_unit
    );

    if incoming_quantity is null or incoming_unit_cost is null then
      if public.normalize_measurement_unit(source_purchase_unit) = public.normalize_measurement_unit(ingredient_unit) then
        incoming_quantity := coalesce(purchase_line.quantity, 0);
        incoming_unit_cost := coalesce(purchase_line.unit_cost, 0);
      else
        raise exception 'Unidade de compra incompatível para o insumo %: compra %, estoque %',
          coalesce(purchase_line.ingredient_name, purchase_line.ingredient_id::text),
          source_purchase_unit,
          ingredient_unit;
      end if;
    end if;

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
