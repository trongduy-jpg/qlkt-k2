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

export function filterWorkerBoxLines(filters: WorkerBoxFilters): WorkerBoxFilterResult {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const periodLines = workerBoxBalanceLines.filter((line) => line.periodCode === filters.periodCode);
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
