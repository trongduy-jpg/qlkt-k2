-- Worker box balance schema based on "B.2 BC TON HOP THO" Google Sheet.
-- Run after supabase/schema.sql and supabase/phase1_google_sheet_schema.sql.

create table if not exists worker_box_periods (
  id uuid primary key default gen_random_uuid(),
  period_code text not null unique,
  from_date date not null,
  to_date date not null,
  source_sheet text,
  report_status text not null default 'draft',
  note text,
  checked_by uuid,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_import_batches (
  id uuid primary key default gen_random_uuid(),
  period_code text not null,
  period_id uuid references worker_box_periods(id) on delete set null,
  source_file text not null,
  source_tab text,
  source_gid text,
  imported_by uuid,
  imported_at timestamptz not null default now(),
  row_count int not null default 0,
  status text not null default 'imported',
  note text
);

create table if not exists worker_box_raw_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references worker_box_import_batches(id) on delete cascade,
  source_row_index int not null,
  row_type text not null default 'worker_balance',
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_balance_lines (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references worker_box_periods(id) on delete cascade,
  worker_id uuid references workers(id),
  worker_code text,
  worker_name text,
  stage_id uuid references process_stages(id),
  stage_code text,
  stage_name text,
  material_id uuid references materials(id),
  material_group text not null,
  metal_code text,
  material_name text,
  gold_age_code text,
  gold_age numeric(8, 4),
  import_batch_id uuid references worker_box_import_batches(id),
  source_row_index int,
  row_group text not null default 'normal',
  debt_status text not null default 'none',
  source_file text,
  source_sheet text,
  source_journal_filter text,
  is_summary_row boolean not null default false,

  opening_powder_gram numeric(14, 4) not null default 0,
  opening_raw_gram numeric(14, 4) not null default 0,
  opening_converted_gram numeric(14, 4) not null default 0,

  import_powder_gram numeric(14, 4) not null default 0,
  import_raw_gram numeric(14, 4) not null default 0,
  import_converted_gram numeric(14, 4) not null default 0,

  export_powder_gram numeric(14, 4) not null default 0,
  export_raw_gram numeric(14, 4) not null default 0,
  export_converted_gram numeric(14, 4) not null default 0,

  book_closing_powder_gram numeric(14, 4) not null default 0,
  book_closing_raw_gram numeric(14, 4) not null default 0,
  book_closing_converted_gram numeric(14, 4) not null default 0,

  physical_btp_gram numeric(14, 4) not null default 0,
  physical_nvl_gram numeric(14, 4) not null default 0,
  physical_scrap_gram numeric(14, 4) not null default 0,
  physical_total_raw_gram numeric(14, 4) not null default 0,
  physical_converted_gram numeric(14, 4) not null default 0,

  diff_raw_gram numeric(14, 4) not null default 0,
  diff_converted_gram numeric(14, 4) not null default 0,
  machine_powder_raw_gram numeric(14, 4) not null default 0,
  machine_powder_converted_gram numeric(14, 4) not null default 0,

  review_loss_converted_gram numeric(14, 4) not null default 0,
  deposit_norm_converted_gram numeric(14, 4) not null default 0,
  risk_diff_converted_gram numeric(14, 4) not null default 0,

  review_status text not null default 'pending',
  comment text,
  xdc_status text,
  ndc_status text,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_balance_metrics (
  id uuid primary key default gen_random_uuid(),
  balance_line_id uuid not null references worker_box_balance_lines(id) on delete cascade,
  metric_group text not null,
  metric_name text not null,
  metal_code text,
  raw_gram numeric(14, 4) not null default 0,
  converted_gram numeric(14, 4) not null default 0,
  source_column_index int,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_source_movements (
  id uuid primary key default gen_random_uuid(),
  balance_line_id uuid not null references worker_box_balance_lines(id) on delete cascade,
  material_movement_id uuid references material_movements(id),
  source_file text,
  source_row_index int,
  movement_role text not null,
  issued_gram numeric(14, 4) not null default 0,
  returned_gram numeric(14, 4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists worker_box_reconciliation_logs (
  id uuid primary key default gen_random_uuid(),
  balance_line_id uuid not null references worker_box_balance_lines(id) on delete cascade,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_worker_box_periods_code on worker_box_periods(period_code);
create index if not exists idx_worker_box_balance_period on worker_box_balance_lines(period_id);
create index if not exists idx_worker_box_balance_worker on worker_box_balance_lines(worker_code);
create index if not exists idx_worker_box_balance_stage on worker_box_balance_lines(stage_code);
create index if not exists idx_worker_box_balance_review on worker_box_balance_lines(review_status);
create index if not exists idx_worker_box_balance_period_review on worker_box_balance_lines(period_id, review_status);
create index if not exists idx_worker_box_balance_period_worker on worker_box_balance_lines(period_id, worker_code);
create index if not exists idx_worker_box_balance_period_stage on worker_box_balance_lines(period_id, stage_code);
create index if not exists idx_worker_box_balance_period_risk on worker_box_balance_lines(period_id, review_status, risk_diff_converted_gram);
create index if not exists idx_worker_box_balance_period_metal on worker_box_balance_lines(period_id, metal_code);
create index if not exists idx_worker_box_balance_period_gold_age on worker_box_balance_lines(period_id, gold_age_code);
create index if not exists idx_worker_box_balance_period_debt on worker_box_balance_lines(period_id, debt_status);
create index if not exists idx_worker_box_import_batches_period on worker_box_import_batches(period_code);
create index if not exists idx_worker_box_raw_rows_batch on worker_box_raw_rows(import_batch_id);
create index if not exists idx_worker_box_metrics_line on worker_box_balance_metrics(balance_line_id);
create index if not exists idx_worker_box_source_movements_line on worker_box_source_movements(balance_line_id);

create extension if not exists pg_trgm;
create index if not exists idx_worker_box_balance_worker_name_trgm on worker_box_balance_lines using gin (worker_name gin_trgm_ops);
create index if not exists idx_worker_box_balance_material_name_trgm on worker_box_balance_lines using gin (material_name gin_trgm_ops);
