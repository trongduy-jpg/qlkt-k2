create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'nhan_vien', -- 'admin' | 'nhan_vien'
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_email on app_users(email);

alter table app_users enable row level security;

-- Cho phep doc danh sach (can thiet de: man dang nhap kiem tra email co
-- duoc phep khong TRUOC khi gui magic link; user da dang nhap can biet
-- vai tro cua chinh minh).
drop policy if exists "app_users_select_all" on app_users;
create policy "app_users_select_all" on app_users
  for select using (true);

-- Chi tai khoan da dang nhap VA co role = 'admin' moi duoc them/sua/xoa
-- nguoi dung khac. So sanh qua email trong JWT (khong can lien ket id
-- voi auth.users) de dam bao admin dau tien co the duoc seed truoc khi
-- ho tung dang nhap lan nao.
drop policy if exists "app_users_admin_write" on app_users;
create policy "app_users_admin_write" on app_users
  for all
  using (
    exists (
      select 1 from app_users au
      where au.email = auth.jwt() ->> 'email' and au.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from app_users au
      where au.email = auth.jwt() ->> 'email' and au.role = 'admin'
    )
  );

-- QUAN TRONG: doi email ben duoi thanh email that cua ban roi moi chay
-- file nay, de co san 1 tai khoan admin dau tien (neu khong se khong ai
-- them duoc ai vao ca, vi RLS chi cho phep admin da co san them nguoi
-- moi).
insert into app_users (email, full_name, role)
values ('admin@example.com', 'Quan tri vien', 'admin')
on conflict (email) do nothing;
