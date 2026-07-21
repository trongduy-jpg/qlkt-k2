import type { ProductionOrder, Status } from "@/lib/demo-data";

export type HaoHutRule = "truc_tiep" | "kiem_soat_rui_ro" | "binh_thuong";

const defaultStageRules: Record<string, HaoHutRule> = {
  CKE: "truc_tiep",
  DAN: "truc_tiep",
  BAO: "kiem_soat_rui_ro"
};

function resolveStageRule(stageCode: string, stageRules?: Record<string, HaoHutRule>): HaoHutRule {
  return stageRules?.[stageCode] ?? defaultStageRules[stageCode] ?? "binh_thuong";
}

export function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// Chuan hoa moi truong ngay/thang/nam day du hien thi ra man hinh ve
// cung dinh dang dd/mm/yy (khong dung cho cac truong chi co thang/nam).
export function formatDisplayDate(dateString?: string | null) {
  if (!dateString) return "";
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year.slice(2)}`;
  }
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return formatDisplayDateTime(parsed).slice(0, 8);
}

export function formatDisplayDateTime(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function toMonthCode(dateString: string) {
  return dateString.slice(0, 7);
}

function buildOrderMonthKey(dateString: string) {
  const [year, month] = dateString.split("-");
  return `${(year || "").slice(2)}${month || ""}`;
}

// Ma LSX = {prefix}-{YYMM}{STT trong thang}, vi du DHAG-26071 la lenh thu 1
// cua thang 07/2026. Cac lenh tao them (cung mot khach/mot ma hang) chi lay
// so thu tu tiep theo trong thang, khong gan them ngay hay hau to rieng.
export function buildProductionOrderCode(prefix: string, dateString: string, existingCodes: Iterable<string> = []) {
  const monthKey = buildOrderMonthKey(dateString);
  const monthPrefix = `${prefix}-${monthKey}`;

  let maxSequence = 0;
  for (const code of existingCodes) {
    if (!code.startsWith(monthPrefix)) continue;
    const sequence = Number(code.slice(monthPrefix.length));
    if (Number.isFinite(sequence) && sequence > maxSequence) maxSequence = sequence;
  }

  return `${monthPrefix}${maxSequence + 1}`;
}

export function buildUniqueProductionOrderCode(prefix: string, dateString: string, existingCodes: Iterable<string>) {
  return buildProductionOrderCode(prefix, dateString, existingCodes);
}

export function buildDocumentNo(dateString: string, sequence: number) {
  const compactDate = dateString.replaceAll("-", "");
  return `${compactDate}-${String(sequence).padStart(3, "0")}`;
}

export function getNextDocumentSequence(orders: ProductionOrder[], dateString: string) {
  const compactDate = dateString.replaceAll("-", "");
  return orders.filter((order) => order.documentNo?.startsWith(compactDate)).length + 1;
}

export function getCarryOverLossPeriod(occurredDate: string, status: Status) {
  const currentMonth = toMonthCode(occurredDate);
  const day = Number(occurredDate.slice(8, 10));

  if (status === "Đã chốt" || status === "Xác định" || status === "Treo nợ") return currentMonth;
  if (day < 28) return currentMonth;

  const nextMonth = new Date(`${occurredDate}T00:00:00`);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return toMonthCode(toIsoDate(nextMonth));
}

export function normalizeStageCode(stage: string) {
  const normalized = stage.trim().toLowerCase();
  const stageByName: Record<string, string> = {
    "nấu nguyên liệu": "NAU",
    "nau nguyen lieu": "NAU",
    "nấu": "NAU",
    "nau": "NAU",
    "cán chỉ/cán dát": "CKE",
    "can chi/can dat": "CKE",
    "cán kéo": "CKE",
    "can keo": "CKE",
    "cán dát": "CKE",
    "can dat": "CKE",
    "cán": "CKE",
    "can": "CKE",
    "kéo": "CKE",
    "keo": "CKE",
    "đúc": "CKE",
    "duc": "CKE",
    "đan": "DAN",
    "đan dây": "DAN",
    "dan day": "DAN",
    "khắc bi": "KBI",
    "khac bi": "KBI",
    "quay bóng": "QBI",
    "quay bong": "QBI",
    "quay bi": "QBI",
    "dập định hình": "DAP",
    "dap dinh hinh": "DAP",
    "dập": "DAP",
    "dap": "DAP",
    "nén khít": "NEN",
    "nen khit": "NEN",
    "nén": "NEN",
    "nen": "NEN",
    "ra dây": "DKB",
    "ra day": "DKB",
    "đánh bóng": "DKB",
    "danh bong": "DKB",
    "bào dây": "BAO",
    "bao day": "BAO",
    "ghép dây": "GEP",
    "ghep day": "GEP",
    "ghép": "GEP",
    "ghep": "GEP",
    "dập bass, bông khoen": "BAS",
    "dap bass, bong khoen": "BAS",
    "dập bass": "BAS",
    "dap bass": "BAS",
    "bông khoen": "BAS",
    "bong khoen": "BAS",
    "sản xuất khóa": "SXK",
    "san xuat khoa": "SXK"
  };

  return stageByName[normalized] ?? stage;
}

export function getStageLabel(stageCode: string) {
  const labels: Record<string, string> = {
    NAU: "Nấu nguyên liệu",
    CKE: "Cán chỉ/cán dát",
    DAN: "Đan dây",
    KBI: "Khắc bi",
    QBI: "Quay bóng",
    DAP: "Dập định hình",
    NEN: "Nén khít",
    DKB: "Ra dây",
    BAO: "Bào dây",
    GEP: "Ghép dây",
    BAS: "Dập bass, bông khoen",
    SXK: "Sản xuất khóa"
  };

  return labels[stageCode] ?? stageCode;
}

export function normalizeStageForStorage(stage: string) {
  return getStageLabel(normalizeStageCode(stage));
}

export function shouldForceDirectCharge(stage: string, status: Status, stageRules?: Record<string, HaoHutRule>) {
  return status === "Xác định" && resolveStageRule(normalizeStageCode(stage), stageRules) !== "truc_tiep";
}

export function isLargeWeightMovement(order: Pick<ProductionOrder, "issued" | "returned" | "transferred">) {
  return Math.max(order.issued || 0, order.returned || 0, order.transferred || 0) > 2000;
}

export function convertToPureGoldWeight(weight: number, purity?: number) {
  return Number((weight * (purity || 1)).toFixed(4));
}

export function getWorkerInventoryRiskStatus(stage: string, diffGram: number, stageRules?: Record<string, HaoHutRule>) {
  const absDiff = Math.abs(diffGram);
  if (absDiff < 5) return "An toàn";
  if (resolveStageRule(normalizeStageCode(stage), stageRules) === "kiem_soat_rui_ro") return "Đang kiểm soát";
  return "Rủi ro";
}

export function applyProductionBusinessRules(order: ProductionOrder, orders: ProductionOrder[]) {
  const occurredDate = order.occurredDate || toIsoDate();
  const documentNo = order.documentNo || buildDocumentNo(occurredDate, getNextDocumentSequence(orders, occurredDate));
  const stage = normalizeStageForStorage(order.stage);
  const lossPeriod = order.lossPeriod || getCarryOverLossPeriod(occurredDate, order.status);
  const nxtPeriod = order.nxtPeriod || toMonthCode(occurredDate);
  const goldAge = Number(order.goldAge || 1);

  return {
    ...order,
    occurredDate,
    documentNo,
    stage,
    lossPeriod,
    nxtPeriod,
    powder: 0,
    convertedIssueWeight: convertToPureGoldWeight(order.issued, goldAge),
    convertedReturnWeight: convertToPureGoldWeight(order.returned, goldAge)
  };
}
