# MVP Scope - He thong theo doi NVL va hao hut

Ngay tao: 2026-07-07

## 1. Muc tieu MVP

MVP dung de xac nhan luong nghiep vu cot loi truoc khi noi day du Supabase va trien khai Vercel.

Muc tieu cua ban dau:

- Theo doi lenh san xuat theo ma LSX, ma hang, tho, cong doan.
- Ghi nhan xuat/nhap NVL, bot hoan tra va hao hut thuc te.
- Phan biet trang thai van hanh: Dang xu ly, Treo no, Xac dinh, Da chot.
- Hien thi canh bao cho cac lenh treo no, vuot dinh muc, cho duyet gia.
- Quan ly bang gia/ham luong co ban de lam nen cho quy doi 99.99.
- Chuan bi cau truc du lieu de noi Supabase.

## 2. Nguoi dung MVP

- Ban Giam doc: xem dashboard, canh bao, bao cao tong hop.
- KT NVL: quan ly gia NVL, danh muc vat lieu, gia ap dung theo ky.
- KT Tong hop: xem hao hut, lap quyet toan, chot ky.
- KCP/KCS: nhap trong luong xuat/nhap, QC, cap nhat trang thai treo no/xac dinh.
- Tho san xuat: xem giao dich va cong no ca nhan.

## 3. Module lam trong buoc 1

### Dashboard

- KPI gia da duyet.
- Tong NVL treo no.
- Hao hut vuot dinh muc.
- So LSX can doi soat.
- Canh bao van hanh.

### Lenh san xuat va nhat ky NVL

- Danh sach LSX.
- Loc theo tu khoa va trang thai.
- Them giao dich demo tren giao dien.
- Tinh hao hut thuc te tu xuat, nhap, bot.
- Gan trang thai cho tung giao dich.

### Gia va dinh muc

- Hien thi bang gia mau.
- Theo doi trang thai Nhap, Cho duyet, Da duyet.
- Chua lam workflow phe duyet that trong buoc 1.

### Supabase foundation

- Tao schema SQL ban dau.
- Chua bat buoc dang nhap.
- Chua bat buoc query du lieu that trong MVP local.

## 4. Chua lam trong buoc 1

- Dang nhap va phan quyen that.
- Import Excel.
- Export Excel that.
- Workflow phe duyet gia nhieu cap.
- Audit log tu dong.
- Bao cao PDF.
- Lay gia tu Kitco/DailyMetalPrice.
- Deploy Vercel production.

## 5. Dieu kien de chuyen sang buoc 2

- UI demo dung voi cach KT/KCP dang hieu nghiep vu.
- Danh sach trang thai khong bi sai.
- Cong thuc hao hut thuc te duoc xac nhan.
- Cac bang Supabase du cho luong LSX -> NVL -> hao hut -> quyet toan.
- Co tai khoan Supabase va bien moi truong `.env.local`.

## 6. Luong nghiep vu MVP

1. Tao hoac nhan LSX.
2. Gan ma hang, NVL, tho va cong doan.
3. KCP/KCS ghi trong luong xuat.
4. Khi nhap ve, ghi trong luong nhap va bot hoan tra.
5. He thong tinh hao hut thuc te.
6. Neu chua du dieu kien chot, de trang thai Treo no.
7. Neu da doi soat, chuyen sang Xac dinh.
8. Cuoi ky, KT tong hop chot thanh Da chot.

## 7. Uu tien tiep theo

1. Noi bang `production_orders` va `material_movements` tu Supabase.
2. Them form tao LSX that.
3. Them form nhap giao dich xuat/nhap that.
4. Them audit log khi sua trong luong/trang thai.
5. Them auth va role-based access control.
