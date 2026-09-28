-- Read-only rollout verification. Run after schema, seed and access_control.
-- Expected: 10 RLS rows, policies_count > 0, anon_policies = 0, products_count = 26.

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'stores', 'drink_products', 'drink_product_aliases', 'sales_snapshots',
    'sales_snapshot_lines', 'stock_movements', 'drink_audits',
    'drink_audit_lines', 'audit_events', 'store_members'
  )
order by c.relname;

select
  count(*) as policies_count,
  count(*) filter (where 'anon' = any(roles)) as anon_policies
from pg_policies
where schemaname = 'public'
  and tablename in (
    'stores', 'drink_products', 'drink_product_aliases', 'sales_snapshots',
    'sales_snapshot_lines', 'stock_movements', 'drink_audits',
    'drink_audit_lines', 'audit_events', 'store_members'
  );

select
  (select count(*) from stores) as stores_count,
  (select count(*) from drink_products where active) as active_products_count,
  (select count(*) from drink_product_aliases) as aliases_count,
  (select count(*) from store_members) as members_count;
