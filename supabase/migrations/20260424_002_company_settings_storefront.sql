alter table public.company_settings
  add column if not exists instagram_handle text,
  add column if not exists site_tagline text,
  add column if not exists site_hero_title text,
  add column if not exists site_hero_description text,
  add column if not exists site_business_hours text,
  add column if not exists site_delivery_city text,
  add column if not exists site_delivery_note text,
  add column if not exists site_about_title text,
  add column if not exists site_about_text_1 text,
  add column if not exists site_about_text_2 text,
  add column if not exists site_meta_description text,
  add column if not exists site_footer_note text;

comment on column public.company_settings.instagram_handle is 'Usuário do Instagram exibido no site.';
comment on column public.company_settings.site_tagline is 'Texto curto exibido no cabeçalho/rodapé do site.';
comment on column public.company_settings.site_hero_title is 'Título principal da home do site.';
comment on column public.company_settings.site_hero_description is 'Descrição principal da home do site.';
