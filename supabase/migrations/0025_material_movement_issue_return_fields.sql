alter table material_movements
  add column if not exists issue_date date,
  add column if not exists issue_sku text,
  add column if not exists issue_product_name text,
  add column if not exists issue_qty_piece numeric(14, 4),
  add column if not exists return_date date,
  add column if not exists return_sku text,
  add column if not exists return_product_name text,
  add column if not exists return_qty_piece numeric(14, 4);

create index if not exists idx_material_movements_issue_date
  on material_movements(issue_date);

create index if not exists idx_material_movements_return_date
  on material_movements(return_date);

create index if not exists idx_material_movements_issue_sku
  on material_movements(issue_sku);

create index if not exists idx_material_movements_return_sku
  on material_movements(return_sku);
