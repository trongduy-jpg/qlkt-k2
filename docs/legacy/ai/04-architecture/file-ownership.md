# File Ownership

## Core files hien tai
- `components/material-dashboard.tsx`
  - Man hinh tong hop hien tai
  - Chua UI cua LSX, NK NVL va mot phan bao cao

- `lib/material-service.ts`
  - CRUD Supabase
  - load / create / update cac bang chinh

- `lib/production-business-rules.ts`
  - Rule tao ma LSX
  - Carry-over
  - Tinh hao co ban

- `lib/production-journal-options.ts`
  - Dropdown options

## Rule cho AI
- Sua logic fetch/ghi DB: vao `lib/material-service.ts`
- Sua option dropdown: vao `lib/production-journal-options.ts`
- Sua business rule: vao `lib/production-business-rules.ts` hoac file rule moi
- Sua bo cuc / UI: vao component phu hop
