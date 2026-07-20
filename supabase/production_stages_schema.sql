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
  ('CKE', 'Cán kéo', 'truc_tiep'),
  ('CDT', 'Cán dát', 'binh_thuong'),
  ('DAN', 'Đan dây', 'truc_tiep'),
  ('BIEN', 'Biến', 'truc_tiep'),
  ('QBI', 'Quay bi', 'binh_thuong'),
  ('BAO', 'Bào dây', 'kiem_soat_rui_ro'),
  ('PI', 'Pi', 'kiem_soat_rui_ro'),
  ('DAP', 'Dập định hình', 'binh_thuong'),
  ('DKB', 'Đánh bóng', 'binh_thuong'),
  ('GEP', 'Ghép dây', 'binh_thuong'),
  ('NAU', 'Nấu', 'binh_thuong'),
  ('SXK', 'Sản xuất khóa', 'binh_thuong'),
  ('HTH', 'Hoàn thiện', 'binh_thuong')
on conflict (stage_code) do nothing;
