# Workflow LSX to NK NVL

## Muc tieu
Dam bao user tao LSX o dung noi, sau do cap nhat phat sinh NVL o dung noi, va khi mo lai thi thay dung du lieu gan nhat.

## Required behavior

### A. Tao LSX
- User chi nhap thong tin dau don tai Lenh san xuat.
- Khong nhap xuat/nhap gram trong LSX.

### B. Chot LSX tu dong nhay vao NK NVL
- Khong con khu "Hang cho cap nhat NVL" rieng biet.
- Khi user bam `Chot LSX`, he thong tu dong tao ban ghi giao dich NVL dau tien
  (neu LSX chua co giao dich nao) va dieu huong thang vao tab "Nhat ky NVL",
  focus san theo ma LSX vua chot.
- User xem/cap nhat cac truong con thieu ngay tren dong lich su nay, roi cap nhat
  trang thai (stageStatus) cho den khi hoan thanh - khong can buoc "bat dau" rieng.

### C. Cap nhat NVL
- Form NK NVL duoc prefill tu LSX/giao dich gan nhat, khong bao gio mo trang.

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
