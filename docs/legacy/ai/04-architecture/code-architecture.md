# Code Architecture

## Muc tieu
Huong toi kien truc de tach business rule, mapping du lieu va UI khoi nhau.

## Hien trang
- `components/material-dashboard.tsx` dang chua nhieu module va nhieu logic.
- `lib/material-service.ts` dang la lop doc/ghi Supabase.
- `lib/production-business-rules.ts` dang chua mot phan rule nghiep vu.
- `lib/production-journal-options.ts` dang chua danh muc dropdown.

## Dinh huong tach file
- `components/*`: render UI va callback UI.
- `lib/services/*`: Supabase API, fetch, create, update, delete.
- `lib/business-rules/*`: rule nghiep vu, tinh toan, validation.
- `lib/mappers/*`: convert tu row database -> model UI.
- `lib/constants/*`: dropdown, status, labels.

## Rule
- Khong viet them business rule moi truc tiep trong JSX neu co the tach.
- Khong hardcode option list ben trong component.
- Neu mot phan he lon len, tach thanh component rieng.
