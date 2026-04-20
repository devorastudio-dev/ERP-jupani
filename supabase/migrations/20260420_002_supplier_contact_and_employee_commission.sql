alter table public.suppliers
  add column if not exists contact_name text;

alter table public.employees
  add column if not exists commission_percentage numeric(5,2);

do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'comissao'
      and enumtypid = 'public.employee_payment_type'::regtype
  ) then
    alter type public.employee_payment_type add value 'comissao';
  end if;
end $$;

comment on column public.employees.commission_percentage is 'Percentual sobre valor liquido das vendas para funcionarios com remuneracao por comissao.';
