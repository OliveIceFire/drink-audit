-- 门店酒水盘查：Supabase PostgreSQL 数据模型
-- 仅在已创建 Supabase 项目并完成门店/员工身份配置后执行。

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists drink_products (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  case_size integer not null check (case_size > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists drink_product_aliases (
  alias text primary key,
  product_id uuid not null references drink_products(id) on delete cascade
);

create table if not exists sales_snapshots (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  business_date date not null,
  source text not null check (source in ('meituan_api','meituan_export','manual_verified')),
  source_exported_at timestamptz,
  raw_payload jsonb not null,
  imported_by uuid,
  created_at timestamptz not null default now(),
  unique (store_id, business_date, source)
);

create table if not exists sales_snapshot_lines (
  snapshot_id uuid not null references sales_snapshots(id) on delete cascade,
  product_id uuid not null references drink_products(id),
  quantity numeric(12,2) not null check (quantity >= 0),
  sales_amount numeric(12,2),
  primary key (snapshot_id, product_id)
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  product_id uuid not null references drink_products(id),
  business_date date not null,
  movement_type text not null check (movement_type in ('receipt','loss','gift','correction')),
  quantity numeric(12,2) not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists drink_audits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  business_date date not null,
  status text not null default 'draft' check (status in ('draft','submitted','locked')),
  submitted_by uuid,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, business_date)
);

create table if not exists drink_audit_lines (
  audit_id uuid not null references drink_audits(id) on delete cascade,
  product_id uuid not null references drink_products(id),
  opening_quantity numeric(12,2) not null default 0,
  receipt_quantity numeric(12,2) not null default 0,
  sales_quantity numeric(12,2) not null default 0,
  loss_quantity numeric(12,2) not null default 0,
  actual_remaining numeric(12,2),
  after_midnight_sales_quantity numeric(12,2) not null default 0,
  open_table_quantity numeric(12,2) not null default 0,
  variance numeric(12,2) generated always as (opening_quantity + receipt_quantity - sales_quantity - loss_quantity - coalesce(actual_remaining, 0) - after_midnight_sales_quantity - open_table_quantity) stored,
  note text,
  primary key (audit_id, product_id)
);

-- 审计记录只追加，不允许覆盖历史盘查来源与操作痕迹。
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references drink_audits(id) on delete cascade,
  event_type text not null,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists drink_audits_store_date_idx on drink_audits(store_id, business_date desc);
create index if not exists sales_snapshots_store_date_idx on sales_snapshots(store_id, business_date desc);
