-- Khoi phuc lai day du ma cong doan (dao lai lan rut gon o 0016) va dat
-- lai stages cua tung tho khop chinh xac voi danh muc tho thuc te.

-- 1) Them lai toan bo ma cong doan
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

-- 2) Dat lai stages cua tung tho khop chinh xac danh sach thuc te
insert into workers (worker_code, full_name, department, stages) values
  ('HHPHONG', 'Huỳnh Hoài Phong', 'Kho', array['KHO']),
  ('MTMTRAN', 'Ma Thị Mỹ Trân', 'Sản xuất', array['GSK','QBI','BAO','CKE','CDA','DAP','DKB','DLL']),
  ('NDTHINH', 'Nguyễn Đức Thịnh', 'Sản xuất', array['KDA','DKB']),
  ('NHKHOA', 'Nguyễn Hữu Khoa', 'Kỹ thuật sản xuất', array['HAN','GEP','NEN','DAP','DAN','QBI']),
  ('NDTUYEN', 'Nguyễn Đình Tuyến', 'Sản xuất', array['TV']),
  ('OKSINH', 'Ôn Khí Sinh', 'Kỹ thuật sản xuất', array['NAU']),
  ('BVTRUNG', 'Bùi Văn Trung', 'Sản xuất', array['DAN','CVB','BAS','QBI','DAP','GEP','NEN','DKB','HUY','HBT','BHH','SXK']),
  ('HHHA', 'Hồ Hữu Hà', 'Sản xuất', array['NEN','DAP','BAO','KBI','QBI','CDA']),
  ('LVTUNG', 'Lê Văn Tùng', 'Sản xuất', array['NAU','CKE','KCH','CCD','HCO','DBI','HBK','BAS','HUY','QBI','BHH','DKB','SXK']),
  ('DTHUY', 'Đặng Thanh Huy', 'Sản xuất', array['KBI']),
  ('BTDANH', 'Bùi Thành Danh', 'Sản xuất', array['GEP']),
  ('HGLAP', 'Heng Gia Lập', 'Sản xuất', array['SXK']),
  ('LVDUC', 'Lưu Văn Đức', 'Sản xuất', array['KBI']),
  ('LTHIEN', 'Lương Trí Hiển', 'Sản xuất', array['DKB','NAU','BAS','BAO','XMA','HUY','DLL','NPK']),
  ('TVTRANG', 'Trần Văn Trang', 'Sản xuất', array['XMA']),
  ('NTNAM', 'Nguyễn Thành Nam', 'Sản xuất', array['XMA']),
  ('LQHIEP', 'Lê Quang Hiệp', 'Sản xuất', array['NAUPK']),
  ('DCTHANH', 'Đinh Công Thành', 'Sản xuất', array['NAU'])
on conflict (worker_code) do update set
  full_name = excluded.full_name,
  department = excluded.department,
  stages = excluded.stages;
