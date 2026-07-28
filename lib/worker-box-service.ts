import type { ProductionOrder } from "@/lib/domain/production";
import type { WorkerMaster } from "@/lib/material-service";
import { journalStages, movementGoldAgeOptions } from "@/lib/production-journal-options";
import {
  workerBoxBalanceLines,
  workerBoxPeriods,
  type WorkerBoxBalanceLine
} from "@/lib/worker-box-data";

export type WorkerBoxReviewFilter = "all" | WorkerBoxBalanceLine["reviewStatus"];
export type WorkerBoxDebtFilter = "all" | WorkerBoxBalanceLine["debtStatus"];
export type WorkerBoxMetalFilter = "all" | WorkerBoxBalanceLine["metalCode"];
export type WorkerBoxGoldAgeFilter = "all" | string;

export type WorkerBoxFilters = {
  periodCode: string;
  reviewStatus: WorkerBoxReviewFilter;
  debtStatus: WorkerBoxDebtFilter;
  metalCode: WorkerBoxMetalFilter;
  goldAgeCode: WorkerBoxGoldAgeFilter;
  query: string;
  page: number;
  pageSize: number;
};

export type WorkerBoxSummary = {
  book: number;
  physical: number;
  diff: number;
  risk: number;
  pending: number;
  matched: number;
};

export type WorkerBoxFilterResult = {
  rows: WorkerBoxBalanceLine[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: WorkerBoxSummary;
  filterOptions: {
    metalCodes: WorkerBoxBalanceLine["metalCode"][];
    goldAgeCodes: string[];
    debtStatuses: WorkerBoxBalanceLine["debtStatus"][];
  };
};

const emptySummary: WorkerBoxSummary = {
  book: 0,
  physical: 0,
  diff: 0,
  risk: 0,
  pending: 0,
  matched: 0
};

export function getDefaultWorkerBoxPeriodCode() {
  return workerBoxPeriods[0]?.code ?? "";
}

export function getWorkerBoxPeriod(periodCode: string) {
  return workerBoxPeriods.find((period) => period.code === periodCode) ?? workerBoxPeriods[0] ?? null;
}

export function parseWorkerBoxPeriodCode(periodCode: string) {
  const [year = "", month = ""] = periodCode.split("-");
  return { year, month };
}

export function formatWorkerBoxMonthLabel(periodCode: string) {
  const { month } = parseWorkerBoxPeriodCode(periodCode);
  return month ? `Tháng ${month}` : "Chưa có tháng";
}

export function formatWorkerBoxYearLabel(periodCode: string) {
  const { year } = parseWorkerBoxPeriodCode(periodCode);
  return year ? `Năm ${year}` : "Chưa có năm";
}

export function formatWorkerBoxPeriodLabel(periodCode: string) {
  const { year, month } = parseWorkerBoxPeriodCode(periodCode);
  if (!year || !month) return "Chưa có kỳ báo cáo";
  return `Tháng ${month}/${year}`;
}

export function summarizeWorkerBoxLines(lines: WorkerBoxBalanceLine[]): WorkerBoxSummary {
  return lines.reduce(
    (acc, line) => {
      acc.book += line.bookClosingConvertedGram;
      acc.physical += line.physicalConvertedGram;
      acc.diff += line.diffConvertedGram;
      acc.risk += line.reviewStatus === "risk" ? 1 : 0;
      acc.pending += line.reviewStatus === "pending" ? 1 : 0;
      acc.matched += line.reviewStatus === "matched" ? 1 : 0;
      return acc;
    },
    { ...emptySummary }
  );
}

export function filterWorkerBoxLines(
  filters: WorkerBoxFilters,
  sourceLines: WorkerBoxBalanceLine[] = workerBoxBalanceLines
): WorkerBoxFilterResult {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const periodLines = sourceLines.filter((line) => line.periodCode === filters.periodCode);
  const summary = summarizeWorkerBoxLines(periodLines);
  const filterOptions = {
    metalCodes: Array.from(new Set(periodLines.map((line) => line.metalCode))).sort(),
    goldAgeCodes: Array.from(new Set(periodLines.map((line) => line.goldAgeCode))).sort(),
    debtStatuses: Array.from(new Set(periodLines.map((line) => line.debtStatus))).sort()
  };

  const filtered = periodLines.filter((line) => {
    const matchReview = filters.reviewStatus === "all" || line.reviewStatus === filters.reviewStatus;
    const matchDebt = filters.debtStatus === "all" || line.debtStatus === filters.debtStatus;
    const matchMetal = filters.metalCode === "all" || line.metalCode === filters.metalCode;
    const matchGoldAge = filters.goldAgeCode === "all" || line.goldAgeCode === filters.goldAgeCode;
    const matchQuery = !normalizedQuery || [
      line.workerCode,
      line.workerName,
      line.stageCode,
      line.stageName,
      line.materialName,
      line.goldAgeCode,
      line.metalCode,
      line.sourceFile
    ].some((value) => value.toLowerCase().includes(normalizedQuery));

    return matchReview && matchDebt && matchMetal && matchGoldAge && matchQuery;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const safePage = Math.min(Math.max(filters.page, 1), pageCount);
  const start = (safePage - 1) * filters.pageSize;

  return {
    rows: filtered.slice(start, start + filters.pageSize),
    total: filtered.length,
    page: safePage,
    pageSize: filters.pageSize,
    pageCount,
    summary,
    filterOptions
  };
}

export function buildWorkerBoxQueryKey(filters: WorkerBoxFilters) {
  return [
    "worker_box_balance_lines",
    filters.periodCode,
    filters.reviewStatus,
    filters.debtStatus,
    filters.metalCode,
    filters.goldAgeCode,
    filters.query.trim().toLowerCase(),
    filters.page,
    filters.pageSize
  ].join(":");
}

function detectMetal(materialName: string): { group: WorkerBoxBalanceLine["materialGroup"]; code: WorkerBoxBalanceLine["metalCode"] } {
  const normalized = materialName.toLowerCase();
  if (normalized.includes("bạc") || normalized.includes("bac")) return { group: "silver", code: "AG" };
  if (normalized.includes("platinum") || normalized.includes("pt")) return { group: "platinum", code: "PT" };
  return { group: "gold", code: "AU" };
}

function detectGoldAgeCode(goldAge: number | undefined): string {
  if (!goldAge) return "-";
  const match = movementGoldAgeOptions.find((item) => Math.abs(Number(item.value) - goldAge) < 0.001);
  return match?.label ?? "-";
}

function detectStageName(stageCode: string): string {
  const match = journalStages.find((item) => item.value === stageCode);
  if (!match) return stageCode || "-";
  const parts = match.label.split("–");
  return parts.length > 1 ? parts[1].trim() : match.label;
}

function monthBounds(periodCode: string) {
  const [yearStr, monthStr] = periodCode.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return { fromDate: `${periodCode}-01`, toDate: `${periodCode}-01` };

  const lastDay = new Date(year, month, 0).getDate();
  return {
    fromDate: `${periodCode}-01`,
    toDate: `${periodCode}-${String(lastDay).padStart(2, "0")}`
  };
}

const MACHINE_POWDER_STAGE_CODES = new Set(["BAO", "KBI"]);

function isMachinePowderStage(stageCode: string) {
  return MACHINE_POWDER_STAGE_CODES.has(stageCode.toUpperCase());
}

/**
 * Tong hop tuc thoi tu Nhat ky NVL (material_movements) thanh dang WorkerBoxBalanceLine.
 * Ton so sach duoc tinh theo cong thuc: ton dau ky + nhap trong ky - xuat trong ky.
 * Cac so lieu doi soat thuc te co the duoc cap nhat o tang UI/luu tru rieng.
 */
export function buildWorkerBoxLinesFromMovements(
  orders: ProductionOrder[],
  workers: WorkerMaster[]
): WorkerBoxBalanceLine[] {
  const groups = new Map<
    string,
    {
      periodCode: string;
      workerCode: string;
      workerName: string;
      stageCode: string;
      materialName: string;
      goldAge: number;
      issued: number;
      returned: number;
      powder: number;
    }
  >();

  for (const order of orders) {
    if (!order.worker) continue;
    const periodCode = order.nxtPeriod || order.lossPeriod || (order.occurredDate ? order.occurredDate.slice(0, 7) : "");
    if (!periodCode) continue;

    const metal = detectMetal(order.material || "");
    const goldAge = order.goldAge || 1;
    const key = `${periodCode}::${order.worker}::${order.stage}::${metal.code}::${goldAge}`;

    const current = groups.get(key) ?? {
      periodCode,
      workerCode: workers.find((item) => item.full_name === order.worker)?.worker_code ?? order.worker,
      workerName: order.worker,
      stageCode: order.stage,
      materialName: order.material || "-",
      goldAge,
      issued: 0,
      returned: 0,
      powder: 0
    };

    current.issued += order.issued || 0;
    current.returned += order.returned || 0;
    current.powder += order.powder || 0;
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const metal = detectMetal(group.materialName);
    const { fromDate, toDate } = monthBounds(group.periodCode);
    const openingConvertedGram = 0;
    const importConvertedGram = Number((group.returned * group.goldAge).toFixed(4));
    const exportConvertedGram = Number((group.issued * group.goldAge).toFixed(4));
    const bookClosingConvertedGram = Number((openingConvertedGram + importConvertedGram - exportConvertedGram).toFixed(4));
    const bookClosingRawGram = group.goldAge > 0 ? Number((bookClosingConvertedGram / group.goldAge).toFixed(4)) : 0;
    const machinePowderRawGram = isMachinePowderStage(group.stageCode) ? group.powder : 0;
    const machinePowderConvertedGram = Number((machinePowderRawGram * group.goldAge).toFixed(4));

    return {
      id: `wb-auto-${key}`,
      periodCode: group.periodCode,
      fromDate,
      toDate,
      workerCode: group.workerCode,
      workerName: group.workerName,
      stageCode: group.stageCode,
      stageName: detectStageName(group.stageCode),
      materialGroup: metal.group,
      metalCode: metal.code,
      materialName: group.materialName,
      goldAgeCode: detectGoldAgeCode(group.goldAge),
      goldAge: group.goldAge,
      rowGroup: bookClosingRawGram > 0 ? "debt" : "normal",
      debtStatus: bookClosingRawGram > 0 ? "treo_no" : "none",
      sourceFile: "Nhật ký NVL",
      sourceSheet: "",
      sourceRowIndex: 0,
      sourceJournalFilter: "",
      openingPowderGram: 0,
      openingRawGram: 0,
      openingConvertedGram,
      importPowderGram: 0,
      importRawGram: group.returned,
      importConvertedGram,
      exportPowderGram: 0,
      exportRawGram: group.issued,
      exportConvertedGram,
      bookClosingPowderGram: group.powder,
      bookClosingRawGram,
      bookClosingConvertedGram,
      physicalBtpGram: 0,
      physicalNvlGram: bookClosingRawGram,
      physicalScrapGram: 0,
      physicalTotalRawGram: bookClosingRawGram,
      physicalConvertedGram: bookClosingConvertedGram,
      diffRawGram: 0,
      diffConvertedGram: 0,
      machinePowderRawGram,
      machinePowderConvertedGram,
      reviewLossConvertedGram: 0,
      depositNormConvertedGram: 0,
      riskDiffConvertedGram: 0,
      reviewStatus: "matched",
      comment: "Tự động tổng hợp từ Nhật ký NVL - chưa đối chiếu tồn thực tế.",
      xdcStatus: "pending",
      ndcStatus: "pending"
    };
  });
}

export function getPeriodsFromLines(lines: WorkerBoxBalanceLine[]) {
  const codes = Array.from(new Set(lines.map((line) => line.periodCode))).sort((a, b) => b.localeCompare(a));
  return codes.map((code) => {
    const sample = lines.find((line) => line.periodCode === code);
    return {
      code,
      label: formatWorkerBoxPeriodLabel(code),
      fromDate: sample?.fromDate ?? `${code}-01`,
      toDate: sample?.toDate ?? `${code}-01`,
      source: "Nhật ký NVL"
    };
  });
}
