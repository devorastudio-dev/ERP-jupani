create policy "authorized write order history"
on public.order_status_history
for insert
with check (
  public.has_any_role(array['admin', 'gerente', 'caixa', 'producao', 'financeiro']::public.role_slug[])
);
