-- Phase 2: them "Trong luong du kien" cho tung Ma hang (line item). Bang
-- production_order_items (0022) chua co truong nay - user yeu cau moi Ma
-- hang co TL du kien rieng.

alter table production_order_items
  add column if not exists planned_weight_gram numeric default 0;

-- Chay rieng dong sau de PostgREST nhan cot moi ngay:
--   notify pgrst, 'reload schema';
