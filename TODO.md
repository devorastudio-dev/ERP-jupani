# Jupani Sistema - Completion TODO

## Phase 1: Suppliers (Backend ready, UI + Page)
- [x] Create app/(app)/fornecedores/page.tsx (PageHeader, SuppliersTable, CRUD dialogs)
- [x] Update features/suppliers/components/suppliers-table.tsx (DataTable + columns + actions)
- [x] Update features/suppliers/components/supplier-form.tsx (react-hook-form + Dialog)
- [ ] Update lib/constants.ts (add nav item)
- [ ] Update lib/permissions.ts (add 'fornecedores' module)

**Suppliers complete - test /fornecedores after nav.**

## Phase 2: Company Settings (Greenfield)
- [ ] Create supabase/migrations/20241115_001_company_settings.sql (table + trigger + RLS)
- [ ] Create features/settings/schema.ts (Zod)
- [ ] Create features/settings/server/queries.ts (get/upsert)
- [ ] Create features/settings/actions.ts (update)
- [ ] Update app/(app)/configuracoes/page.tsx (load + SettingsForm)
- [ ] Create features/settings/components/settings-form.tsx (sections)

## Phase 3: Final
- [ ] Update types/database.ts or entities.ts
- [ ] Test CRUD / navegação
- [ ] Mark complete

Progress tracked here. Next: Phase 1 Step 1.

