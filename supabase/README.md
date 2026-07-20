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

- Hien tai **chi bang `app_users` co RLS** (bat trong 0009). Cac bang
  nghiep vu con lai (production_orders, material_movements, materials,
  workers...) **chua co RLS** - anon key dang co quyen doc/ghi toan bo.
  Day la rui ro can xu ly truoc khi dung voi du lieu that/noi bo chinh thuc.
- Demo hien tai (xem `app/layout.tsx`) dang **tat man dang nhap** de tien
  trinh bay - AuthGate chua duoc bat lai trong layout. Nho bat lai truoc
  khi dua he thong vao dung that.
