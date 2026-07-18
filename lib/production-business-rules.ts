import type { ProductionOrder, Status } from "@/lib/demo-data";

const directChargeStages = new Set(["CKE", "DAN", "BIEN"]);
const controlledRiskStages = new Set(["BAO", "PI"]);

export function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function toMonthCode(dateString: string) {
  return dateString.slice(0, 7);
}

export function buildProductionOrderCode(prefix: string, dateString: string) {
  const compactDate = dateString.slice(2).replaceAll("-", "");
  return `${prefix}-${compactDate}`;
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
    "cán kéo": "CKE",
    "can keo": "CKE",
    "cán": "CKE",
    "can": "CKE",
    "kéo": "CKE",
    "keo": "CKE",
    "cán dát": "CDT",
    "can dat": "CDT",
    "đan": "DAN",
    "đan dây": "DAN",
    "dan day": "DAN",
    "biến": "BIEN",
    "bien": "BIEN",
    "bào dây": "BAO",
    "bao day": "BAO",
    "pi": "PI",
    "đúc": "CKE",
    "duc": "CKE",
    "hoàn thiện": "HTH",
    "hoan thien": "HTH",
    "nấu": "NAU",
    "nau": "NAU",
    "quay bi": "QBI",
    "đánh bóng": "DKB",
    "danh bong": "DKB",
    "ghép dây": "GEP",
    "ghep day": "GEP",
    "ghép": "GEP",
    "ghep": "GEP",
    "sản xuất khóa": "SXK",
    "san xuat khoa": "SXK",
    "dập định hình": "DAP",
    "dap dinh hinh": "DAP",
    "dập": "DAP",
    "dap": "DAP"
  };

  return stageByName[normalized] ?? stage;
}

export function getStageLabel(stageCode: string) {
  const labels: Record<string, string> = {
    CKE: "Cán kéo",
    CDT: "Cán dát",
    DAN: "Đan dây",
    BIEN: "Biến",
    QBI: "Quay bi",
    BAO: "Bào dây",
    PI: "Pi",
    DAP: "Dập định hình",
    DKB: "Đánh bóng",
    GEP: "Ghép dây",
    NAU: "Nấu",
    SXK: "Sản xuất khóa",
    HTH: "Hoàn thiện"
  };

  return labels[stageCode] ?? stageCode;
}

export function normalizeStageForStorage(stage: string) {
  return getStageLabel(normalizeStageCode(stage));
}

export function shouldForceDirectCharge(stage: string, status: Status) {
  return status === "Xác định" && !directChargeStages.has(normalizeStageCode(stage));
}

export function isLargeWeightMovement(order: Pick<ProductionOrder, "issued" | "returned" | "transferred">) {
  return Math.max(order.issued || 0, order.returned || 0, order.transferred || 0) > 2000;
}

export function convertToPureGoldWeight(weight: number, purity?: number) {
  return Number((weight * (purity || 1)).toFixed(4));
}

export function getWorkerInventoryRiskStatus(stage: string, diffGram: number) {
  const absDiff = Math.abs(diffGram);
  if (absDiff < 5) return "An toàn";
  if (controlledRiskStages.has(normalizeStageCode(stage))) return "Đang kiểm soát";
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
