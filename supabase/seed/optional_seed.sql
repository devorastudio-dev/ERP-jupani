insert into public.roles (slug, name, description)
values
  ('admin', 'Administrador', 'Acesso total ao sistema'),
  ('gerente', 'Gerente', 'Gestao geral da operacao'),
  ('caixa', 'Caixa', 'Vendas, recebimentos e caixa'),
  ('producao', 'Producao', 'Pedidos e ordens de producao'),
  ('estoque', 'Estoque', 'Compras, insumos e inventario'),
  ('financeiro', 'Financeiro', 'Caixa, contas, relatorios e funcionarios')
on conflict (slug) do nothing;

insert into public.financial_categories (name, kind)
values
  ('Venda', 'entrada'),
  ('Compra', 'saida'),
  ('Despesa fixa', 'saida'),
  ('Despesa variavel', 'saida'),
  ('Salario', 'saida'),
  ('Adiantamento', 'saida'),
  ('Retirada', 'saida'),
  ('Ajuste', 'entrada'),
  ('Outros', 'saida')
on conflict (name) do nothing;

insert into public.product_categories (name)
values ('Bolos'), ('Doces'), ('Salgados'), ('Bebidas')
on conflict (name) do nothing;

insert into public.ingredient_categories (name)
values ('Laticinios'), ('Secos'), ('Embalagens'), ('Coberturas')
on conflict (name) do nothing;
