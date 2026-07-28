-- Moi Ma hang (production_order_items) can Trang thai LSX (delivery_status)
-- RIENG, tach khoi header (production_orders.delivery_status). Truoc
-- migration nay, doi "Trang thai LSX" o sidebar ghi de header - khien MOI
-- Ma hang trong cung LSX bi hien chung 1 trang thai giao hang du tien do
-- thuc te co the khac nhau giua cac Ma hang.

alter table production_order_items
  add column if not exists delivery_status text;

-- Backfill: Ma hang da co truoc migration nay ke thua dung Trang thai LSX
-- hien tai cua header, giu nguyen hanh vi cu thay vi bi reset ve rong.
update production_order_items poi
set delivery_status = po.delivery_status
from production_orders po
where poi.order_code = po.order_code
  and po.delivery_status is not null
  and poi.delivery_status is null;

-- Chay rieng dong sau de PostgREST nhan cot moi ngay:
--   notify pgrst, 'reload schema';
