# Data Dictionary - Lenh san xuat

## Muc dich
File nay dinh nghia cac truong thong tin duoc phep ton tai trong section Lenh san xuat.

| Field | Type | Required | Input | Editable | Notes |
|---|---|---:|---|---|---|
| code | string | yes | text | yes | Ma LSX |
| sku | string | yes | text | yes | Ma hang |
| productName | string | no | text | yes | Ten hang / dien giai |
| destination | string | no | dropdown | yes | Noi nhan |
| qtyPiece | number | no | number | yes | So luong |
| orderDate | date | no | date | yes | Ngay dat hang |
| plannedDate | date | no | date | yes | Ngay ke hoach |
| plannedMaterial | string | no | dropdown | yes | NVL du kien |
| materialSpec | string | no | dropdown | yes | Loai nguyen lieu |
| deliveryStatus | string | no | dropdown | yes | Trang thai LSX |
| orderMonth | string | no | month | yes | Thang |
| salesType | string | no | dropdown | yes | SR/KH |
| customerName | string | no | text | yes | Khach hang |
| specification | string | no | text | yes | Quy cach |
| deadlineDate | date | no | date | yes | Deadline don hang |
| completedDate | date | no | date | yes | Ngay HT |
| deliveredQty | number | no | number | yes | SL da giao |
| actualProgressNote | string | no | textarea | yes | Dien giai tien do thuc |
| completedWeightGram | number | no | number | yes | TL hoan tat (GR) |

## Dropdown sources

### destination
- CH1
- CH2
- CH3
- ADM2
- PKD Si
- PSX L2

### materialSpec
Chi cho phep danh sach loai nguyen lieu da duoc user chot trong module.

### deliveryStatus
- Hoan tat
- Chua Hoan Tat
- Chua giao du
- Ngung San Xuat

### salesType
- SR
- KH

## Rule
- Lenh san xuat chi chua thong tin dau don.
- Khong nhap xuat gram, nhap gram, chuyen gram trong LSX.
- Sau khi tao LSX, phat sinh thuc te phai duoc cap nhat trong NK NVL.
