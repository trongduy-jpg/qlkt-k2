export const appModuleSlugs = {
  Dashboard: "/",
  "Lệnh sản xuất": "/lenh-san-xuat",
  "Nhật ký NVL": "/nhat-ky-nvl",
  "Ghi nhận công đoạn": "/ghi-nhan-cong-doan",
  "Giá & định mức": "/gia-dinh-muc",
  "Tồn hộp thợ": "/ton-hop-tho",
  "Báo cáo hao hụt": "/bao-cao-hao-hut",
  "Audit log": "/audit-log",
  "Cấu hình": "/cau-hinh"
} as const;

export type AppModule = keyof typeof appModuleSlugs;

const pathToModule = Object.fromEntries(
  Object.entries(appModuleSlugs).map(([label, path]) => [path, label])
) as Record<string, AppModule>;

export function getModuleFromPath(pathname: string): AppModule {
  return pathToModule[pathname] ?? "Dashboard";
}

export function getPathForModule(module: string): string {
  return appModuleSlugs[module as AppModule] ?? "/";
}
