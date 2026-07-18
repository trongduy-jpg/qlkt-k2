# Domain Model

## ProductionOrderHeader
Thong tin dau don cua LSX.

### Vai tro
- Dinh danh mot lenh san xuat.
- Chua metadata cua don hang.
- Lam nguon prefill cho NK NVL.

### Khong chua
- Khong phai source of truth cho phat sinh xuat/nhap gram.
- Khong thay the giao dich NVL.

## MaterialMovement
Ban ghi giao dich NVL.

### Vai tro
- Ghi nhan phat sinh thuc te.
- Dung de tinh hao, doi soat, tong hop bao cao.
- Gan voi LSX qua `code`.

## MaterialMaster
Danh muc nguyen vat lieu chuan de dua vao dropdown va mapping nghiep vu.

## WorkerMaster
Danh muc tho / cong nhan / nhom thao tac, phuc vu dropdown va bo loc.

## LossReportRow
Dong bao cao tong hop duoc suy ra tu MaterialMovement va quy tac tinh hao.

## WorkerBalanceRow
Dong ton hop tho suy ra tu giao dich va bo quy tac doi soat.
