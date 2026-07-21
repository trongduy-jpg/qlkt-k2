# Supabase setup

Toan bo migration nam trong `supabase/migrations/`, danh so theo dung
thu tu phai chay trong Supabase SQL Editor (project moi chay tu dau,
project da co chi can chay file con thieu):

1. `0001_schema.sql` - bang nen tang: materials, workers, production_orders,
   material_movements, price_periods, audit_logs.
2. `0002_phase1_google_sheet_schema.sql` - mo rong theo du lieu Google Sheet
   da export (chay sau 0001).
3. `0003_production_business_rules_upgrade.sql` - them cot cho production_orders
   phuc vu LSX/hao hut (chay sau 0001).
4. `0004_worker_box_schema.sql` - bang ky ton hop tho (chay sau 0001, 0002).
5. `0005_filter_indexes.sql` - index phuc vu loc du lieu (chay sau 0001, 0002, 0004).
6. `0006_seed.sql` - du lieu mau (chay sau 0001; khong bat buoc, chi de demo).
7. `0007_production_stages_schema.sql` - bang cong doan (production_stages),
   quan ly qua tab "Cong doan" trong Cau hinh.
8. `0008_reference_options_schema.sql` - bang danh muc dropdown dung chung
   (reference_options), quan ly qua tab "Danh muc khac" trong Cau hinh.
9. `0009_app_users_schema.sql` - whitelist dang nhap (app_users) + RLS.
   **QUAN TRONG**: truoc khi chay, sua email `admin@example.com` trong file
   thanh email that cua ban - day la buoc bootstrap tai khoan Admin dau tien.
10. `0010_business_tables_rls.sql` - bat RLS cho toan bo bang nghiep vu con
    lai (materials, workers, production_orders, material_movements,
    price_periods, audit_logs, production_stages, reference_options).
    **Phai chay sau 0009** va phai co san it nhat 1 dong trong `app_users`
    truoc khi bat, neu khong se khong ai doc/ghi duoc gi sau khi bat RLS.
11. `0011_fix_app_users_recursion.sql` - sua loi "infinite recursion
    detected in policy for relation app_users" khi dang nhap (bug trong
    policy `app_users_admin_write` cua 0009 ban cu, tu truy van lai chinh
    no). **Chi can chay neu ban da chay 0009 TRUOC khi file 0009 duoc sua
    lai** (0009 hien tai da fix san loi nay cho lan chay dau tien).
12. `0012_update_production_stages.sql` - cap nhat danh muc cong doan
    (production_stages) theo dung quy trinh thuc te: xoa ma cu khong con
    dung (CDT, BIEN, PI, HTH), them ma moi (KBI, NEN, BAS), doi nghia CKE
    (Cán chỉ/cán dát) va DKB (Ra dây). **Chi can chay neu ban da chay 0007
    TRUOC khi file 0007 duoc sua lai** (0007 hien tai da co san danh muc
    dung cho lan chay dau tien).
13. `0013_update_nguon_nvl_ma_nxt.sql` - thay 7 dong demo cua danh muc
    "Ma noi NXT" (reference_options, list_key `nguon_nvl`) bang ~74 ma
    thuc te (NL/BOT/VAYHAN/PK/BTPBI/BTPDAY/TP x Vang/Bac/PT). Dropdown
    "Ma noi NXT" trong Nhat ky NVL da tu dong nhom theo loai hinh
    (optgroup) de de chon giua danh sach dai.
14. `0014_worker_multi_stage.sql` - doi bang `workers` tu "1 tho - 1 khau
    co dinh" sang "1 tho - nhieu khau co the dam nhan" (them cot
    `stages text[]`, backfill tu cot `stage` cu). **Chi can chay neu ban
    da chay 0001 TRUOC khi file 0001 duoc cap nhat** (0001 hien tai da co
    san cot `stages` cho lan chay dau tien).
15. `0015_real_workers_and_new_stages.sql` - them 19 ma cong doan moi
    phat hien tu danh muc tho thuc te (KHO, GSK, CDA, DLL, KDA, HAN, TV,
    CVB, XMA, NAUPK, KCH, CCD, HCO, DBI, HBK, HUY, HBT, BHH, NPK) va nhap
    18 tho thuc te (worker_code = "Ma ten" trong file goc, vi "Ma so" bi
    trung giua 2 nguoi trong file goc). **Khong xoa tho demo cu** (TD003/
    TD004) de tranh vi pham khoa ngoai neu da co giao dich gan voi ho -
    xoa thu cong qua Cau hinh neu can, sau khi da chuyen giao dich sang
    tho khac.
16. `0016_revert_extra_stages.sql` - rut gon danh muc cong doan ve lai
    dung 12 khau xu ly NVL (bo 19 ma cua 0015 - cac ma do thuc ra la vai
    tro/cong viec khac nhu KHO=thu kho, TV=tu van, khong phai khau xu ly
    NVL). Loc lai `stages` cua tung tho, chi giu ma nam trong 12 khau.
    **Phai chay sau 0015**.

Sau MOI lan chay migration them cot/bang moi, chay them:

```sql
NOTIFY pgrst, 'reload schema';
```

de PostgREST nhan schema moi ngay, khong can doi cache tu het han.

Sau do tao file `.env.local` o root project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Them migration moi

Them file moi voi so thu tu tiep theo (vi du `0010_...sql`), ghi ro trong
file do can chay sau migration nao (comment dau file), va cap nhat danh
sach o tren.

## Ghi chu bao mat

- Sau khi chay du 0001-0010, toan bo bang nghiep vu deu co RLS: chi tai
  khoan da dang nhap VA co email trong `app_users` moi doc/ghi duoc
  (khong phan biet admin/nhan_vien o muc RLS - phan quyen Cau hinh chi
  admin moi vao duoc van do man hinh tu kiem soat, khop voi cach app dang
  hoat dong).
- `app/layout.tsx` da bat lai `AuthGate` - moi nguoi truy cap deu phai
  dang nhap bang email da duoc admin them vao `app_users` truoc.
- Neu can demo/trinh bay ma khong muon bat buoc dang nhap, co the tam
  thoi bo `<AuthGate>` khoi `app/layout.tsx` - nhung nen nho bat lai va
  dam bao 0010 da chay truoc khi dua du lieu that vao he thong.
