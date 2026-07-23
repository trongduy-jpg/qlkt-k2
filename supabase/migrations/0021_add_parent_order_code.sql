-- Them cot parent_order_code de lien ket "LSX phat sinh them cho cung
-- khach hang" (tao qua nut "+ Tao don moi cho khach nay" trong man chi
-- tiet LSX) voi LSX goc. Dung de hien dau hieu "cung khach hang" tren
-- giao dien - khong dung FK cung (chi don gian la tham chieu order_code)
-- de tranh vuong upsert/xoa LSX goc truoc.

alter table production_orders
  add column if not exists parent_order_code text;

create index if not exists idx_production_orders_parent_code
  on production_orders(parent_order_code);

-- Chay rieng dong sau de PostgREST nhan cot moi ngay:
--   notify pgrst, 'reload schema';
