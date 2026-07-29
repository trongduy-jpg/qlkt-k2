# Database Rules

## Source of truth
- `production_order_headers`: thong tin dau don
- `material_movements`: giao dich NVL
- `materials`: master NVL
- `workers`: master tho
- `audit_logs`: lich su thao tac

## Rule mapping
- `material_movements.code` phai map voi `production_order_headers.code`
- Khong duoc xem `production_order_headers` la noi luu giao dich thuc te

## Rule reopen form
- Neu `material_movements` da co ban ghi theo `code`, form NK NVL phai uu tien du lieu nay hoac draft cache.

## Rule status
- Chot LSX phai chan them giao dich moi.
- Doi status movement co the anh huong tong hop status cua LSX.
