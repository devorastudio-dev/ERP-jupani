do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_categories'
      and policyname = 'public storefront read product categories'
  ) then
    execute $policy$
      create policy "public storefront read product categories"
      on public.product_categories
      for select
      using (true)
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'public storefront read products'
  ) then
    execute $policy$
      create policy "public storefront read products"
      on public.products
      for select
      using (is_active = true and show_on_storefront = true)
    $policy$;
  end if;
end
$$;
