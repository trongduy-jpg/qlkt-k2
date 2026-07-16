-- Recommended indexes for database-side filtering.
-- Run after schema.sql, phase1_google_sheet_schema.sql, and worker_box_schema.sql.

create extension if not exists pg_trgm;

-- Material movement journal filters: period, order, worker, stage, status, and date.
create index if not exists idx_material_movements_loss_period on material_movements(loss_period);
create index if not exists idx_material_movements_status on material_movements(status);
create index if not exists idx_material_movements_stage_id on material_movements(stage_id);
create index if not exists idx_material_movements_process_name_trgm on material_movements using gin(process_name gin_trgm_ops);
create index if not exists idx_material_movements_worker_id on material_movements(worker_id);
create index if not exists idx_material_movements_material_id on material_movements(material_id);
create index if not exists idx_material_movements_occurred_date on material_movements(occurred_date);

create index if not exists idx_material_movements_period_status_stage
on material_movements(loss_period, status, stage_id);

create index if not exists idx_material_movements_period_worker
on material_movements(loss_period, worker_id);

create index if not exists idx_material_movements_period_material
on material_movements(loss_period, material_id);

-- Production order search/filter.
create index if not exists idx_production_orders_order_code on production_orders(order_code);
create index if not exists idx_production_orders_sku on production_orders(sku);
create index if not exists idx_production_orders_status on production_orders(status);
create index if not exists idx_production_orders_order_code_trgm on production_orders using gin(order_code gin_trgm_ops);
create index if not exists idx_production_orders_sku_trgm on production_orders using gin(sku gin_trgm_ops);

-- Worker box operational filters.
create index if not exists idx_worker_box_periods_period_code on worker_box_periods(period_code);
create index if not exists idx_worker_box_balance_period_review_filter on worker_box_balance_lines(period_id, review_status);
create index if not exists idx_worker_box_balance_period_worker_filter on worker_box_balance_lines(period_id, worker_code);
create index if not exists idx_worker_box_balance_period_stage_filter on worker_box_balance_lines(period_id, stage_code);
create index if not exists idx_worker_box_balance_period_metal_filter on worker_box_balance_lines(period_id, metal_code);
create index if not exists idx_worker_box_balance_period_gold_age_filter on worker_box_balance_lines(period_id, gold_age_code);
create index if not exists idx_worker_box_balance_period_debt_filter on worker_box_balance_lines(period_id, debt_status);
create index if not exists idx_worker_box_balance_worker_name_search on worker_box_balance_lines using gin(worker_name gin_trgm_ops);
create index if not exists idx_worker_box_balance_material_name_search on worker_box_balance_lines using gin(material_name gin_trgm_ops);
create index if not exists idx_worker_box_import_batches_period_filter on worker_box_import_batches(period_code);
create index if not exists idx_worker_box_raw_rows_batch_filter on worker_box_raw_rows(import_batch_id);
create index if not exists idx_worker_box_metrics_line_filter on worker_box_balance_metrics(balance_line_id);
create index if not exists idx_worker_box_source_movements_line_filter on worker_box_source_movements(balance_line_id);
