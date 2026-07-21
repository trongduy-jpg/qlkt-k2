-- Rut gon danh muc cong doan ve dung 12 khau xu ly NVL (bo 19 ma vua them
-- o 0015 - cac ma do thuc ra la vai tro/cong viec khac, khong phai khau
-- xu ly NVL: KHO=thu kho, TV=tu van, v.v. - khong nen nam trong danh sach
-- "Cong doan" dung cho Nhat ky NVL).

delete from production_stages
where stage_code not in (
  'NAU','CKE','DAN','KBI','QBI','DAP','NEN','DKB','BAO','GEP','BAS','SXK'
);

-- Loc lai stages cua tung tho: chi giu ma nam trong 12 khau tren, bo cac
-- ma da bi xoa khoi danh muc cong doan (vi du HAN, KHO, TV...).
update workers
set stages = (
  select coalesce(array_agg(s order by ord), '{}')
  from unnest(stages) with ordinality as t(s, ord)
  where s = any (array['NAU','CKE','DAN','KBI','QBI','DAP','NEN','DKB','BAO','GEP','BAS','SXK'])
);
