# QLKT K2 Material Tracking Demo

Demo Next.js + TypeScript cho hệ thống theo dõi tiến độ nguyên vật liệu, quản lý hao hụt và quyết toán bồi thường ngành trang sức.

## Stack

- React + Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client
- Vercel-ready project structure

## Chạy local

```bash
npm install
npm run dev
```

Do PowerShell trên máy có thể chặn `npm.ps1`, có thể dùng:

```bash
npm.cmd install
npm.cmd run dev
```

## Supabase

1. Tạo project Supabase.
2. Chạy SQL trong `supabase/schema.sql`.
3. Chạy tiếp SQL trong `supabase/seed.sql` nếu muốn có dữ liệu mẫu.
4. Copy `.env.example` thành `.env.local`.
5. Điền:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Hiện demo đang dùng dữ liệu mẫu trong `lib/demo-data.ts`. Sau khi có Supabase, bước kế tiếp là thay các bảng demo bằng query thật.

Chi tiết nằm trong `supabase/README.md`.

## MVP hiện tại

- Lưu dữ liệu thao tác bằng `localStorage`.
- Thêm giao dịch LSX/NVL.
- Tính hao hụt tự động: `xuất - nhập - bột`.
- Đổi trạng thái ngay trên bảng.
- Xóa giao dịch.
- Ghi audit log demo.
- Export JSON.

## Tài liệu nghiệp vụ

- `docs/00-mvp-scope.md`: phạm vi MVP.
- `docs/03-quy-trinh-nghiep-vu.md`: luồng nghiệp vụ cần chốt.

## Deploy Vercel

1. Push repo lên GitHub.
2. Import project vào Vercel.
3. Thêm env Supabase trong Vercel Project Settings.
4. Deploy.
