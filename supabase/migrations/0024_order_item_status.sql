-- Moi Ma hang (production_order_items) can trang thai van hanh RIENG, tach
-- khoi header (production_orders.status). Truoc migration nay, "Chot LSX"
-- ghi de status cua ca header - khien MOI Ma hang trong cung LSX bi hien
-- "Da chot" du chi chot 1 Ma hang.

alter table production_order_items
  add column if not exists status text not null default 'dang_xu_ly';

-- Backfill: Ma hang da co truoc migration nay ke thua dung trang thai hien
-- tai cua LSX (header), giu nguyen hanh vi cu thay vi bi reset ve
-- "dang_xu_ly".
update production_order_items poi
set status = po.status
from production_orders po
where poi.order_code = po.order_code
  and po.status is not null;

-- Chay rieng dong sau de PostgREST nhan cot moi ngay:
--   notify pgrst, 'reload schema';
