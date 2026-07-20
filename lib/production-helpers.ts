import type { ProductionOrder, Status } from "@/lib/demo-data";

// Hang so va ham thuan (khong phu thuoc React) dung chung cho man
// Lenh san xuat / Nhat ky NVL. Tach ra khoi material-dashboard.tsx.

export const statusOptions: Array<Status | "Tất cả"> = ["Tất cả", "Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"];

export const statusClass: Record<Status, string> = {
  "Đang xử lý": "bg-sky-50 text-sky-700 ring-sky-200",
  "Treo nợ": "bg-amber-50 text-amber-800 ring-amber-200",
  "Xác định": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đã chốt": "bg-zinc-100 text-zinc-700 ring-zinc-300"
};

export const deliveryStatusClass: Record<string, string> = {
  "Hoàn tất": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Chưa Hoàn Tất": "bg-sky-50 text-sky-700 ring-sky-200",
  "Chưa giao đủ": "bg-amber-50 text-amber-800 ring-amber-200",
  "Ngưng Sản Xuất": "bg-rose-50 text-rose-700 ring-rose-200"
};

export function formatGram(value: number) {
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g`;
}

export function validateMovementDraft(draft: ProductionOrder) {
  const missing: string[] = [];
  if (!draft.code.trim()) missing.push("Mã LSX");
  if (!draft.sku.trim()) missing.push("Mã hàng");
  if (!draft.occurredDate?.trim()) missing.push("Ngày nghiệp vụ");
  if (!draft.destination?.trim()) missing.push("Nơi nhận");
  if (!draft.stage?.trim()) missing.push("Công đoạn");
  if (!draft.worker?.trim()) missing.push("Thợ phụ trách");
  if (!draft.stageStatus?.trim()) missing.push("Trạng thái công đoạn");
  if (!draft.status?.trim()) missing.push("Trạng thái tính hao");
  return missing;
}

export function pickText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export function hasMeaningfulText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasMeaningfulDisplayValue(value: string | null | undefined) {
  if (!hasMeaningfulText(value)) return false;
  const normalized = value!.trim().toLowerCase();
  return normalized !== "-" && normalized !== "chưa cập nhật" && normalized !== "chưa có";
}

export function pickNumber(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

export function getSummaryStatus(statuses: Status[]): Status {
  if (statuses.includes("Treo nợ")) return "Treo nợ";
  if (statuses.includes("Đang xử lý")) return "Đang xử lý";
  if (statuses.every((item) => item === "Đã chốt")) return "Đã chốt";
  return "Xác định";
}

export function isClosedStatus(status: Status) {
  return status === "Đã chốt";
}
