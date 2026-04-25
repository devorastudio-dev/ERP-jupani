alter table public.products
  add column if not exists is_storefront_healthy boolean not null default false;

comment on column public.products.is_storefront_healthy is 'Controla o destaque de produtos saudáveis/fitness no site público.';
