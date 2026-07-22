-- Bo truong "SL san pham" (product_qty) khoi he thong theo yeu cau: NK NVL
-- chi giu 1 truong SL duy nhat (quantity_piece - so vien/soi tung giao
-- dich). Dao lai 0019_add_product_qty.sql.

alter table production_orders
  drop column if exists product_qty;

-- Chay rieng dong sau de PostgREST nhan schema moi ngay:
--   notify pgrst, 'reload schema';
