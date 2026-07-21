-- Fix loi "infinite recursion detected in policy for relation app_users".
-- Nguyen nhan: policy app_users_admin_write (tao trong 0009) tu truy van
-- lai chinh bang app_users ngay trong dieu kien cua no. Khi Postgres
-- danh gia RLS cho 1 cau lenh SELECT tren app_users, no phai danh gia
-- tat ca policy ap dung cho SELECT (bao gom ca app_users_admin_write vi
-- policy do dung "for all"), va de danh gia dieu kien cua policy do lai
-- phai SELECT tren app_users lan nua -> lap vo han.
--
-- Cach sua: dua dieu kien "la admin" vao 1 ham SECURITY DEFINER (giong
-- is_whitelisted_user() da tao o 0010). Ham SECURITY DEFINER chay voi
-- quyen cua nguoi tao ham (thuong la chu bang / superuser), nen truy van
-- ben trong ham KHONG bi ap RLS -> khong con de quy.

create or replace function is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from app_users au
    where au.email = auth.jwt() ->> 'email' and au.role = 'admin'
  );
$$;

drop policy if exists "app_users_admin_write" on app_users;
create policy "app_users_admin_write" on app_users
  for all
  using (is_admin_user())
  with check (is_admin_user());
