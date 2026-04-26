create table if not exists public.product_category_links (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, category_id)
);

insert into public.product_category_links (product_id, category_id)
select id, category_id
from public.products
where category_id is not null
on conflict (product_id, category_id) do nothing;

alter table public.product_category_links enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_category_links'
      and policyname = 'authenticated read product category links'
  ) then
    execute $policy$
      create policy "authenticated read product category links"
      on public.product_category_links
      for select
      using (auth.role() = 'authenticated')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_category_links'
      and policyname = 'authorized write product category links'
  ) then
    execute $policy$
      create policy "authorized write product category links"
      on public.product_category_links
      for all
      using (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
      with check (public.has_any_role(array['admin', 'gerente', 'estoque']::public.role_slug[]))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_category_links'
      and policyname = 'public storefront read product category links'
  ) then
    execute $policy$
      create policy "public storefront read product category links"
      on public.product_category_links
      for select
      using (true)
    $policy$;
  end if;
end
$$;
