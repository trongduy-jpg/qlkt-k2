# Workflow LSX to NK NVL

## Muc tieu
Dam bao user tao LSX o dung noi, sau do cap nhat phat sinh NVL o dung noi, va khi mo lai thi thay dung du lieu gan nhat.

## Required behavior

### A. Tao LSX
- User chi nhap thong tin dau don tai Lenh san xuat.
- Khong nhap xuat/nhap gram trong LSX.

### B. Hien thi hang cho
- Moi LSX chua co giao dich NVL phai xuat hien trong khu "Hang cho cap nhat NVL".
- Khu nay la compact list hoac bang, khong phai card lon trung lap.

### C. Bat dau cap nhat NVL
- Khi user bam `Bat dau cap nhat`, form NK NVL mo ra.
- Form duoc prefill tu LSX neu day la lan dau.

### D. Mo lai LSX da cap nhat
- Neu LSX da co du lieu dang nhap do hoac da co giao dich, he thong khong duoc mo form trang.
- He thong phai nap lai:
  1. draft theo ma LSX
  2. giao dich gan nhat theo ma LSX
  3. header LSX

### E. Sau khi luu giao dich dau tien
- LSX khong con duoc coi la "LSX moi hoan toan".
- Khi user quay lai mo cung LSX, he thong phai mo theo du lieu da ton tai.

## Invalid behavior
- Mo lai cung LSX nhung mat field vua nhap.
- Chi giu ma LSX va ma hang, con lai ve rong.
- Dung du lieu header LSX de ghi de len du lieu giao dich da ton tai.
