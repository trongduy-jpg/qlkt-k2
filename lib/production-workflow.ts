import type { ProductionOrder, Status } from "@/lib/demo-data";
import { pickNumber, pickText } from "@/lib/production-helpers";
import { toIsoDate } from "@/lib/production-business-rules";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";

export type ProductionSummaryFilters = {
  deliveryStatus: string;
  salesType: string;
  deadlineFilter: string;
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

    return matchDeliveryStatus && matchSalesType && matchQuery && matchDeadline;
  });
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
    movementCount: movements.length
  };
}
