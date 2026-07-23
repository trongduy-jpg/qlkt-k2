-- PHASE 1 (nhieu Ma hang / 1 LSX): tach tang "Ma hang (line item)".
-- Truoc day moi truong cap Ma hang (sku, product_name, quantity_piece,
-- material_spec, planned_material, delivered_qty, completed_weight_gram...)
-- nam thang tren production_orders => 1 LSX chi chua 1 Ma hang. Bang moi
-- production_order_items cho phep 1 LSX chua nhieu Ma hang, moi Ma hang
-- co bo thong tin rieng. material_movements them item_sku de moi giao
-- dich NK NVL thuoc dung 1 Ma hang (moi Ma hang co tien trinh cong doan
-- rieng).

-- 1) Bang Ma hang thuoc LSX
create table if not exists production_order_items (
  id uuid primary key default gen_random_uuid(),
  order_code text not null references production_orders(order_code) on update cascade on delete cascade,
  sku text not null,
  product_name text,
  quantity_piece numeric default 0,
  material_spec text,
  planned_material text,
  planned_gold_age numeric,
  planned_material_type text,
  delivered_qty numeric default 0,
  completed_weight_gram numeric default 0,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (order_code, sku)
);

create index if not exists idx_production_order_items_order_code
  on production_order_items(order_code);

-- 2) Giao dich NK NVL thuoc dung 1 Ma hang trong LSX
alter table material_movements
  add column if not exists item_sku text;

create index if not exists idx_material_movements_item_sku
  on material_movements(order_id, item_sku);

-- 3) Backfill: moi LSX hien co tao 1 Ma hang tu chinh cac truong dang co,
-- va gan item_sku cho cac giao dich cu = sku cua LSX cha (an toan chay
-- lai nhieu lan nho on conflict / is null).
insert into production_order_items (
  order_code, sku, product_name, quantity_piece, material_spec,
  planned_material, planned_gold_age, planned_material_type,
  delivered_qty, completed_weight_gram, note, sort_order
)
select
  order_code, sku, product_name, quantity_piece, material_spec,
  planned_material, planned_gold_age, planned_material_type,
  delivered_qty, completed_weight_gram, note, 0
from production_orders
where sku is not null and sku <> ''
on conflict (order_code, sku) do nothing;

update material_movements m
set item_sku = po.sku
from production_orders po
where m.order_id = po.id and (m.item_sku is null or m.item_sku = '');

-- 4) RLS: bang moi cung chi tai khoan trong app_users moi doc/ghi duoc
-- (dung ham is_whitelisted_user() da tao o 0010).
alter table production_order_items enable row level security;
drop policy if exists "production_order_items_whitelisted_access" on production_order_items;
create policy "production_order_items_whitelisted_access"
  on production_order_items for all
  using (is_whitelisted_user())
  with check (is_whitelisted_user());

-- Chay rieng dong sau de PostgREST nhan schema moi ngay:
--   notify pgrst, 'reload schema';
