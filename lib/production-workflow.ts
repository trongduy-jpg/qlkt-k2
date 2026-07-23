import type { ProductionOrder, Status } from "@/lib/demo-data";
import { pickNumber, pickText } from "@/lib/production-helpers";
import { extractOrderCodeMonth, normalizeStageCode, toIsoDate } from "@/lib/production-business-rules";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";

export const ALL_DESTINATIONS_FILTER = "Tất cả cửa hàng";
export const ALL_CODE_MONTHS_FILTER = "Tất cả tháng";

export type ProductionSummaryFilters = {
  deliveryStatus: string;
  salesType: string;
  deadlineFilter: string;
  destination: string;
  codeMonth: string;
  query: string;
  today?: string;
};

export type JournalOrderFilters = {
  query: string;
  status: Status | "Tất cả";
};

export type ProductionOverview = {
  total: number;
  noMovementCount: number;
  overdueCount: number;
  inProgressCount: number;
};

export type SelectedOrderDetail = {
  code: string;
  sku: string;
  productName: string;
  deliveryStatus: string;
  operationalStatus: Status;
  customerName: string;
  qtyPiece: number | null;
  salesType: string;
  plannedDate: string;
  deadlineDate: string;
  completedDate: string;
  deliveredQty: number | null;
  destination: string;
  stage: string;
  worker: string;
  plannedMaterial: string;
  materialSpec: string;
  goldAgeValue: number;
  actualProgressNote: string;
  movementMaterials: string[];
  movementWorkers: string[];
  movementCount: number;
  parentOrderCode?: string;
};

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function filterProductionSummaries(summaries: OrderSummary[], filters: ProductionSummaryFilters): OrderSummary[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const today = filters.today ?? toIsoDate();
  const sevenDayLimit = addDays(today, 7);

  return summaries.filter((summary) => {
    const matchDeliveryStatus = filters.deliveryStatus === "Tất cả trạng thái LSX" || summary.deliveryStatus === filters.deliveryStatus;
    const matchSalesType = filters.salesType === "Tất cả SR/KH" || summary.salesType === filters.salesType;
    const matchDestination = filters.destination === ALL_DESTINATIONS_FILTER || summary.destination === filters.destination;
    const matchCodeMonth = filters.codeMonth === ALL_CODE_MONTHS_FILTER || extractOrderCodeMonth(summary.code) === filters.codeMonth;
    const matchQuery =
      !normalizedQuery ||
      `${summary.customerName || ""} ${summary.sku || ""} ${summary.productName || ""} ${summary.code || ""}`
        .toLowerCase()
        .includes(normalizedQuery);

    let matchDeadline = true;
    if (filters.deadlineFilter === "Quá hạn") {
      matchDeadline = Boolean(summary.deadlineDate && summary.deadlineDate < today && summary.deliveryStatus !== "Hoàn tất");
    } else if (filters.deadlineFilter === "Hôm nay") {
      matchDeadline = summary.deadlineDate === today;
    } else if (filters.deadlineFilter === "7 ngày tới") {
      matchDeadline = Boolean(summary.deadlineDate && summary.deadlineDate >= today && summary.deadlineDate <= sevenDayLimit);
    } else if (filters.deadlineFilter === "Chưa có deadline") {
      matchDeadline = !summary.deadlineDate;
    }

    return matchDeliveryStatus && matchSalesType && matchDestination && matchCodeMonth && matchQuery && matchDeadline;
  });
}

// Danh sach thang xuat hien trong Ma LSX cua toan bo LSX hien co, moi nhat
// truoc, dung de dien dropdown loc "Thang" ma khong can luu cot rieng.
export function buildOrderCodeMonthOptions(summaries: OrderSummary[]): string[] {
  const months = new Set<string>();
  for (const summary of summaries) {
    const month = extractOrderCodeMonth(summary.code);
    if (month) months.add(month);
  }
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

// Gom cac giao dich (moi khau = 1 dong) ve DUNG 1 dong/LSX, dai dien la
// "cong doan hien tai" = khau xa nhat trong quy trinh (stageOrder) da co
// ghi nhan. Bang NK NVL chi hien dong dai dien nay, xem lich su cac khau
// truoc thi mo drawer (accordion da liet ke day du). Neu cung 1 khau co
// nhieu tho / cung index quy trinh thi lay ban ghi occurredDate moi nhat,
// hoa nua thi giu ban ghi xuat hien truoc trong mang (thuong da sort moi->cu).
export function pickCurrentStagePerOrder(orders: ProductionOrder[], stageOrder: string[]): ProductionOrder[] {
  const orderIndexByStage = new Map(stageOrder.map((code, index) => [code, index]));
  const stageRank = (order: ProductionOrder) => orderIndexByStage.get(normalizeStageCode(order.stage)) ?? -1;

  const representativeByCode = new Map<string, { order: ProductionOrder; position: number }>();
  orders.forEach((order, position) => {
    const current = representativeByCode.get(order.code);
    if (!current) {
      representativeByCode.set(order.code, { order, position });
      return;
    }

    const rankDiff = stageRank(order) - stageRank(current.order);
    if (rankDiff > 0) {
      representativeByCode.set(order.code, { order, position });
      return;
    }
    if (rankDiff === 0) {
      const dateDiff = (order.occurredDate || "").localeCompare(current.order.occurredDate || "");
      if (dateDiff > 0 || (dateDiff === 0 && position < current.position)) {
        representativeByCode.set(order.code, { order, position });
      }
    }
  });

  return Array.from(representativeByCode.values())
    .sort((left, right) => {
      const dateDiff = (right.order.occurredDate || "").localeCompare(left.order.occurredDate || "");
      if (dateDiff !== 0) return dateDiff;
      return left.position - right.position;
    })
    .map((entry) => entry.order);
}

export function filterJournalOrders(orders: ProductionOrder[], filters: JournalOrderFilters): ProductionOrder[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return orders.filter((order) => {
    const matchStatus = filters.status === "Tất cả" || order.status === filters.status;
    const searchable = `${order.code} ${order.sku} ${order.productName || ""} ${order.material} ${order.worker} ${order.stage}`.toLowerCase();
    return matchStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function buildProductionOverview(summaries: OrderSummary[], today = toIsoDate()): ProductionOverview {
  return summaries.reduce(
    (acc, summary) => {
      acc.total += 1;
      if (summary.movementCount === 0) acc.noMovementCount += 1;
      if (summary.deadlineDate && summary.deadlineDate < today && summary.deliveryStatus !== "Hoàn tất") acc.overdueCount += 1;
      if (summary.status === "Đang xử lý") acc.inProgressCount += 1;
      return acc;
    },
    { total: 0, noMovementCount: 0, overdueCount: 0, inProgressCount: 0 }
  );
}

export function buildSelectedOrderDetail(
  summary: OrderSummary | null,
  movements: ProductionOrder[],
  headers: ProductionOrderHeader[]
): SelectedOrderDetail | null {
  if (!summary) return null;

  const matchingHeader = headers.find((header) => header.code === summary.code);
  const latestMovement = movements[0] ?? null;
  const movementWorkers = Array.from(new Set(movements.map((item) => item.worker).filter((item) => item && item.trim().length > 0)));
  const movementMaterials = Array.from(new Set(movements.map((item) => item.material).filter((item) => item && item.trim().length > 0)));
  const movementStages = Array.from(new Set(movements.map((item) => item.stage).filter((item) => item && item.trim().length > 0)));

  const qtyPiece = pickNumber(latestMovement?.qtyPiece, summary.qtyPiece, matchingHeader?.qtyPiece);
  const deliveredQty = pickNumber(summary.deliveredQty, matchingHeader?.deliveredQty);

  return {
    code: summary.code,
    sku: pickText(summary.sku, matchingHeader?.sku),
    productName: pickText(summary.productName, matchingHeader?.productName),
    deliveryStatus: pickText(summary.deliveryStatus, matchingHeader?.deliveryStatus),
    operationalStatus: latestMovement?.status || summary.status,
    customerName: pickText(summary.customerName, matchingHeader?.customerName),
    qtyPiece: qtyPiece > 0 ? qtyPiece : null,
    salesType: pickText(summary.salesType, matchingHeader?.salesType),
    plannedDate: pickText(summary.plannedDate, matchingHeader?.plannedDate),
    deadlineDate: pickText(summary.deadlineDate, matchingHeader?.deadlineDate),
    completedDate: pickText(summary.completedDate, matchingHeader?.completedDate),
    deliveredQty: deliveredQty > 0 ? deliveredQty : null,
    destination: pickText(latestMovement?.destination, summary.destination, matchingHeader?.destination),
    stage: pickText(latestMovement?.stage, movementStages[0], summary.plannedStage, matchingHeader?.plannedStage),
    worker: pickText(latestMovement?.worker, movementWorkers[0], summary.plannedWorker, matchingHeader?.plannedWorker),
    plannedMaterial: pickText(latestMovement?.material, movementMaterials[0], summary.plannedMaterial, matchingHeader?.plannedMaterial),
    materialSpec: pickText(summary.materialSpec, matchingHeader?.materialSpec),
    goldAgeValue: pickNumber(latestMovement?.goldAge, summary.plannedGoldAge, matchingHeader?.plannedGoldAge),
    actualProgressNote: pickText(summary.actualProgressNote, matchingHeader?.actualProgressNote),
    movementMaterials,
    movementWorkers,
    movementCount: movements.length,
    parentOrderCode: pickText(summary.parentOrderCode, matchingHeader?.parentOrderCode)
  };
}
