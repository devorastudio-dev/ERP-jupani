# Jupani Gestão

ERP web para confeitaria artesanal com foco em uso interno familiar, pronto para crescer e com base preparada para módulo fiscal futuro sem refatoração estrutural grande.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- shadcn/ui style components
- Supabase: Postgres, Auth, Storage, RLS
- React Hook Form + Zod
- TanStack Table
- dayjs
- lucide-react

## Módulos entregues

- Autenticação com Supabase e proteção de rotas
- Perfis de acesso por papel
- Dashboard gerencial
- Produtos
- Insumos / estoque
- Fichas técnicas
- Vendas / pedidos
- Caixa
- Compras
- Inventário
- Funcionários
- Relatórios
- Base para módulo fiscal futuro

## Arquitetura

```text
src/
  app/
    (auth)/login
    (app)/
      dashboard
      produtos
      insumos
      fichas-tecnicas
      vendas
      caixa
      compras
      estoque
      funcionarios
      relatorios
      configuracoes
  components/
    charts/
    layout/
    shared/
    ui/
  features/
    auth/
    dashboard/
    products/
    ingredients/
    recipes/
    sales/
    cash/
    purchases/
    inventory/
    employees/
    reports/
    settings/
  lib/
  server/
    auth/
    db/
    supabase/
  types/
supabase/
  migrations/
  seed/
```

## Banco de dados

O schema principal está em `supabase/migrations/20260420_001_initial_schema.sql`.

Inclui:

- perfis e papéis
- clientes, fornecedores e funcionários
- produtos, categorias, insumos, receitas e itens de receita
- vendas, itens, pagamentos e histórico de status
- caixa e movimentações financeiras
- compras e contas a pagar/receber
- inventário e ordens de produção
- logs de auditoria
- tabelas fiscais futuras: `fiscal_documents`, `fiscal_document_items`, `fiscal_events`

Regras automatizadas incluídas:

- criação automática de `profiles` ao cadastrar usuário no Auth
- recálculo de custo teórico da ficha técnica
- baixa automática de estoque em venda confirmada
- estorno de estoque em cancelamento
- entrada automática de estoque em compra aprovada
- atualização de saldo pendente em pagamento parcial
- auditoria básica em entidades críticas

## Perfis de acesso

- `admin`: acesso total
- `gerente`: visão ampla, sem configurações críticas
- `caixa`: vendas, pedidos, recebimentos e caixa
- `producao`: pedidos e produção
- `estoque`: insumos, compras, inventário e movimentações
- `financeiro`: caixa, contas, relatórios financeiros e funcionários

Observação:
salários e pagamentos de funcionários ficam restritos a `admin` e `financeiro`.

## Setup local

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. No Supabase, rode a migration SQL do projeto.

5. Opcionalmente rode a seed em `supabase/seed/optional_seed.sql`.

6. Crie usuários no Supabase Auth e atribua papéis inserindo registros em `profiles` e `user_roles`.

7. Rode o projeto:

```bash
npm run dev
```

## Deploy

### Vercel

1. Conecte o repositório na Vercel.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Faça deploy.

### Supabase

1. Crie o projeto.
2. Execute as migrations.
3. Configure Storage para fotos de produtos quando quiser evoluir o upload.
4. Revise as policies RLS antes de produção.

## Observações de evolução

- O front opera com dados reais do Supabase e mostra estados vazios elegantes quando o banco ainda não foi populado.
- O módulo fiscal não emite nota agora, mas a base foi separada do fluxo operacional para futura integração com provedor fiscal.
- Os pontos de expansão fiscal estão em `sales`, `fiscal_documents`, `fiscal_document_items` e `fiscal_events`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
