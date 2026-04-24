alter table public.ingredients
  add column if not exists nutrition_quantity numeric(12,3) not null default 100,
  add column if not exists nutrition_unit text,
  add column if not exists kcal_amount numeric(12,2) not null default 0;

alter table public.products
  add column if not exists serving_reference_quantity numeric(12,3),
  add column if not exists serving_reference_unit text,
  add column if not exists estimated_servings numeric(12,2) not null default 0,
  add column if not exists estimated_kcal_total numeric(12,2) not null default 0,
  add column if not exists estimated_kcal_per_serving numeric(12,2) not null default 0;

alter table public.recipes
  add column if not exists estimated_servings numeric(12,2) not null default 0,
  add column if not exists estimated_kcal_total numeric(12,2) not null default 0,
  add column if not exists estimated_kcal_per_serving numeric(12,2) not null default 0;

update public.ingredients
set nutrition_unit = unit
where nutrition_unit is null;

comment on column public.ingredients.nutrition_quantity is 'Quantidade-base usada para o cálculo nutricional do insumo.';
comment on column public.ingredients.nutrition_unit is 'Unidade-base usada para o cálculo nutricional do insumo.';
comment on column public.ingredients.kcal_amount is 'Quantidade de kcal referente à quantidade-base do insumo.';
comment on column public.products.serving_reference_quantity is 'Quantidade consumida por pessoa usada para estimar rendimento.';
comment on column public.products.serving_reference_unit is 'Unidade consumida por pessoa usada para estimar rendimento.';
comment on column public.products.estimated_servings is 'Rendimento estimado em pessoas com base na ficha técnica e referência de consumo.';
comment on column public.products.estimated_kcal_total is 'Calorias totais estimadas da receita vinculada ao produto.';
comment on column public.products.estimated_kcal_per_serving is 'Calorias estimadas por porção/pessoa.';
comment on column public.recipes.estimated_servings is 'Rendimento estimado em pessoas calculado a partir do produto vinculado.';
comment on column public.recipes.estimated_kcal_total is 'Calorias totais estimadas da ficha técnica.';
comment on column public.recipes.estimated_kcal_per_serving is 'Calorias estimadas por porção/pessoa.';
