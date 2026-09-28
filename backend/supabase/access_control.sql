-- 员工身份与门店权限：在 schema.sql 后执行。
-- 先由管理员在 Supabase Authentication 创建员工账号，再在 SQL Editor 为其写入 store_members。

create table if not exists store_members (
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('employee','manager')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

-- Keep all browser-facing tables behind RLS. No policy below grants the anon role access.
alter table stores enable row level security;
alter table drink_products enable row level security;
alter table drink_product_aliases enable row level security;
alter table sales_snapshots enable row level security;
alter table sales_snapshot_lines enable row level security;
alter table stock_movements enable row level security;
alter table drink_audits enable row level security;
alter table drink_audit_lines enable row level security;
alter table audit_events enable row level security;
alter table store_members enable row level security;

create or replace function public.is_store_member(target_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.store_members where store_id = target_store and user_id = auth.uid());
$$;

create or replace function public.is_store_manager(target_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.store_members where store_id = target_store and user_id = auth.uid() and role = 'manager');
$$;

drop policy if exists member_reads_self on store_members;
create policy member_reads_self on store_members for select to authenticated using (user_id = auth.uid());
drop policy if exists member_reads_store on stores;
create policy member_reads_store on stores for select to authenticated using (public.is_store_member(id));
drop policy if exists member_reads_products on drink_products;
create policy member_reads_products on drink_products for select to authenticated using (true);
drop policy if exists member_reads_aliases on drink_product_aliases;
create policy member_reads_aliases on drink_product_aliases for select to authenticated using (true);

drop policy if exists member_reads_audits on drink_audits;
create policy member_reads_audits on drink_audits for select to authenticated using (public.is_store_member(store_id));
drop policy if exists member_creates_audits on drink_audits;
create policy member_creates_audits on drink_audits for insert to authenticated with check (public.is_store_member(store_id) and submitted_by = auth.uid());
drop policy if exists member_updates_own_audits on drink_audits;
create policy member_updates_own_audits on drink_audits for update to authenticated using (public.is_store_member(store_id) and (submitted_by = auth.uid() or public.is_store_manager(store_id))) with check (public.is_store_member(store_id));

drop policy if exists member_reads_audit_lines on drink_audit_lines;
create policy member_reads_audit_lines on drink_audit_lines for select to authenticated using (exists (select 1 from drink_audits a where a.id = audit_id and public.is_store_member(a.store_id)));
drop policy if exists member_writes_audit_lines on drink_audit_lines;
create policy member_writes_audit_lines on drink_audit_lines for all to authenticated using (exists (select 1 from drink_audits a where a.id = audit_id and public.is_store_member(a.store_id))) with check (exists (select 1 from drink_audits a where a.id = audit_id and public.is_store_member(a.store_id)));

drop policy if exists member_reads_audit_events on audit_events;
create policy member_reads_audit_events on audit_events for select to authenticated using (exists (select 1 from drink_audits a where a.id = audit_id and public.is_store_member(a.store_id)));
drop policy if exists member_appends_audit_events on audit_events;
create policy member_appends_audit_events on audit_events for insert to authenticated with check (actor_id = auth.uid() and exists (select 1 from drink_audits a where a.id = audit_id and public.is_store_member(a.store_id)));

drop policy if exists manager_reads_sales on sales_snapshots;
create policy manager_reads_sales on sales_snapshots for select to authenticated using (public.is_store_manager(store_id));
drop policy if exists manager_writes_sales on sales_snapshots;
create policy manager_writes_sales on sales_snapshots for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
drop policy if exists manager_reads_sales_lines on sales_snapshot_lines;
create policy manager_reads_sales_lines on sales_snapshot_lines for select to authenticated using (exists (select 1 from sales_snapshots s where s.id = snapshot_id and public.is_store_manager(s.store_id)));
drop policy if exists manager_writes_sales_lines on sales_snapshot_lines;
create policy manager_writes_sales_lines on sales_snapshot_lines for all to authenticated using (exists (select 1 from sales_snapshots s where s.id = snapshot_id and public.is_store_manager(s.store_id))) with check (exists (select 1 from sales_snapshots s where s.id = snapshot_id and public.is_store_manager(s.store_id)));
drop policy if exists manager_reads_movements on stock_movements;
create policy manager_reads_movements on stock_movements for select to authenticated using (public.is_store_manager(store_id));
drop policy if exists manager_writes_movements on stock_movements;
create policy manager_writes_movements on stock_movements for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));

-- 模板：将 <门店UUID> 和 <员工Auth UUID> 替换为真实值后执行。
-- insert into store_members (store_id, user_id, role) values ('<门店UUID>', '<员工Auth UUID>', 'employee');
