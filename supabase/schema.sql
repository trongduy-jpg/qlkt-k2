create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  purity numeric(8, 4) not null,
  unit text not null default 'gram',
  created_at timestamptz not null default now()
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  worker_code text not null unique,
  full_name text not null,
  department text not null,
  stage text,
  created_at timestamptz not null default now()
);

create table if not exists production_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  sku text not null,
  status text not null default 'dang_xu_ly',
  created_at timestamptz not null default now()
);

create table if not exists material_movements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references production_orders(id),
  material_id uuid not null references materials(id),
  worker_id uuid not null references workers(id),
  process_name text not null,
  issued_gram numeric(14, 4) not null default 0,
  returned_gram numeric(14, 4) not null default 0,
  powder_gram numeric(14, 4) not null default 0,
  loss_gram numeric(14, 4) generated always as (
    greatest(issued_gram - returned_gram - powder_gram, 0)
  ) stored,
  status text not null default 'dang_xu_ly',
  note text,
  occurred_at timestamptz not null default now()
);

create table if not exists price_periods (
  id uuid primary key default gen_random_uuid(),
  period_code text not null unique,
  material_id uuid not null references materials(id),
  price_vnd_per_chi numeric(18, 2) not null,
  source text not null,
  approval_status text not null default 'draft',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_name text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_material_movements_order_id on material_movements(order_id);
create index if not exists idx_material_movements_worker_id on material_movements(worker_id);
create index if not exists idx_material_movements_status on material_movements(status);
create index if not exists idx_production_orders_status on production_orders(status);
create index if not exists idx_audit_logs_entity on audit_logs(entity_name, entity_id);
