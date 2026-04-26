create table if not exists public.product_pan_shapes (
  code text primary key,
  name text not null,
  estimated_servings numeric(10,2) not null check (estimated_servings > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.product_pan_shapes enable row level security;

drop trigger if exists product_pan_shapes_updated_at on public.product_pan_shapes;

create trigger product_pan_shapes_updated_at
before update on public.product_pan_shapes
for each row execute function public.set_updated_at();

insert into public.product_pan_shapes (code, name, estimated_servings)
values
  ('redonda_com_furo_18', 'Redonda com furo - 18 cm', 14),
  ('redonda_com_furo_22', 'Redonda com furo - 22 cm', 20),
  ('redonda_com_furo_24', 'Redonda com furo - 24 cm', 24),
  ('redonda_reta_15', 'Redonda reta - 15 cm', 12),
  ('redonda_reta_20', 'Redonda reta - 20 cm', 21),
  ('redonda_reta_25', 'Redonda reta - 25 cm', 30),
  ('retangular_pequena', 'Retangular pequena', 15),
  ('retangular_media', 'Retangular média', 25),
  ('retangular_grande', 'Retangular grande', 37.5),
  ('forma_pudim_22', 'Forma pudim - 22 cm', 16)
on conflict (code) do update
set
  name = excluded.name,
  estimated_servings = excluded.estimated_servings,
  updated_at = timezone('utc', now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_pan_shape_code_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_pan_shape_code_fkey
    foreign key (pan_shape_code)
    references public.product_pan_shapes(code)
    on update cascade
    on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_pan_shapes'
      and policyname = 'authenticated read product pan shapes'
  ) then
    execute $policy$
      create policy "authenticated read product pan shapes"
      on public.product_pan_shapes
      for select
      using (auth.role() = 'authenticated')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_pan_shapes'
      and policyname = 'authorized write product pan shapes'
  ) then
    execute $policy$
      create policy "authorized write product pan shapes"
      on public.product_pan_shapes
      for all
      using (public.has_any_role(array['admin', 'gerente']::public.role_slug[]))
      with check (public.has_any_role(array['admin', 'gerente']::public.role_slug[]))
    $policy$;
  end if;
end
$$;
