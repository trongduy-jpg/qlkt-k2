-- Them cot product_qty (SL san pham cua ca LSX) vao production_orders.
-- Day la so luong san pham/mon cua nguyen lenh (nhap 1 lan cho LSX,
-- khong lap theo tung khau/giao dich). Khac voi quantity_piece (so vien/
-- soi theo tung giao dich, dung o khau DKB).

alter table production_orders
  add column if not exists product_qty numeric;

-- Chay rieng dong sau de PostgREST nhan cot moi ngay:
--   notify pgrst, 'reload schema';
