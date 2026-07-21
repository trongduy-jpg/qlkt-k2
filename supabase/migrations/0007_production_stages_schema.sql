create table if not exists production_stages (
  id uuid primary key default gen_random_uuid(),
  stage_code text not null unique,
  stage_name text not null,
  hao_hut_rule text not null default 'binh_thuong',
  created_at timestamptz not null default now()
);

create index if not exists idx_production_stages_code on production_stages(stage_code);

insert into production_stages (stage_code, stage_name, hao_hut_rule)
values
  ('NAU', 'Nấu nguyên liệu', 'binh_thuong'),
  ('CKE', 'Cán chỉ/cán dát', 'truc_tiep'),
  ('DAN', 'Đan dây', 'truc_tiep'),
  ('KBI', 'Khắc bi', 'binh_thuong'),
  ('QBI', 'Quay bóng', 'binh_thuong'),
  ('DAP', 'Dập định hình', 'binh_thuong'),
  ('NEN', 'Nén khít', 'binh_thuong'),
  ('DKB', 'Ra dây', 'binh_thuong'),
  ('BAO', 'Bào dây', 'kiem_soat_rui_ro'),
  ('GEP', 'Ghép dây', 'binh_thuong'),
  ('BAS', 'Dập bass, bông khoen', 'binh_thuong'),
  ('SXK', 'Sản xuất khóa', 'binh_thuong'),
  ('KHO', 'Kho cấp phát', 'binh_thuong'),
  ('GSK', 'GSK', 'binh_thuong'),
  ('CDA', 'Cắt ra dây', 'binh_thuong'),
  ('DLL', 'Dập lưỡi lam', 'binh_thuong'),
  ('KDA', 'Khắc dấu', 'binh_thuong'),
  ('HAN', 'Hàn băng tải', 'binh_thuong'),
  ('TV', 'Tư vấn', 'binh_thuong'),
  ('CVB', 'Cắt/vo bi', 'binh_thuong'),
  ('XMA', 'Xi mạ', 'binh_thuong'),
  ('NAUPK', 'Nấu phân kim', 'binh_thuong'),
  ('KCH', 'Kéo chi', 'binh_thuong'),
  ('CCD', 'Cán/cắt dát', 'binh_thuong'),
  ('HCO', 'Hàn cuốn ống', 'binh_thuong'),
  ('DBI', 'Dập trái châu', 'binh_thuong'),
  ('HBK', 'Hàn khóa bass', 'binh_thuong'),
  ('HUY', 'Hủy sản phẩm', 'binh_thuong'),
  ('HBT', 'Hàn băng tải', 'binh_thuong'),
  ('BHH', 'Bảo hành sản phẩm', 'binh_thuong'),
  ('NPK', 'Nấu phân kim', 'binh_thuong')
on conflict (stage_code) do nothing;
