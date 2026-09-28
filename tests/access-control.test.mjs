import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('权限迁移为每张云端盘查表启用 RLS，且不授予匿名角色',()=>{
  const source=fs.readFileSync(new URL('../backend/supabase/access_control.sql',import.meta.url),'utf8');
  for(const table of ['stores','drink_products','drink_product_aliases','sales_snapshots','sales_snapshot_lines','stock_movements','drink_audits','drink_audit_lines','audit_events','store_members']){
    assert.match(source,new RegExp(`alter table ${table} enable row level security;`));
  }
  assert.doesNotMatch(source,/to\s+anon\b/i);
  assert.match(source,/for insert to authenticated with check \(public\.is_store_member\(store_id\) and submitted_by = auth\.uid\(\)\)/);
});

test('上线核验 SQL 只读检查 RLS、匿名策略和试点目录',()=>{
  const source=fs.readFileSync(new URL('../backend/supabase/verify_rollout.sql',import.meta.url),'utf8');
  assert.match(source,/select c\.relname as table_name, c\.relrowsecurity as rls_enabled/i);
  assert.match(source,/count\(\*\) filter \(where 'anon' = any\(roles\)\) as anon_policies/i);
  assert.match(source,/active_products_count/i);
  assert.doesNotMatch(source,/\b(insert|update|delete|alter|drop|create)\b/i);
});
