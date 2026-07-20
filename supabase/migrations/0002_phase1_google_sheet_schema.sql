-- Phase 1 schema extension based on exported Google Sheets.
-- Safe to run after the original supabase/schema.sql.

create table if not exists process_stages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  group_name text,
  loss_norm_default numeric(12, 6),
  is_inventory_stage boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel text,
  contact_note text,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  product_group text,
  product_type text,
  material_id uuid references materials(id),
  size_spec text,
  standard_weight_gram numeric(14, 4),
  created_at timestamptz not null default now()
);

create table if not exists sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  po_number text,
  store_id uuid references stores(id),
  customer_id uuid references customers(id),
  order_date date,
  deadline_date date,
  confirmed_date date,
  completed_date date,
  status text not null default 'new',
  progress_status text,
  warning_status text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid references products(id),
  material_id uuid references materials(id),
  ordered_qty numeric(14, 4) not null default 0,
  delivered_qty numeric(14, 4) not null default 0,
  remaining_qty numeric(14, 4) generated always as (greatest(ordered_qty - delivered_qty, 0)) stored,
  estimated_weight_gram numeric(14, 4),
  delivered_weight_gram numeric(14, 4),
  remaining_weight_gram numeric(14, 4),
  converted_24k_chi numeric(14, 4),
  item_status text not null default 'new',
  note text,
  created_at timestamptz not null default now()
);

alter table production_orders
  add column if not exists sales_order_id uuid references sales_orders(id),
  add column if not exists product_id uuid references products(id),
  add column if not exists planned_start_date date,
  add column if not exists planned_end_date date,
  add column if not exists actual_start_date date,
  add column if not exists actual_end_date date,
  add column if not exists locked_at timestamptz,
  add column if not exists reopen_reason text;

create table if not exists production_tasks (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid references production_orders(id) on delete cascade,
  worker_id uuid references workers(id),
  stage_id uuid references process_stages(id),
  task_date date,
  work_code text,
  work_content text,
  plan_start_time time,
  plan_end_time time,
  actual_start_time time,
  actual_end_time time,
  plan_weight_gram numeric(14, 4),
  actual_weight_gram numeric(14, 4),
  completion_rate numeric(8, 4),
  status text not null default 'planned',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists material_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  sales_order_id uuid references sales_orders(id),
  production_order_id uuid references production_orders(id),
  request_period text,
  material_id uuid references materials(id),
  requested_weight_gram numeric(14, 4) not null default 0,
  requested_weight_chi numeric(14, 4),
  issued_weight_gram numeric(14, 4) not null default 0,
  remaining_weight_gram numeric(14, 4) generated always as (greatest(requested_weight_gram - issued_weight_gram, 0)) stored,
  supplement_weight_gram numeric(14, 4),
  deadline_date date,
  status text not null default 'draft',
  note text,
  created_at timestamptz not null default now()
);

alter table material_movements
  add column if not exists occurred_date date,
  add column if not exists destination text,
  add column if not exists document_no text,
  add column if not exists document_line_no text,
  add column if not exists sales_order_id uuid references sales_orders(id),
  add column if not exists product_id uuid references products(id),
  add column if not exists stage_id uuid references process_stages(id),
  add column if not exists movement_type text,
  add column if not exists qty_piece numeric(14, 4),
  add column if not exists transferred_weight_gram numeric(14, 4),
  add column if not exists finished_weight_gram numeric(14, 4),
  add column if not exists export_plating_weight_gram numeric(14, 4),
  add column if not exists gold_age numeric(8, 4),
  add column if not exists source_material_name text,
  add column if not exists source_name text,
  add column if not exists nxt_link_code text,
  add column if not exists loss_period text,
  add column if not exists nxt_period text,
  add column if not exists converted_issue_weight numeric(14, 4),
  add column if not exists converted_return_weight numeric(14, 4);

create table if not exists material_purchase_transactions (
  id uuid primary key default gen_random_uuid(),
  occurred_date date not null,
  document_no text,
  direction text not null,
  material_id uuid references materials(id),
  item_code text,
  item_name text,
  description text,
  unit_price_vnd_per_luong numeric(18, 2),
  amount_vnd numeric(18, 2),
  initial_qty_luong numeric(14, 4),
  initial_weight_gram numeric(14, 4),
  actual_qty_luong numeric(14, 4),
  actual_weight_gram numeric(14, 4),
  source_name text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_balances (
  id uuid primary key default gen_random_uuid(),
  period_code text not null,
  worker_id uuid references workers(id),
  stage_id uuid references process_stages(id),
  material_id uuid references materials(id),
  opening_weight_gram numeric(14, 4) not null default 0,
  issue_weight_gram numeric(14, 4) not null default 0,
  return_weight_gram numeric(14, 4) not null default 0,
  transfer_weight_gram numeric(14, 4) not null default 0,
  closing_weight_gram numeric(14, 4) not null default 0,
  reconciled_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (period_code, worker_id, stage_id, material_id)
);

create table if not exists inventory_period_balances (
  id uuid primary key default gen_random_uuid(),
  period_code text not null,
  material_id uuid references materials(id),
  material_age numeric(8, 4),
  opening_weight_gram numeric(14, 4) not null default 0,
  opening_converted_weight numeric(14, 4) not null default 0,
  import_weight_gram numeric(14, 4) not null default 0,
  import_converted_weight numeric(14, 4) not null default 0,
  export_weight_gram numeric(14, 4) not null default 0,
  export_converted_weight numeric(14, 4) not null default 0,
  closing_weight_gram numeric(14, 4) not null default 0,
  closing_converted_weight numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (period_code, material_id, material_age)
);

alter table price_periods
  add column if not exists purchase_date date,
  add column if not exists buy_price_vnd_per_luong numeric(18, 2),
  add column if not exists avg_price_vnd_per_luong numeric(18, 2),
  add column if not exists converted_price_vnd_per_chi numeric(18, 2),
  add column if not exists usd_rate numeric(18, 4),
  add column if not exists approved_by uuid;

create table if not exists loss_norms (
  id uuid primary key default gen_random_uuid(),
  norm_code text not null unique,
  stage_id uuid references process_stages(id),
  material_id uuid references materials(id),
  product_group text,
  effective_from date,
  effective_to date,
  norm_rate numeric(12, 6) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists loss_settlements (
  id uuid primary key default gen_random_uuid(),
  period_code text not null,
  worker_id uuid references workers(id),
  stage_id uuid references process_stages(id),
  material_id uuid references materials(id),
  production_order_id uuid references production_orders(id),
  actual_loss_weight numeric(14, 4) not null default 0,
  allowed_loss_weight numeric(14, 4) not null default 0,
  exceeded_loss_weight numeric(14, 4) not null default 0,
  price_period_id uuid references price_periods(id),
  settlement_amount_vnd numeric(18, 2) not null default 0,
  status text not null default 'draft',
  responsibility_note text,
  created_at timestamptz not null default now()
);

create table if not exists refining_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,
  export_date date,
  return_date date,
  partner_name text,
  material_id uuid references materials(id),
  input_weight_gram numeric(14, 4),
  input_converted_weight numeric(14, 4),
  output_weight_gram numeric(14, 4),
  output_converted_weight numeric(14, 4),
  melt_difference_weight numeric(14, 4),
  refining_difference_weight numeric(14, 4),
  loss_rate numeric(12, 6),
  cost_amount_vnd numeric(18, 2),
  status text not null default 'draft',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_orders_status on sales_orders(status);
create index if not exists idx_sales_order_items_order on sales_order_items(sales_order_id);
create index if not exists idx_production_tasks_order on production_tasks(production_order_id);
create index if not exists idx_material_requests_order on material_requests(sales_order_id, production_order_id);
create index if not exists idx_material_movements_document on material_movements(document_no);
create index if not exists idx_material_movements_loss_period on material_movements(loss_period);
create index if not exists idx_loss_settlements_period on loss_settlements(period_code);

insert into process_stages (code, name, group_name, loss_norm_default)
values
  ('NAU', 'Nấu nguyên liệu', 'Sản xuất', 0),
  ('CAN_KEO', 'Cán kéo', 'Sản xuất', 0),
  ('CAN_DAT', 'Cán dát', 'Sản xuất', 0),
  ('DAN', 'Đan dây', 'Sản xuất', 0),
  ('HAN', 'Hàn', 'Sản xuất', 0),
  ('DUC', 'Đúc', 'Sản xuất', 0),
  ('XI', 'Xi mạ', 'Hoàn thiện', 0),
  ('HOAN_THIEN', 'Hoàn thiện', 'Hoàn thiện', 0),
  ('KCP', 'Kho KCP', 'Kho', 0),
  ('PK', 'Phân kim', 'Phân kim', 0)
on conflict (code) do update set
  name = excluded.name,
  group_name = excluded.group_name;
