-- Doi worker_code tu "Ma ten" (BTDANH, BVTRUNG...) sang "Ma so" (TD005,
-- TD001...) de hien thi khop voi file goc. worker_code chi la ma hien
-- thi (movements tham chieu tho qua worker_id/ho ten, khong qua ma nay)
-- nen doi an toan. On Khi Sinh dung KT001B vi KT001 da thuoc Nguyen Huu
-- Khoa (file goc ghi trung).
--
-- Chi can chay tren DB da tung nhap tho bang ma ten (0015/0017 ban cu).

-- Don 2 tho demo cu (TD003 Le Van Tung, TD004 Nguyen Van An) dang chiem
-- ma TD003/TD004 ma tho that can dung: xoa neu khong con giao dich, con
-- neu con giao dich thi doi ma de nhuong cho tho that.
delete from workers w
where w.worker_code in ('TD003','TD004')
  and not exists (select 1 from material_movements m where m.worker_id = w.id);

update workers set worker_code = 'OLD-' || worker_code
where worker_code in ('TD003','TD004');

update workers set worker_code = 'CP001'  where worker_code = 'HHPHONG';
update workers set worker_code = 'GS001'  where worker_code = 'MTMTRAN';
update workers set worker_code = 'T001'   where worker_code = 'NDTHINH';
update workers set worker_code = 'KT001'  where worker_code = 'NHKHOA';
update workers set worker_code = 'TV001'  where worker_code = 'NDTUYEN';
update workers set worker_code = 'KT001B' where worker_code = 'OKSINH';
update workers set worker_code = 'TD001'  where worker_code = 'BVTRUNG';
update workers set worker_code = 'TD002'  where worker_code = 'HHHA';
update workers set worker_code = 'TD003'  where worker_code = 'LVTUNG';
update workers set worker_code = 'TD004'  where worker_code = 'DTHUY';
update workers set worker_code = 'TD005'  where worker_code = 'BTDANH';
update workers set worker_code = 'TD006'  where worker_code = 'HGLAP';
update workers set worker_code = 'TD007'  where worker_code = 'LVDUC';
update workers set worker_code = 'KTL02'  where worker_code = 'LTHIEN';
update workers set worker_code = 'TXL02'  where worker_code = 'TVTRANG';
update workers set worker_code = 'TXL01'  where worker_code = 'NTNAM';
update workers set worker_code = 'TN001'  where worker_code = 'LQHIEP';
update workers set worker_code = 'TN002'  where worker_code = 'DCTHANH';
