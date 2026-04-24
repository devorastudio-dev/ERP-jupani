alter table public.products
  add column if not exists show_on_storefront boolean not null default true,
  add column if not exists is_storefront_featured boolean not null default false,
  add column if not exists is_storefront_favorite boolean not null default false;

comment on column public.products.show_on_storefront is 'Define se o produto aparece no site/cardápio público.';
comment on column public.products.is_storefront_featured is 'Controla o bloco de destaques da semana no site público.';
comment on column public.products.is_storefront_favorite is 'Controla o bloco de favoritos da casa no site público.';
