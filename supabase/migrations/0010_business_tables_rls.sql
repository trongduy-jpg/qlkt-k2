-- Bat RLS cho toan bo bang nghiep vu con lai (truoc gio chi co app_users
-- co RLS - xem 0009). Neu khong chay migration nay, bat ky ai co
-- NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (lo san trong
-- bundle JS phia client) deu doc/ghi/xoa duoc toan bo du lieu qua REST
-- API cua Supabase, bo qua hoan toan man dang nhap cua webapp.
--
-- Quy tac: chi tai khoan DA DANG NHAP va CO EMAIL TRONG app_users (bat
-- ke vai tro admin/nhan_vien) moi duoc doc/ghi. Day la muc bao ve toi
-- thieu, khop voi cach app dang hoat dong (man Cau hinh - noi sua danh
-- muc NVL/tho/cong doan - da bi an voi nhan_vien ngay trong giao dien,
-- RLS o day dam bao dieu do khong bi bo qua bang cach goi thang API).
--
-- QUAN TRONG: phai chay SAU 0009_app_users_schema.sql (can bang app_users
-- ton tai) VA phai co it nhat 1 tai khoan trong app_users truoc khi ai do
-- dang nhap, neu khong se khong doc/ghi duoc gi ca sau khi bat RLS.

create or replace function is_whitelisted_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from app_users au where au.email = auth.jwt() ->> 'email'
  );
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'materials',
    'workers',
    'production_orders',
    'material_movements',
    'price_periods',
    'audit_logs',
    'production_stages',
    'reference_options'
  ]
  loop
    execute format('alter table %I enable row level security;', tbl);
    execute format('drop policy if exists "%I_whitelisted_access" on %I;', tbl, tbl);
    execute format(
      'create policy "%I_whitelisted_access" on %I for all using (is_whitelisted_user()) with check (is_whitelisted_user());',
      tbl, tbl
    );
  end loop;
end $$;
