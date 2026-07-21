-- Cap nhat danh muc cong doan (production_stages) cho khop voi quy trinh
-- thuc te (thay cho danh sach tam thoi luc dau o 0007). Xoa cac ma cu
-- khong con dung (CDT, BIEN, PI, HTH da gop/bo), them cac ma moi
-- (KBI, NEN, BAS), doi ten hien thi cua CKE va DKB cho dung nghia moi.

delete from production_stages where stage_code in ('CDT', 'BIEN', 'PI', 'HTH');

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
  ('SXK', 'Sản xuất khóa', 'binh_thuong')
on conflict (stage_code) do update set
  stage_name = excluded.stage_name,
  hao_hut_rule = excluded.hao_hut_rule;
