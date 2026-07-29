# Phan tich Google Sheets nguon

Ngay phan tich: 10/07/2026

## 1. Tong quan du lieu export

Bo du lieu export nam trong:

```txt
data/qlkt-google-sheets-export-20260710T065019Z-2-001/qlkt-google-sheets-export
```

Tong so tab CSV theo `_index.json`: **236 tab**.

13 nhom Google Sheet nguon:

| STT | Nhom sheet | So tab | Vai tro nghiep vu |
| --- | --- | ---: | --- |
| 01 | Nhat ky san xuat 2026 | 12 | Nguon du lieu nhap/xuat/chuyen NVL theo LSX, tho, cong doan |
| 02 | Bao cao ton hop tho 2026 | 61 | Bao cao ton dau/cuoi ky theo tho, hop tho, NVL/BTP/SPHT |
| 03 | Ke hoach san xuat ngay L3 | 12 | Ke hoach ngay, ket qua san xuat, cong viec theo nhan vien/cong doan |
| 04 | Trang thai NVL va don hang | 3 | Trang thai NVL, ke hoach bo cap, NVL can bo cap |
| 05 | Theo doi tien do don hang | 5 | Chi tiet don hang, tien do, canh bao deadline |
| 06 | De xuat NVL 2026 | 26 | De xuat NVL theo don hang/PO, tong hop cap NVL vang/bac/PT |
| 07 | Ke hoach san xuat 2026 TLKT | 11 | Ke hoach san xuat don hang theo nhom SP, deadline, cong doan |
| 08 | Bao cao tong hop ket qua phan kim | 30 | Phan kim, chi phi PK, chenhlech, hieu qua PK |
| 09 | Ke hoach NVL don hang | 3 | Ke hoach NVL thang/tuan theo don hang |
| 10 | Theo doi mua NVL vang/bac/PT | 10 | Mua/nhap/xuat NVL, gia, chung tu, nguon nhap |
| 11 | De xuat duyet gia tinh hao | 10 | Gia vang/bac/PT theo thang, gia quy doi tinh hao |
| 12 | Bao cao tong hop hao hut | 44 | Hao hut theo doi tuong, cong doan, dinh muc, duyet gia |
| 13 | Bao cao NXT NVL | 9 | Du lieu tong NXT, bao cao NXT quy/nam, quan tri NVL |

## 2. Nhan xet quan trong ve cau truc sheet

Khong the lay dong 1 lam header truc tiep. Nhieu file co:

- Dong tieu de bao cao o dau sheet.
- Dong ngay/thang/bo loc.
- Dong merge cell bi tach thanh nhieu cot rong khi export CSV.
- Header that nam o dong 3, 7, 9, 12, 16 hoac sau hon.
- Mot so tab bao cao co 2-3 dong header cha/con, can mapping lai truoc khi import.

Vi vay khi xay webapp, khong nen be nguyen tung sheet vao database. Nen tach thanh cac bang nghiep vu sach, sau do tao cac bao cao tu database.

## 3. Cac nguon du lieu goc nen uu tien

### 3.1. Nhat ky san xuat / nhat ky NVL

Nguon chinh:

- `01-01-nhat-ki-san-xuat-2026/002-06-2026.csv` va cac thang 01-06.
- `13-13-bao-cao-nxt-nvl-2026/001-du-lieu-tong.csv`
- `12-12-bao-cao-tong-hop-hao-hut-2026/006-b-du-lieu-tong.csv`

Truong thong tin lap lai:

- Noi nhan
- Ngay phat sinh
- Ma cong doan
- STT
- So chung tu
- Ma tho
- Nguoi nhan / ten tho
- Lenh san xuat
- Ma hang
- Ten hang
- Loai vang / loai NVL
- Dien giai
- So luong vien/soi
- KCP xuat tho
- Nhap ve KCP
- Chuyen
- Thang tinh hao
- Ghi chu
- Tuoi vang
- Ten NL
- Ma noi NXT
- Thang tinh NXT
- Nguon nhan NVL
- TL quy KCP xuat
- TL quy KCP nhap
- Nguon nhap

### 3.2. Don hang va tien do don hang

Nguon chinh:

- `05-05-theo-doi-tien-do-don-hang-2025-2026`
- `07-07-ke-hoach-san-xuat-2026-tlkt`
- `03-03-ke-hoach-san-xuat-ngay-l3-2026`

Truong thong tin lap lai:

- Thang
- Ngay dat hang
- Cua hang / bo phan
- Khach hang
- So PO / so don hang
- Ma san pham
- Ten san pham
- Loai vang
- So luong dat hang
- Trong luong
- Deadline don hang
- Ngay thuc hien
- Ngay hoan tat
- Trang thai don hang
- Tien do hoan thanh
- SL da giao
- SL chua hoan thanh
- TL da giao
- TL chua hoan thanh
- TL quy 24K
- Canh bao deadline

### 3.3. Ke hoach va de xuat NVL

Nguon chinh:

- `06-06-de-xuat-nvl-2026`
- `09-09-ke-hoach-nvl-don-hang`
- `04-04-trang-thai-nvl-va-don-hang`

Truong thong tin lap lai:

- Don hang
- Ma DH
- PO
- Cua hang
- Khach hang
- Loai NVL / loai vang
- Tuoi vang
- So luong
- TL san xuat
- TL thanh pham du kien
- TL NL theo he so
- TL NL quay dau
- TL NVL de xuat
- TL NVL da cap
- TL NVL con lai
- TL can bo cap
- Hoi can bo cap
- Deadline de xuat
- Ghi chu

### 3.4. Mua NVL va gia tinh hao

Nguon chinh:

- `10-10-theo-doi-mua-nvl-vang-bac-pt-2026`
- `11-11-de-xuat-duyet-gia-tinh-hao-2026`

Truong thong tin lap lai:

- Ngay nhap/xuat
- So chung tu
- Dien giai
- Ma hang
- Ten ma hang
- Don gia VND/luong
- Thanh tien VND
- Nhap NVL
- Xuat NVL
- Qty ban dau
- TL ban dau gram
- Qty thuc nhan
- TL thuc nhan gram
- Nguon nhap
- Gia vang mua vao
- Gia vang binh quan
- Gia quy doi VND/chi
- Gia bac
- Gia PT
- Gia USD
- Trang thai duyet gia

### 3.5. Hao hut va dinh muc

Nguon chinh:

- `12-12-bao-cao-tong-hop-hao-hut-2026`
- `11-11-de-xuat-duyet-gia-tinh-hao-2026`

Truong thong tin lap lai:

- Thang tinh hao
- Nam tinh hao
- Ma cong doan
- Ten cong doan
- Ma tho
- Ten tho
- Lenh san xuat
- Ma hang
- Ten hang
- Loai vang
- KCP xuat tho
- Nhap ve KCP
- Thanh pham
- Hao hut nguyen
- Hao hut quy 24K / quy 99.99
- Dinh muc hao hut
- Hao hut vuot
- Gia tinh hao
- Thanh tien hao hut
- Doi tuong chiu trach nhiem
- Ghi chu / trang thai xu ly

### 3.6. Ton hop tho va NXT NVL

Nguon chinh:

- `02-02-bao-cao-ton-hop-tho-2026`
- `13-13-bao-cao-nxt-nvl-2026`

Truong thong tin lap lai:

- Ma tho
- Ten tho
- Cong doan
- Ton dau ky
- Nhap trong ky
- Xuat trong ky
- Chuyen trong ky
- Ton cuoi ky
- Ma NL
- Ten nguyen lieu
- Tuoi nguyen lieu
- Ton nguyen
- Ton quy 24K
- Nguon nhan
- Loai NL
- Quy / thang / nam

### 3.7. Phan kim

Nguon chinh:

- `08-08-bao-cao-tong-hop-ket-qua-pk-2026`

Truong thong tin lap lai:

- So phieu PK
- Ngay xuat / ngay nhap
- Ten nguyen lieu
- Tuoi nguyen lieu
- Tong 24K xuat PK
- Tong 24K nhap PK
- Chenh lech nau
- Chenh lech PK
- Ty le hao hut
- Chi phi PK
- Don gia / thanh tien
- Doi tac / phong ban
- Ghi chu

## 4. Ket luan phan tich

He thong webapp khong chi la "theo doi NVL". Thuc te can la mot he thong quan tri luong NVL tu luc co don hang den khi quyet toan hao hut:

1. Don hang/PO.
2. Ke hoach san xuat.
3. De xuat va cap NVL.
4. Nhat ky xuat/nhap/chuyen NVL.
5. Ton hop tho va NXT kho.
6. Gia tinh hao theo ky.
7. Dinh muc va bao cao hao hut.
8. Phan kim.
9. Audit va trang thai phe duyet.

Webapp hien tai da co nen mong cho nhat ky NVL, vat lieu, tho, LSX va hao hut co ban. Cac phan thieu lon la: don hang/PO, ke hoach san xuat, de xuat NVL, mua NVL, NXT, ton hop tho, gia tinh hao day du, dinh muc hao hut va phan kim.
