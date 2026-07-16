insert into materials (code, name, category, purity, unit)
values
  ('AU9999', 'Vang 24K', 'gold', 0.9999, 'gram'),
  ('AU750', 'Vang 18K', 'gold', 0.7500, 'gram'),
  ('PT900', 'Platinum 900', 'platinum', 0.9000, 'gram'),
  ('AG925', 'Bac 92.5', 'silver', 0.9250, 'gram')
on conflict (code) do nothing;

insert into workers (worker_code, full_name, department, stage)
values
  ('TD003', 'Le Van Tung', 'San xuat', 'Can keo'),
  ('TD004', 'Nguyen Van An', 'San xuat', 'Can dat'),
  ('TD005', 'Tran Minh Khoi', 'San xuat', 'Duc'),
  ('TD006', 'Pham Quoc Huy', 'San xuat', 'Hoan thien')
on conflict (worker_code) do nothing;

insert into production_orders (order_code, sku, status)
values
  ('DHAG-26/03/02', 'BI50416W', 'xac_dinh'),
  ('DHAG-26/05/18', 'PT900-PD', 'treo_no'),
  ('DHAG-26/06/11', 'RG750Y', 'dang_xu_ly'),
  ('DHAG-26/06/22', 'BC925', 'da_chot')
on conflict (order_code) do nothing;

insert into material_movements (
  order_id,
  material_id,
  worker_id,
  process_name,
  issued_gram,
  returned_gram,
  powder_gram,
  status,
  note
)
select
  po.id,
  m.id,
  w.id,
  seed.process_name,
  seed.issued_gram,
  seed.returned_gram,
  seed.powder_gram,
  seed.status,
  seed.note
from (
  values
    ('DHAG-26/03/02', 'AU750', 'TD003', 'Can keo', 23.0000, 22.8900, 0.0000, 'xac_dinh', 'Giao dich mau vang 18K'),
    ('DHAG-26/05/18', 'PT900', 'TD004', 'Can dat', 41.5000, 39.8600, 0.4200, 'treo_no', 'PT900-PD cho doi doi soat'),
    ('DHAG-26/06/11', 'AU750', 'TD005', 'Duc', 18.2500, 17.9800, 0.0800, 'dang_xu_ly', 'Dang xu ly'),
    ('DHAG-26/06/22', 'AG925', 'TD006', 'Hoan thien', 76.2000, 75.9100, 0.1300, 'da_chot', 'Da chot ky demo')
) as seed(order_code, material_code, worker_code, process_name, issued_gram, returned_gram, powder_gram, status, note)
join production_orders po on po.order_code = seed.order_code
join materials m on m.code = seed.material_code
join workers w on w.worker_code = seed.worker_code;

insert into price_periods (period_code, material_id, price_vnd_per_chi, source, approval_status, approved_at)
select '2026-05', id, 15407000, 'Gia mua binh quan', 'approved', now()
from materials
where code = 'AU9999'
on conflict (period_code) do nothing;
