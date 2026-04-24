insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Product images are public to view'
  ) then
    execute $policy$
      create policy "Product images are public to view"
      on storage.objects
      for select
      to public
      using (bucket_id = 'product-images')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload product images'
  ) then
    execute $policy$
      create policy "Authenticated users can upload product images"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'product-images')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update product images'
  ) then
    execute $policy$
      create policy "Authenticated users can update product images"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'product-images')
      with check (bucket_id = 'product-images')
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete product images'
  ) then
    execute $policy$
      create policy "Authenticated users can delete product images"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'product-images')
    $policy$;
  end if;
end
$$;
