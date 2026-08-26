-- Tinh nang "Gop y / Bao loi": cho phep user gui bao cao loi hoac de xuat
-- cai tien ngay trong app, dinh kem man hinh (context_module) dang mo de
-- admin biet loi xay ra o dau ma khong can hoi lai user.

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references app_users(id),
  created_by_email text not null,
  type text not null check (type in ('bug', 'suggestion')),
  content text not null,
  context_module text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_user_feedback_status on user_feedback(status);
create index if not exists idx_user_feedback_created_at on user_feedback(created_at desc);

alter table user_feedback enable row level security;

-- Cung nguyen tac voi 0010_business_tables_rls.sql: bat ky tai khoan da
-- dang nhap va co trong app_users (bat ke admin/nhan_vien) deu doc/ghi
-- duoc - RLS o day chi la lop bao ve toi thieu (chan truy cap qua REST API
-- khi chua dang nhap), khong phai co che phan quyen theo tung dong. Man
-- "Phan hoi nguoi dung" (chi admin thay trong sidebar, xem app-shell.tsx)
-- moi la noi gioi han ai THAY duoc trang quan ly - giong cach "Cau hinh"
-- dang lam.
drop policy if exists "user_feedback_whitelisted_access" on user_feedback;
create policy "user_feedback_whitelisted_access" on user_feedback
  for all using (is_whitelisted_user()) with check (is_whitelisted_user());
