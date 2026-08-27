-- Chay 1 LAN de dam bao database production co DU tat ca cot ma code hien
-- tai can - gom lai toan bo "add column if not exists" tu cac migration
-- 0002 -> 0026 (loai tru cac bang KHONG duoc app nay dung: sales_orders,
-- products, customers... thuoc 1 nhanh tinh nang khac, khong lien quan).
-- An toan tuyet doi: "if not exists" nen cot da co se duoc bo qua, khong
-- mat du lieu, khong ghi de gia tri hien co.
--
-- Chay trong Supabase Dashboard -> SQL Editor.

begin;

-- production_orders (tu 0003, 0021 - bo 0002/0019/0020 vi lien quan
-- sales_orders/product_qty da bi rollback, khong con dung)
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
  add column if not exists note text,
  add column if not exists parent_order_code text;

-- material_movements (tu 0003, 0022, 0025)
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
  add column if not exists converted_return_weight numeric,
  add column if not exists item_sku text,
  add column if not exists issue_date date,
  add column if not exists issue_sku text,
  add column if not exists issue_product_name text,
  add column if not exists issue_qty_piece numeric(14, 4),
  add column if not exists return_date date,
  add column if not exists return_sku text,
  add column if not exists return_product_name text,
  add column if not exists return_qty_piece numeric(14, 4);

-- workers (tu 0014)
alter table workers add column if not exists stages text[] not null default '{}';

-- production_order_items (tu 0023, 0024, 0026)
alter table production_order_items
  add column if not exists planned_weight_gram numeric default 0,
  add column if not exists status text not null default 'dang_xu_ly',
  add column if not exists delivery_status text;

commit;

-- Sau khi chay xong, bao PostgREST nap lai schema ngay (khong can doi vai
-- phut cache tu lam moi):
notify pgrst, 'reload schema';
