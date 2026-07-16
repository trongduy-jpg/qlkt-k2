# Phan tich bo tai lieu hien co

Ngay phan tich: 2026-07-07

## 1. Ket qua kiem tra file

Thu muc `docs/` hien co dung 10 file theo cau truc da thong nhat, nhung noi dung chua day du.

### File da co noi dung

- `01-tong-quan-nghiep-vu.md`
- `02-vai-tro-va-phan-quyen.md`
- `05-cau-truc-du-lieu-va-doi-tuong.md`
- `06-mo-hinh-du-lieu.md`
- `07-yeu-cau-chuc-nang-srs.md`

### File dang rong, can bo sung lai tu NotebookLM

- `03-quy-trinh-nghiep-vu.md`
- `04-quy-trinh-trang-thai-van-hanh.md`
- `08-bao-cao-dashboard-canh-bao.md`
- `09-kien-truc-giao-dien-ui.md`
- `10-kien-truc-he-thong.md`

## 2. Nhan xet nhanh ve tai lieu da co

Bo tai lieu hien tai dang nghieng rat ro ve bai toan quan ly gia, hao hut va quyet toan boi thuong nguyen vat lieu trong san xuat kim hoan. Day la huong dung va co gia tri cao, nhung can luu y: muc tieu ban dau cua he thong la "theo doi tien do nguyen vat lieu cho bo phan KT", con noi dung hien tai da mo rong sang "quan tri hao hut, gia, cong no tho va bao cao tai chinh".

Dieu nay khong sai. Thuc te day moi la loi nghiep vu quan trong cua nganh trang suc. Tuy nhien khi xay MVP, nen tach thanh 2 lop:

1. Lop van hanh: theo doi LSX, NVL, xuat/nhap, trang thai, treo no, hoan tat.
2. Lop tai chinh: gia NVL, quy doi 99.99, dinh muc hao hut, boi thuong, bao cao.

Neu tron ca hai lop ngay tu dau, he thong se lon va kho chot. Nen lam lop van hanh truoc, sau do gan tinh toan tai chinh len tren.

## 3. Cac diem da ro de co the bat dau thiet ke

### Vai tro nguoi dung

Da co cac nhom vai tro quan trong:

- Ban Giam doc: xem, phe duyet gia, phe duyet bao cao, chot du lieu.
- Ke toan NVL: nhap gia, cap nhat du lieu mua vao, lap bang gia.
- Ke toan tong hop: tong hop hao hut, quyet toan boi thuong.
- KCP/KCS: nhap va xac nhan trong luong thuc te, QC.
- GSNB/kiem soat noi bo: doi soat, kiem tra doc lap.
- To truong san xuat: theo doi tien do, xem du lieu bo phan.
- Tho san xuat: xem lich su ca nhan, xac nhan giao dich neu can.

### Doi tuong du lieu cot loi

Da co nhom du lieu quan trong:

- Nguyen vat lieu
- Nhan su/tho
- Cong doan san xuat
- Dinh muc hao hut
- San pham/ma hang
- Lenh san xuat
- Nhat ky cap phat/xuat nhap NVL
- Gia vang/gia kim loai/ty gia
- Bao cao hao hut
- Ky ke toan/ky thuc hien

### Cong thuc va logic dac thu

Da co cac quy tac cot loi:

- Quy doi vang ve 99.99 theo ham luong.
- 1 luong = 10 chi.
- 1 chi = 3.75 gram.
- 1 oz = 31.1 gram.
- PT900 = 90% PT + 10% PD + thue PD.
- Hao hut thuc te = tong xuat - tong nhap - bot hoan tra.
- Chi boi thuong khi hao hut thuc te lon hon hao hut dinh muc.
- Trang thai "Treo no" phai duoc tach rieng voi "Xac dinh/Da chot".

## 4. Cac khoang trong can bo sung truoc khi code

### Thieu quy trinh nghiep vu chi tiet

File `03-quy-trinh-nghiep-vu.md` dang rong. Day la file rat quan trong vi no tra loi cau hoi:

- Ai tao LSX?
- Ai yeu cau/cap phat NVL?
- NVL di qua nhung cong doan nao?
- Khi nao can KCP xac nhan?
- Khi nao chuyen tu treo no sang xac dinh?
- Khi nao duoc chot ky?

Khuyen nghi: can bo sung file nay truoc khi thiet ke man hinh va database chi tiet.

### Thieu state machine/trang thai van hanh

File `04-quy-trinh-trang-thai-van-hanh.md` dang rong. He thong dang phu thuoc nhieu vao trang thai, nen file nay phai chot:

- Trang thai LSX.
- Trang thai giao dich NVL.
- Trang thai hao hut.
- Trang thai bang gia.
- Trang thai bao cao.
- Dieu kien chuyen trang thai.
- Vai tro nao duoc chuyen trang thai.

### Thieu dashboard va canh bao

File `08-bao-cao-dashboard-canh-bao.md` dang rong. Can bo sung de biet MVP can hien thi chi so nao truoc.

### Thieu kien truc UI

File `09-kien-truc-giao-dien-ui.md` dang rong. Can bo sung de tranh xay giao dien qua chung chung.

### Thieu kien truc he thong

File `10-kien-truc-he-thong.md` dang rong. Tai lieu nay co the de toi tu thiet ke sau, nhung van nen co de chot cong nghe, module, API, auth, backup va cau truc source.

## 5. De xuat MVP nen lam truoc

MVP nen tap trung vao luong van hanh cot loi:

1. Quan ly danh muc NVL, ham luong, don vi tinh.
2. Quan ly tho/nhan su va cong doan.
3. Quan ly lenh san xuat.
4. Ghi nhan giao dich xuat/nhap NVL theo LSX, tho, cong doan.
5. Quan ly trang thai `Dang xu ly`, `Treo no`, `Xac dinh`, `Da chot`.
6. Tinh hao hut thuc te.
7. Tinh hao hut vuot dinh muc.
8. Lap bao cao hao hut theo ky, theo tho, theo LSX.
9. Phan quyen co ban.
10. Audit log cho thay doi gia va trong luong.

Chua nen lam tu dong lay gia Kitco/DailyMetalPrice trong vong dau. Nen cho nhap tay hoac import Excel truoc, vi du lieu gia anh huong truc tiep den tai chinh va can duoc phe duyet.

## 6. De xuat cong nghe

Neu xay thanh he thong web noi bo nhanh va de mo rong:

- Frontend + backend: Next.js
- Database: PostgreSQL
- ORM: Prisma
- UI: Tailwind CSS + shadcn/ui
- Auth: role-based access control
- Import/export: Excel

Trong giai doan dau, co the dung SQLite de demo local nhanh, sau do chuyen PostgreSQL khi can dung that.

## 7. Viec nen lam tiep theo

Thu tu de nghi:

1. Bo sung noi dung cho 5 file dang rong.
2. Sau khi du 10 file, tao `00-mvp-scope.md` de chot pham vi ban dau.
3. Tao `11-database-design.md` tu cac doi tuong da chot.
4. Tao schema Prisma ban dau.
5. Dung khung app Next.js.
6. Lam cac man hinh MVP theo thu tu: dashboard, LSX, NVL, giao dich xuat/nhap, hao hut, bao cao.

## 8. Ket luan

Bo tai lieu hien co da du manh de nhin ra loi he thong: quan ly dong chay NVL tu san xuat sang ke toan, gan voi hao hut va gia tri boi thuong. Tuy nhien chua nen code ngay vi 5 file quan trong van rong, dac biet la quy trinh nghiep vu va trang thai van hanh.

Sau khi bo sung 5 file con thieu, co the bat dau thiet ke MVP va database mot cach chac chan.
