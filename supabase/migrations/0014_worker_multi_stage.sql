-- Doi cau truc "Danh muc tho" tu 1 tho - 1 khau co dinh sang 1 tho - nhieu
-- khau co the dam nhan (khop voi thuc te: hau het khau cho phep nhieu tho
-- luan chuyen, chi CKE/DAN/KBI la co dinh 1 tho). Them cot stages (mang
-- text), backfill tu cot stage cu (giu lai cot stage cu de tuong thich
-- nguoc, khong con duoc app doc/ghi nua sau migration nay).

alter table workers add column if not exists stages text[] not null default '{}';

update workers
set stages = array[stage]
where stage is not null and stage <> '' and (stages is null or stages = '{}');
