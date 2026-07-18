# Data Dictionary - Nhat ky NVL

## Muc dich
File nay dinh nghia cac truong thong tin duoc phep ton tai trong section Nhat ky NVL.

| Field | Type | Required | Input | Editable | Notes |
|---|---|---:|---|---|---|
| code | string | yes | prefill | limited | Ma LSX |
| sku | string | yes | prefill | limited | Ma hang |
| productName | string | no | prefill/text | limited | Ten hang |
| occurredDate | date | yes | date | yes | Ngay nghiep vu |
| destination | string | no | dropdown | yes | Noi nhan |
| documentNo | string | no | text | yes | So CT xuat |
| documentInNo | string | no | text | yes | So CT nhap |
| documentLineNo | string | no | text | yes | STT dong |
| stage | string | yes | dropdown | yes | Cong doan |
| worker | string | yes | dropdown | yes | Tho phu trach |
| qtyPiece | number | no | number | yes | So luong vien/soi |
| issued | number | no | number | yes | Xuat gram |
| returned | number | no | number | yes | Nhap gram |
| status | string | yes | dropdown | yes | Trang thai tinh hao |
| movementType | string | no | dropdown | yes | Dien giai giao dich |
| lossPeriod | string | no | month | yes | Thang tinh hao |
| nxtPeriod | string | no | month | yes | Thang NXT |
| goldAge | string/number | no | dropdown | yes | Tuoi vang |
| nxtLinkCode | string | no | dropdown | yes | Ma noi NXT |
| importSource | string | no | dropdown | yes | Nguon nhap |
| exportSource | string | no | dropdown | yes | Nguon xuat |
| convertedIssueWeight | number | no | number | yes | TL quy KCP xuat |
| convertedReturnWeight | number | no | number | yes | TL quy KCP nhap |
| stageStatus | string | yes | dropdown | yes | Trang thai cong doan |

## Dropdown sources

### status
- Treo no
- Xac dinh

### goldAge
- 24K
- 18K
- 17K
- 16K
- 15K
- 10K
- PT
- BAC

### importSource
- US
- VN
- KS
- PK
- L2
- CD
- BH

### exportSource
- KT
- L2
- BK
- CD
- BH

### stageStatus
- Dang thuc hien
- Hoan thanh

## Rule
- NK NVL la noi ghi nhan du lieu thuc te.
- Khi mo lai form theo ma LSX, phai uu tien du lieu gan nhat cua chinh LSX do.
- Khong reset ve du lieu goc cua LSX neu LSX da co draft hoac da co giao dich.
