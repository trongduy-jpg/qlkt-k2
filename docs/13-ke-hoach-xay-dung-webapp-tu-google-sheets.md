# Ke hoach xay dung webapp tu Google Sheets

Muc tieu: chuyen he thong Google Sheet KT NVL KHU 2 thanh webapp co database Supabase, giao dien Next.js, co phan quyen, audit va bao cao.

## 1. Hien trang webapp hien tai

Da co:

- Next.js/React/TypeScript.
- Supabase connection.
- Bang `materials`, `workers`, `production_orders`, `material_movements`, `price_periods`, `audit_logs`.
- Dashboard co KPI co ban.
- Them giao dich NVL.
- Doi trang thai giao dich.
- Xoa giao dich.
- Chot LSX va khoa thao tac sau khi chot.
- Danh muc NVL va tho co the them nhanh.
- Bao cao hao hut co ban theo du lieu movement hien tai.

Dang thieu so voi Google Sheets:

- Don hang/PO va chi tiet don hang.
- Tien do don hang va deadline.
- Ke hoach san xuat ngay.
- De xuat NVL va bo cap NVL.
- Theo doi mua NVL vang/bac/PT.
- Ton hop tho.
- NXT NVL.
- Gia tinh hao day du theo thang.
- Dinh muc hao hut.
- Bao cao hao hut theo doi tuong/cong doan.
- Phan kim.
- Phan quyen va RLS.
- Import CSV co mapping.

## 2. Kien truc module webapp de xuat

### 2.1. Dashboard dieu hanh

Muc tieu: xem nhanh tinh hinh van hanh.

Can co:

- Tong LSX dang xu ly.
- LSX treo no.
- LSX qua deadline.
- NVL da cap, can bo cap.
- Hao hut vuot dinh muc.
- Ton hop tho bat thuong.
- NXT NVL theo quy/thang.
- Canh bao gia tinh hao chua duyet.

### 2.2. Don hang va tien do

Thay the cac sheet:

- Theo doi tien do don hang.
- Ke hoach san xuat TLKT.
- Trang thai don hang.

Chuc nang:

- Tao/import don hang.
- Quan ly PO, ma hang, khach hang, cua hang.
- Theo doi SL dat, da giao, con lai.
- Theo doi deadline va canh bao.
- Gan don hang voi LSX.

### 2.3. Ke hoach san xuat

Thay the cac sheet:

- Ke hoach san xuat ngay L3.
- Chi tiet cong viec SX ngay.
- Bao cao ket qua SX ngay.

Chuc nang:

- Lap ke hoach theo ngay/tho/cong doan.
- Theo doi khoi luong ke hoach va thuc te.
- Tinh ty le hoan thanh.
- Theo doi cong doan: nau, can keo, dan day, han, duc, xi, hoan thien.

### 2.4. De xuat va cap NVL

Thay the cac sheet:

- De xuat NVL 2026.
- Ke hoach NVL don hang.
- Trang thai NVL.

Chuc nang:

- Tao de xuat NVL theo don hang/PO.
- Tinh TL NL theo he so, quay dau, de xuat, da cap, con lai.
- Theo doi bo cap NVL.
- Gan de xuat voi LSX va movement thuc te.
- Trang thai: nhap, gui duyet, da duyet, da cap, dong.

### 2.5. Nhat ky NVL

Thay the cac sheet:

- Nhat ky san xuat thang.
- Du lieu tong NXT.
- Du lieu tong hao hut.

Chuc nang:

- Nhap/xuat/chuyen/nhap ve KCP.
- Gan voi LSX, ma hang, tho, cong doan, NVL.
- Tu dong tinh hao hut: xuat - nhap - chuyen/thanh pham tuy nghiep vu.
- Chot LSX, khoa giao dich.
- Mo lai LSX co ly do va audit.

### 2.6. Ton hop tho

Thay the sheet:

- Bao cao ton hop tho.

Chuc nang:

- Xem ton dau ky, nhap, xuat, chuyen, ton cuoi theo tho.
- Loc theo thang, tho, cong doan, NVL.
- Doi soat voi nhat ky NVL.
- Ghi nhan trang thai da doi soat.

### 2.7. NXT NVL

Thay the sheet:

- Bao cao NXT NVL.
- Bao cao quan tri NVL vang/PT/bac.

Chuc nang:

- Bao cao nhap/xuat/ton theo NVL.
- Xem quy 24K/99.99.
- Xem theo quy/thang/nam.
- Theo doi nguon nhan NVL.
- Xuat bao cao Excel/CSV.

### 2.8. Gia va dinh muc

Thay the sheet:

- De xuat duyet gia tinh hao.
- Dinh muc hao hut.

Chuc nang:

- Quan ly gia vang, bac, PT theo thang.
- Luu gia mua vao, gia binh quan, gia quy doi.
- Duyet gia tinh hao.
- Quan ly dinh muc hao hut theo cong doan/NVL/nhom SP.

### 2.9. Bao cao hao hut

Thay the sheet:

- Bao cao tong hop hao hut.

Chuc nang:

- Bao cao hao hut theo doi tuong.
- Bao cao hao hut theo cong doan.
- So sanh hao hut thuc te voi dinh muc.
- Tinh hao hut vuot va thanh tien theo gia da duyet.
- Trang thai xu ly: nhap, doi soat, duyet, quyet toan.

### 2.10. Phan kim

Thay the sheet:

- Bao cao tong hop ket qua phan kim.

Chuc nang:

- Tao lo phan kim.
- Ghi xuat PK, nhap PK.
- Tinh chenhlech nau, chenhlech PK, ty le hao hut.
- Theo doi chi phi PK.
- Bao cao hieu qua PK.

### 2.11. Cau hinh va phan quyen

Chuc nang:

- Danh muc NVL.
- Danh muc tho.
- Danh muc cong doan.
- Danh muc san pham.
- Danh muc khach hang/cua hang.
- Nguoi dung va vai tro.
- Audit log.

## 3. Lo trinh thuc hien

### Giai doan 1: Chuan hoa database nen

Muc tieu: tao nen database du de thay Google Sheets chinh.

Viec can lam:

- Them bang `process_stages`.
- Them bang `products`.
- Them bang `customers`, `stores`.
- Them bang `sales_orders`, `sales_order_items`.
- Mo rong `production_orders`.
- Mo rong `material_movements`.
- Them bang `material_requests`.
- Them bang `loss_norms`.

Ket qua mong doi:

- Co the luu don hang, LSX, ma hang, tho, cong doan, NVL, de xuat NVL va nhat ky NVL trong database.

### Giai doan 2: Import CSV mau

Muc tieu: dua du lieu mau tu Google Sheet vao database de test webapp bang du lieu that.

Viec can lam:

- Viet script doc CSV va detect header.
- Mapping cac tab nguon chinh:
  - Nhat ky san xuat.
  - Theo doi tien do don hang.
  - Ke hoach NVL.
  - Mua NVL.
  - Gia tinh hao.
  - Hao hut.
  - NXT.
- Import truoc 1-2 thang gan nhat, khong import toan bo ngay lap tuc.

Ket qua mong doi:

- Dashboard va cac module doc du lieu that tu Supabase.

### Giai doan 3: Xay module Don hang / LSX

Muc tieu: user co the thay the sheet theo doi tien do don hang.

Viec can lam:

- Man hinh danh sach don hang.
- Man hinh chi tiet don hang.
- Gan ma hang/so luong/deadline.
- Tao LSX tu don hang.
- Canh bao qua deadline.

### Giai doan 4: Xay module De xuat NVL va Nhat ky NVL

Muc tieu: day la luong KT dung hang ngay.

Viec can lam:

- Tao de xuat NVL theo don hang.
- Phe duyet/cap NVL.
- Nhap nhat ky xuat/nhap/chuyen.
- Chot LSX.
- Mo lai LSX co ly do.
- Audit day du.

### Giai doan 5: Xay Ton hop tho va NXT

Muc tieu: thay cac bao cao ton hop tho va NXT.

Viec can lam:

- Bao cao ton hop tho theo thang.
- Bao cao NXT theo NVL.
- Bao cao quan tri vang/bac/PT theo quy.
- Doi soat ton cuoi.

### Giai doan 6: Xay Gia, dinh muc va Hao hut

Muc tieu: tinh hao hut vuot va quyet toan bang gia da duyet.

Viec can lam:

- Nhap/duyet gia tinh hao.
- Quan ly dinh muc hao hut.
- Tinh hao hut theo doi tuong/cong doan.
- Tinh thanh tien hao hut vuot.
- Xuat bao cao hao hut.

### Giai doan 7: Phan kim va quan tri nang cao

Muc tieu: bao phu phan kim va chi phi PK.

Viec can lam:

- Tao lo phan kim.
- Theo doi xuat/nhap PK.
- Tinh chenhlech va chi phi.
- Bao cao hieu qua PK.

### Giai doan 8: Phan quyen, RLS, deploy

Muc tieu: san sang demo noi bo/prod.

Viec can lam:

- Supabase Auth.
- Role admin/KT/quan ly/kho/viewer.
- RLS policy.
- Audit log bat buoc.
- Deploy Vercel.
- Backup va quy trinh import du lieu.

## 4. Uu tien code tiep theo

Nen bat dau ngay bang thu tu:

1. Tao schema SQL moi cho cac bang nen: `process_stages`, `products`, `sales_orders`, `sales_order_items`, `material_requests`, `loss_norms`.
2. Mo rong `material_movements` de chua du truong cua NKSX/NXT.
3. Tao man hinh Don hang/LSX rieng, khong de tat ca chung trong `MaterialDashboard`.
4. Tao import preview cho CSV: user chon file, he thong hien header mapping truoc khi import.
5. Ket noi module Gia & dinh muc voi Supabase that.

## 5. Tieu chi demo tot voi sep/user

Demo tiep theo nen chung minh duoc:

- Lay du lieu that tu Google Sheet CSV.
- Xem don hang va LSX ro rang.
- Nhap/xuat NVL theo tho va cong doan.
- Chot LSX thi khoa so lieu.
- Xem ton hop tho/NXT/hao hut tu cung mot nguon database.
- Co audit log cho thao tac quan trong.

Neu dat duoc cac diem tren, webapp se khong con la demo giao dien nua ma da thanh ban MVP nghiep vu co the doi chieu voi Google Sheets thuc te.
