alter table production_orders
  add column if not exists product_name text,
  add column if not exists destination text,
  add column if not exists order_date date,
  add column if not exists occurred_date date,
  add column if not exists document_no text,
  add column if not exists document_in_no text,
  add column if not exists document_line_no text,
  add column if not exists movement_type text default 'issue',
  add column if not exists quantity_piece numeric default 0,
  add column if not exists planned_date date,
  add column if not exists planned_stage text,
  add column if not exists planned_worker text,
  add column if not exists planned_material text,
  add column if not exists material_spec text,
  add column if not exists planned_gold_age numeric,
  add column if not exists planned_material_type text,
  add column if not exists delivery_status text,
  add column if not exists order_month text,
  add column if not exists sales_type text,
  add column if not exists customer_name text,
  add column if not exists specification text,
  add column if not exists deadline_date date,
  add column if not exists completed_date date,
  add column if not exists delivered_qty numeric default 0,
  add column if not exists actual_progress_note text,
  add column if not exists completed_weight_gram numeric default 0,
  add column if not exists issued_gram numeric default 0,
  add column if not exists returned_gram numeric default 0,
  add column if not exists powder_gram numeric default 0,
  add column if not exists transferred_weight_gram numeric default 0,
  add column if not exists loss_period text,
  add column if not exists nxt_period text,
  add column if not exists source_material_name text,
  add column if not exists source_name text,
  add column if not exists import_source text,
  add column if not exists export_source text,
  add column if not exists nxt_link_code text,
  add column if not exists converted_issue_weight numeric,
  add column if not exists converted_return_weight numeric,
  add column if not exists note text;

alter table material_movements
  add column if not exists occurred_date date,
  add column if not exists destination text,
  add column if not exists document_no text,
  add column if not exists document_in_no text,
  add column if not exists document_line_no text,
  add column if not exists movement_type text default 'issue',
  add column if not exists qty_piece numeric,
  add column if not exists stage_status text,
  add column if not exists transferred_weight_gram numeric default 0,
  add column if not exists loss_period text,
  add column if not exists nxt_period text,
  add column if not exists gold_age numeric,
  add column if not exists source_material_name text,
  add column if not exists source_name text,
  add column if not exists import_source text,
  add column if not exists export_source text,
  add column if not exists material_type text,
  add column if not exists nxt_link_code text,
  add column if not exists converted_issue_weight numeric,
  add column if not exists converted_return_weight numeric;

create index if not exists idx_material_movements_document_no
  on material_movements(document_no);

create index if not exists idx_material_movements_occurred_date
  on material_movements(occurred_date);

create index if not exists idx_material_movements_loss_period_status
  on material_movements(loss_period, status);

create index if not exists idx_material_movements_nxt_period
  on material_movements(nxt_period);

create index if not exists idx_material_movements_stage_status
  on material_movements(process_name, status);

create index if not exists idx_production_orders_planned_date
  on production_orders(planned_date);

create index if not exists idx_production_orders_planned_stage
  on production_orders(planned_stage);

create index if not exists idx_production_orders_occurred_date
  on production_orders(occurred_date);

create index if not exists idx_production_orders_loss_period_status
  on production_orders(loss_period, status);
