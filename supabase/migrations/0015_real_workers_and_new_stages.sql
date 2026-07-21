-- 1) Them cac ma cong doan moi phat hien tu file danh muc tho thuc te
-- (chi can chay neu ban da chay 0007 TRUOC khi file 0007 duoc cap nhat -
-- 0007 hien tai da co san cac ma nay cho lan chay dau tien).
insert into production_stages (stage_code, stage_name, hao_hut_rule)
values
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

-- 2) Nhap danh muc tho thuc te (18 nguoi). worker_code dung "Ma ten"
-- trong file goc (duy nhat cho tung nguoi) thay vi "Ma so" (bi trung
-- giua Nguyen Huu Khoa va On Khi Sinh trong file goc - loi nhap lieu).
--
-- KHONG xoa du lieu workers cu (vi du TD003/TD004 demo) truoc khi them:
-- material_movements co khoa ngoai tham chieu workers(id), neu ban da
-- co giao dich NVL thuc te gan voi cac tho demo do thi lenh DELETE se
-- bao loi vi pham khoa ngoai (foreign key violation) va lam that bai ca
-- migration. Neu muon don du lieu demo, xoa thu cong tung tho khong con
-- dung qua tab "Danh muc tho" trong Cau hinh (co canh bao neu dang duoc
-- dung trong giao dich).
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
