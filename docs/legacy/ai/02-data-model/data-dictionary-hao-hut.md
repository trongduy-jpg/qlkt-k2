# Data Dictionary - Bao cao hao hut

| Field | Type | Notes |
|---|---|---|
| stage | string | Cong doan |
| movementCount | number | Dong phat sinh |
| material | string | Loai vang / NVL |
| issued | number | Tong xuat |
| returned | number | Tong nhap |
| loss | number | Hao hut |
| convertedLoss24k | number | Hao hut quy 24K |
| workerName | string | Ten tho |
| lsxCode | string | So LSX |
| sku | string | Ma hang |
| status | string | Trang thai |

## Rule
- Bao cao hao hut la tong hop tu MaterialMovement.
- Khong chia giao dien thanh qua nhieu khung neu user chi can xem theo cong doan va loai vang.
