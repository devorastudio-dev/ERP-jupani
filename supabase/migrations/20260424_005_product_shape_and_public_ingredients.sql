alter table public.products
  add column if not exists pan_shape_code text,
  add column if not exists public_ingredients_text text;

comment on column public.products.pan_shape_code is 'Código do padrão de forma/rendimento usado para estimar porções do produto.';
comment on column public.products.public_ingredients_text is 'Texto manual de ingredientes públicos exibidos no site. Se vazio, usa a ficha técnica.';
