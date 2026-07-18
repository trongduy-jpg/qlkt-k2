# AI Project Entry

## Muc tieu
Bo tai lieu nay dinh nghia cach AI hieu, phan tich, thiet ke, sua loi va mo rong he thong QLKT K2 theo huong on dinh, dung nghiep vu va de bao tri.

## Pham vi he thong
- Lenh san xuat
- Nhat ky NVL
- Gia va dinh muc
- Ton hop tho
- Bao cao hao hut
- Audit log
- Cau hinh danh muc nen

## Thu tu doc bat buoc truoc khi code
1. [System Overview](./01-business/system-overview.md)
2. [Modules Overview](./01-business/modules-overview.md)
3. [Workflow LSX -> NK NVL](./03-workflows/workflow-lsx-to-nknvl.md)
4. [Business Rules](./07-rules/business-rules.md)
5. [Data Dictionary LSX](./02-data-model/data-dictionary-lsx.md)
6. [Data Dictionary NK NVL](./02-data-model/data-dictionary-nk-nvl.md)
7. [Code Architecture](./04-architecture/code-architecture.md)
8. [Coding Standards](./04-architecture/coding-standards.md)
9. [UI Rules](./05-frontend/ui-rules.md)
10. [Task Execution Protocol](./08-delivery/task-execution-protocol.md)

## Thu tu uu tien nguon su that
1. File trong `docs/ai/07-rules`
2. File trong `docs/ai/03-workflows`
3. File trong `docs/ai/02-data-model`
4. Cac tai lieu nghiep vu goc trong `docs/`
5. Code hien tai trong repo
6. Du lieu demo

## Nguyen tac lam viec cho AI
- Khong them field moi neu chua co trong data dictionary.
- Khong sua business rule neu chua cap nhat `business-rules.md`.
- Khong trien khai UI moi neu chua doi chieu voi `ui-rules.md`.
- Moi task phai sua trong pham vi nho nhat co the.
- Mot function chi lam mot viec.
- Khong de logic nghiep vu phuc tap nam tron trong component render.
- Neu thay doi workflow, phai cap nhat workflow doc tuong ung.

## Quy tac phan tich task
Khi nhan mot task moi, AI phai tra loi duoc:
1. Task thuoc phan he nao?
2. Nguon du lieu goc cua task la gi?
3. Field nao duoc phep sua?
4. Trang thai nao thay doi?
5. UI nao bi tac dong?
6. Co can cap nhat docs khong?

## Dinh huong cho repo hien tai
- `components/material-dashboard.tsx` hien la man hinh tong hop chua nhieu logic va UI.
- Muc tieu dai han la tach dan theo module, service, mapper, business rule.
- Trong giai doan chuyen doi, AI phai sua co kiem soat, khong refactor rong neu user khong yeu cau.
