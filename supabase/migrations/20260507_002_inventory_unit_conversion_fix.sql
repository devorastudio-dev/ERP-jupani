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
      select
        ri.ingredient_id,
        i.name as ingredient_name,
        coalesce(
          public.convert_measurement_quantity(ri.quantity, ri.unit, i.unit),
          case
            when public.normalize_measurement_unit(ri.unit) = public.normalize_measurement_unit(i.unit)
              then ri.quantity
            else ri.quantity
          end
        ) * line_item.quantity as consumption,
        i.average_cost
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
      select
        rpi.ingredient_id,
        i.name as ingredient_name,
        coalesce(
          public.convert_measurement_quantity(rpi.quantity, rpi.unit, i.unit),
          case
            when public.normalize_measurement_unit(rpi.unit) = public.normalize_measurement_unit(i.unit)
              then rpi.quantity
            else rpi.quantity
          end
        ) * line_item.quantity as consumption,
        i.average_cost
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

create or replace function public.apply_inventory_for_production(target_order_id uuid, reverse_movement boolean default false)
returns void
language plpgsql
as $$
declare
  line_item record;
  recipe_component record;
  order_sale_id uuid;
begin
  select sale_id into order_sale_id
  from public.production_orders
  where id = target_order_id;

  for line_item in
    select poi.production_order_id, poi.product_id, poi.product_name, poi.quantity, p.fulfillment_type
    from public.production_order_items poi
    left join public.products p on p.id = poi.product_id
    where poi.production_order_id = target_order_id
  loop
    if line_item.fulfillment_type = 'pronta_entrega' or order_sale_id is null then
      for recipe_component in
        select
          ri.ingredient_id,
          i.name as ingredient_name,
          coalesce(
            public.convert_measurement_quantity(ri.quantity, ri.unit, i.unit),
            case
              when public.normalize_measurement_unit(ri.unit) = public.normalize_measurement_unit(i.unit)
                then ri.quantity
              else ri.quantity
            end
          ) * line_item.quantity as consumption,
          i.average_cost
        from public.recipes r
        join public.recipe_items ri on ri.recipe_id = r.id
        join public.ingredients i on i.id = ri.ingredient_id
        where r.product_id = line_item.product_id
      loop
        update public.ingredients
        set stock_quantity = stock_quantity + (
          case when reverse_movement then recipe_component.consumption else -recipe_component.consumption end
        )
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
          case when reverse_movement then 'estorno_producao' else 'producao' end,
          recipe_component.consumption,
          recipe_component.average_cost,
          case when reverse_movement then 'Estorno de ordem de producao' else 'Consumo por ordem de producao finalizada' end,
          'production_order',
          target_order_id
        );
      end loop;
    end if;

    if line_item.fulfillment_type = 'pronta_entrega' then
      update public.products
      set finished_stock_quantity = finished_stock_quantity + (
        case when reverse_movement then -line_item.quantity else line_item.quantity end
      )
      where id = line_item.product_id;

      insert into public.product_stock_movements (
        product_id,
        product_name,
        movement_type,
        quantity,
        reason,
        reference_type,
        reference_id
      )
      values (
        line_item.product_id,
        line_item.product_name,
        case when reverse_movement then 'estorno_producao' else 'producao' end,
        line_item.quantity,
        case when reverse_movement then 'Estorno de entrada de produto acabado' else 'Entrada automatica por ordem de producao finalizada' end,
        'production_order',
        target_order_id
      );
    end if;
  end loop;

  update public.production_orders
  set stock_deducted = not reverse_movement
  where id = target_order_id;
end;
$$;
