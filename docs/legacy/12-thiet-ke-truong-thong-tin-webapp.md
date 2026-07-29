# Thiet ke truong thong tin webapp KT NVL KHU 2

Tai lieu nay de xuat cac bang va truong thong tin chuan hoa tu 13 Google Sheet nguon. Muc tieu la xay webapp co du truong nghiep vu nhung khong be nguyen cau truc Google Sheet vao database.

## 1. Nguyen tac thiet ke

- Moi dong giao dich phai gan duoc voi ngay, chung tu, LSX/don hang, NVL, tho/cong doan va nguon phat sinh.
- Cac bang danh muc phai tach rieng: NVL, tho, cong doan, khach hang, cua hang, san pham.
- Cac bang giao dich chi luu su kien phat sinh; bao cao NXT, hao hut, ton hop tho nen tinh tu giao dich.
- Gia tinh hao va dinh muc hao hut phai co ky ap dung, trang thai duyet va audit.
- Sau khi chot ky/LSX/bao cao, du lieu can khoa va chi mo lai bang quyen quan ly.

## 2. Danh muc nen

### 2.1. `materials`

Quan ly nguyen vat lieu, tuoi vang/bac/PT va don vi.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| code | text | Ma NL/NVL: NL24K, NL18K, PT900, BAC925 |
| name | text | Ten nguyen lieu |
| material_group | text | gold, silver, platinum, other |
| purity | numeric | Tuoi/ham luong: 0.9999, 0.75, 0.925 |
| unit | text | gram, luong, chi |
| default_conversion_base | text | 24K, 99.99, gram |
| is_active | boolean | Con su dung hay khong |
| created_at | timestamptz | Ngay tao |

### 2.2. `workers`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| worker_code | text | Ma tho |
| short_code | text | Ma ten/ma gop neu co |
| full_name | text | Ho ten |
| department | text | Bo phan/kho |
| stage_id | uuid | Cong doan mac dinh |
| is_active | boolean | Con lam viec hay khong |

### 2.3. `process_stages`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| code | text | NAU, CAN, DAN, HAN, DUC, XI |
| name | text | Ten cong doan |
| group_name | text | Nhom cong doan |
| loss_norm_default | numeric | Dinh muc mac dinh neu co |
| is_inventory_stage | boolean | Co anh huong NXT/ton hop tho |

### 2.4. `customers` va `stores`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| code | text | Ma khach/cua hang |
| name | text | Ten khach/cua hang |
| channel | text | CH, KD si, noi bo |
| contact_note | text | Ghi chu |

### 2.5. `products`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| sku | text | Ma san pham/ma hang |
| name | text | Ten san pham |
| product_group | text | Day, bi, nhan, bac, phu kien |
| product_type | text | Loai SP |
| material_id | uuid | NVL chinh |
| size_spec | text | Size, ket cau |
| standard_weight_gram | numeric | TL 1 SP neu co |

## 3. Don hang va ke hoach san xuat

### 3.1. `sales_orders`

Tu cac sheet theo doi don hang, ke hoach san xuat, de xuat NVL.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| order_code | text | Ma DH / DHAG |
| po_number | text | So PO |
| store_id | uuid | Cua hang/bo phan dat |
| customer_id | uuid | Khach hang |
| order_date | date | Ngay dat hang |
| deadline_date | date | Deadline don hang |
| confirmed_date | date | Ngay xac nhan |
| completed_date | date | Ngay hoan tat |
| status | text | new, confirmed, in_production, partial_done, done, cancelled |
| progress_status | text | Tien do hoan thanh |
| warning_status | text | Canh bao deadline |
| note | text | Ghi chu |

### 3.2. `sales_order_items`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| sales_order_id | uuid | Don hang cha |
| product_id | uuid | Ma san pham |
| material_id | uuid | Loai vang/NVL |
| ordered_qty | numeric | SL dat |
| delivered_qty | numeric | SL da giao |
| remaining_qty | numeric | SL con lai |
| estimated_weight_gram | numeric | TL du kien |
| delivered_weight_gram | numeric | TL da giao |
| remaining_weight_gram | numeric | TL chua HT |
| converted_24k_chi | numeric | TL quy 24K |
| item_status | text | Trang thai dong hang |

### 3.3. `production_orders`

Bang nay nen mo rong tu bang hien tai.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| production_code | text | Lenh san xuat/LSX |
| sales_order_id | uuid | Gan voi don hang |
| product_id | uuid | Ma hang |
| planned_start_date | date | Ngay bat dau KH |
| planned_end_date | date | Ngay ket thuc KH |
| actual_start_date | date | Ngay bat dau thuc te |
| actual_end_date | date | Ngay ket thuc thuc te |
| status | text | dang_xu_ly, treo_no, xac_dinh, da_chot, mo_lai |
| locked_at | timestamptz | Thoi diem chot/khoa |
| locked_by | uuid | Nguoi chot |
| reopen_reason | text | Ly do mo lai |

### 3.4. `production_tasks`

Quan ly ke hoach ngay theo nhan vien/cong doan.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| production_order_id | uuid | LSX |
| worker_id | uuid | Nhan vien/tho |
| stage_id | uuid | Cong doan |
| task_date | date | Ngay |
| work_code | text | Ma cong viec |
| work_content | text | Noi dung cong viec |
| plan_start_time | time | Gio bat dau KH |
| plan_end_time | time | Gio ket thuc KH |
| actual_start_time | time | Gio bat dau TT |
| actual_end_time | time | Gio ket thuc TT |
| plan_weight_gram | numeric | Khoi luong KH |
| actual_weight_gram | numeric | Khoi luong HT |
| completion_rate | numeric | Ty le HT |
| status | text | planned, doing, done, delayed |

## 4. De xuat, cap va mua NVL

### 4.1. `material_requests`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| request_code | text | Ma de xuat |
| sales_order_id | uuid | Don hang |
| production_order_id | uuid | LSX neu co |
| request_period | text | Tuan/thang |
| material_id | uuid | NVL |
| requested_weight_gram | numeric | TL NVL de xuat |
| requested_weight_chi | numeric | TL NVL de xuat theo chi/luong |
| issued_weight_gram | numeric | TL da cap |
| remaining_weight_gram | numeric | Con lai |
| supplement_weight_gram | numeric | TL can bo cap |
| deadline_date | date | Deadline de xuat |
| status | text | draft, submitted, approved, issued, closed |
| note | text | Ghi chu |

### 4.2. `material_purchase_transactions`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| occurred_date | date | Ngay nhap/xuat |
| document_no | text | So chung tu |
| direction | text | import, export |
| material_id | uuid | NVL |
| item_code | text | Ma hang theo sheet mua |
| item_name | text | Ten ma hang |
| description | text | Dien giai |
| unit_price_vnd_per_luong | numeric | Don gia |
| amount_vnd | numeric | Thanh tien |
| initial_qty_luong | numeric | Qty ban dau |
| initial_weight_gram | numeric | TL ban dau |
| actual_qty_luong | numeric | Qty thuc nhan |
| actual_weight_gram | numeric | TL thuc nhan |
| source_name | text | Nguon nhap |
| note | text | Ghi chu |

## 5. Nhat ky NVL, NXT va ton hop tho

### 5.1. `material_movements`

Bang hien tai can mo rong theo cac truong trong NKSX/NXT.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| occurred_date | date | Ngay phat sinh |
| destination | text | Noi nhan |
| document_no | text | So chung tu |
| document_line_no | text | STT/dong chung tu |
| production_order_id | uuid | LSX |
| sales_order_id | uuid | Don hang neu co |
| product_id | uuid | Ma hang |
| material_id | uuid | Loai NVL |
| stage_id | uuid | Ma cong doan |
| worker_id | uuid | Ma tho/nguoi nhan |
| movement_type | text | issue, return, transfer, finished_goods, adjustment |
| description | text | Dien giai |
| qty_piece | numeric | So luong vien/soi |
| issued_weight_gram | numeric | KCP xuat tho |
| returned_weight_gram | numeric | Nhap ve KCP |
| transferred_weight_gram | numeric | Chuyen |
| finished_weight_gram | numeric | Thanh pham |
| export_plating_weight_gram | numeric | Xuat khau xi neu co |
| loss_weight_gram | numeric | Hao hut thuc te |
| gold_age | numeric | Tuoi vang |
| source_material_name | text | Ten NL |
| source_name | text | Nguon nhan NVL |
| nxt_link_code | text | Ma noi NXT |
| loss_period | text | Thang tinh hao |
| nxt_period | text | Thang tinh NXT |
| converted_issue_weight | numeric | TL quy KCP xuat |
| converted_return_weight | numeric | TL quy KCP nhap |
| status | text | dang_xu_ly, treo_no, xac_dinh, da_chot |
| note | text | Ghi chu |

### 5.2. `worker_box_balances`

Co the la bang snapshot tinh tu movement, nhung nen luu snapshot ky de doi soat.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| period_code | text | Thang/ky |
| worker_id | uuid | Tho |
| stage_id | uuid | Cong doan |
| material_id | uuid | NVL |
| opening_weight_gram | numeric | Ton dau |
| issue_weight_gram | numeric | Xuat |
| return_weight_gram | numeric | Nhap |
| transfer_weight_gram | numeric | Chuyen |
| closing_weight_gram | numeric | Ton cuoi |
| reconciled_status | text | Chua doi soat/da doi soat |

### 5.3. `inventory_period_balances`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| period_code | text | Quy/thang/nam |
| material_id | uuid | NVL |
| material_age | numeric | Tuoi NL |
| opening_weight_gram | numeric | Ton dau nguyen |
| opening_converted_weight | numeric | Ton dau quy 24K/99.99 |
| import_weight_gram | numeric | Nhap |
| import_converted_weight | numeric | Nhap quy |
| export_weight_gram | numeric | Xuat |
| export_converted_weight | numeric | Xuat quy |
| closing_weight_gram | numeric | Ton cuoi |
| closing_converted_weight | numeric | Ton cuoi quy |

## 6. Gia tinh hao, dinh muc va hao hut

### 6.1. `price_periods`

Mo rong bang hien tai.

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| period_code | text | 2026-05 |
| material_id | uuid | Vang/bac/PT |
| purchase_date | date | Ngay mua |
| buy_price_vnd_per_luong | numeric | Gia mua vao |
| avg_price_vnd_per_luong | numeric | Gia binh quan |
| converted_price_vnd_per_chi | numeric | Gia quy doi |
| usd_rate | numeric | Ty gia neu co |
| source | text | Nguon du lieu |
| approval_status | text | draft, submitted, approved |
| approved_at | timestamptz | Ngay duyet |
| approved_by | uuid | Nguoi duyet |

### 6.2. `loss_norms`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| norm_code | text | Ma dinh muc |
| stage_id | uuid | Cong doan |
| material_id | uuid | NVL |
| product_group | text | Nhom SP neu co |
| effective_from | date | Hieu luc tu |
| effective_to | date | Hieu luc den |
| norm_rate | numeric | Ty le dinh muc |
| note | text | Ghi chu |

### 6.3. `loss_settlements`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| period_code | text | Thang tinh hao |
| worker_id | uuid | Doi tuong |
| stage_id | uuid | Cong doan |
| material_id | uuid | NVL |
| production_order_id | uuid | LSX neu quy ve duoc |
| actual_loss_weight | numeric | Hao hut thuc te |
| allowed_loss_weight | numeric | Hao hut cho phep |
| exceeded_loss_weight | numeric | Hao hut vuot |
| price_period_id | uuid | Gia tinh hao |
| settlement_amount_vnd | numeric | Thanh tien |
| status | text | draft, review, approved, paid, closed |
| responsibility_note | text | Ghi chu xu ly |

## 7. Phan kim

### 7.1. `refining_batches`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| batch_code | text | So phieu PK |
| export_date | date | Ngay xuat PK |
| return_date | date | Ngay nhap PK |
| partner_name | text | Doi tac/phong ban |
| material_id | uuid | NVL |
| input_weight_gram | numeric | TL xuat PK |
| input_converted_weight | numeric | Quy 24K/99.99 |
| output_weight_gram | numeric | TL nhap PK |
| output_converted_weight | numeric | Quy 24K/99.99 |
| melt_difference_weight | numeric | Chenh lech nau |
| refining_difference_weight | numeric | Chenh lech PK |
| loss_rate | numeric | Ty le hao hut |
| cost_amount_vnd | numeric | Chi phi PK |
| status | text | draft, sent, received, settled |

## 8. Audit va phan quyen

### 8.1. `audit_logs`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Khoa chinh |
| actor_id | uuid | Nguoi thao tac |
| entity_name | text | Bang/doi tuong |
| entity_id | uuid | ID doi tuong |
| action | text | create, update, delete, close, reopen, approve |
| before_data | jsonb | Du lieu truoc |
| after_data | jsonb | Du lieu sau |
| reason | text | Ly do neu can |
| created_at | timestamptz | Thoi diem |

### 8.2. `user_profiles`

| Truong | Kieu du lieu | Ghi chu |
| --- | --- | --- |
| id | uuid | Map voi auth.users |
| full_name | text | Ho ten |
| email | text | Email |
| role | text | admin, kt, manager, warehouse, viewer |
| department | text | Bo phan |
| is_active | boolean | Kich hoat |

## 9. So sanh voi schema hien tai

Schema hien tai da co:

- `materials`
- `workers`
- `production_orders`
- `material_movements`
- `price_periods`
- `audit_logs`

Can bo sung hoac mo rong:

- `process_stages`
- `customers`
- `stores`
- `products`
- `sales_orders`
- `sales_order_items`
- `production_tasks`
- `material_requests`
- `material_purchase_transactions`
- `worker_box_balances`
- `inventory_period_balances`
- `loss_norms`
- `loss_settlements`
- `refining_batches`
- `user_profiles`

Uu tien gan nhat: mo rong `production_orders`, `material_movements`, them `sales_orders`, `products`, `process_stages`, `material_requests`, `loss_norms`.
