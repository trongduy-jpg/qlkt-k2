import type { ProductionOrder, Status } from "@/lib/domain/production";
import type { ProductionOrderItem } from "@/lib/material-service-types";
import { getSummaryStatus, pickNumber, pickText } from "@/lib/production-helpers";
import { normalizeStageCode } from "@/lib/production-business-rules";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";

// Ham thuan tong hop du lieu LSX / giao dich / tien trinh cong doan.
// Tach ra khoi material-dashboard.tsx (cac useMemo lon nhat) de de doc,
// de test doc lap va giam do dai file component.

// Khoa nhan dien 1 dong trong bang LSX/NK NVL: 1 LSX co the co nhieu Ma
// hang (line item), moi Ma hang la 1 dong rieng - khong con dung Ma LSX
// (code) don le lam khoa nua vi code co the lap lai giua cac dong.
export function orderRowKey(summary: { code: string; sku: string }): string {
  return `${summary.code}::${summary.sku}`;
}

function sortMovementsLatestFirst(movements: ProductionOrder[]): ProductionOrder[] {
  return [...movements].sort((left, right) => {
    const leftDate = left.occurredDate || "";
    const rightDate = right.occurredDate || "";
    if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
    return String(right.id).localeCompare(String(left.id));
  });
}

// Gop 1 danh sach giao dich (da thuoc dung 1 dong Ma hang) thanh cac
// truong tong hop dung chung cho ca nhanh co header lan nhanh chi co
// giao dich roi (chua tao LSX chinh thuc).
function summarizeMovements(movements: ProductionOrder[]) {
  const sorted = sortMovementsLatestFirst(movements);
  const latest = sorted[0];
  const workers: string[] = [];
  const materials: string[] = [];
  const statuses: Status[] = [];
  let issued = 0;
  let returned = 0;
  let powder = 0;
  let loss = 0;

  for (const order of sorted) {
    issued += order.issued;
    returned += order.returned;
    powder += order.powder;
    loss += order.loss;
    statuses.push(order.status);
    if (order.worker && !workers.includes(order.worker)) workers.push(order.worker);
    if (order.material && !materials.includes(order.material)) materials.push(order.material);
  }

  return { sorted, latest, workers, materials, statuses, issued, returned, powder, loss };
}

function buildRowFromHeaderItem(
  header: ProductionOrderHeader,
  item: ProductionOrderItem,
  movements: ProductionOrder[]
): OrderSummary {
  const { latest, workers, materials, statuses, issued, returned, powder, loss } = summarizeMovements(movements);

  return {
    code: header.code,
    sku: item.sku,
    productName: pickText(item.productName, header.productName),
    destination: header.destination,
    orderDate: header.orderDate,
    occurredDate: pickText(latest?.occurredDate, header.occurredDate),
    documentNo: pickText(latest?.documentNo, header.documentNo),
    documentInNo: pickText(latest?.documentInNo, header.documentInNo),
    documentLineNo: pickText(latest?.documentLineNo, header.documentLineNo),
    movementType: latest?.movementType || header.movementType,
    qtyPiece: pickNumber(item.quantityPiece, header.qtyPiece),
    plannedDate: header.plannedDate,
    plannedStage: pickText(latest?.stage, header.plannedStage),
    plannedWorker: pickText(latest?.worker, header.plannedWorker),
    plannedMaterial: pickText(item.plannedMaterial, header.plannedMaterial),
    materialSpec: pickText(item.materialSpec, header.materialSpec),
    plannedGoldAge: item.plannedGoldAge || header.plannedGoldAge,
    plannedMaterialType: pickText(item.plannedMaterialType, header.plannedMaterialType),
    deliveryStatus: header.deliveryStatus,
    orderMonth: header.orderMonth,
    salesType: header.salesType,
    customerName: header.customerName,
    specification: header.specification,
    deadlineDate: header.deadlineDate,
    completedDate: header.completedDate,
    deliveredQty: pickNumber(item.deliveredQty, header.deliveredQty),
    actualProgressNote: header.actualProgressNote,
    completedWeightGram: pickNumber(item.completedWeightGram, header.completedWeightGram),
    issuedDefault: header.issued,
    returnedDefault: header.returned,
    powderDefault: header.powder,
    transferred: header.transferred,
    lossPeriod: pickText(latest?.lossPeriod, header.lossPeriod),
    nxtPeriod: pickText(latest?.nxtPeriod, header.nxtPeriod),
    sourceMaterialName: pickText(latest?.sourceMaterialName, header.sourceMaterialName),
    sourceName: pickText(latest?.sourceName, header.sourceName),
    importSource: pickText(latest?.importSource, header.importSource),
    exportSource: pickText(latest?.exportSource, header.exportSource),
    nxtLinkCode: pickText(latest?.nxtLinkCode, header.nxtLinkCode),
    convertedIssueWeight: pickNumber(latest?.convertedIssueWeight, header.convertedIssueWeight),
    convertedReturnWeight: pickNumber(latest?.convertedReturnWeight, header.convertedReturnWeight),
    note: header.note,
    createdAt: header.createdAt,
    parentOrderCode: header.parentOrderCode,
    movementCount: movements.length,
    issued,
    returned,
    powder,
    loss,
    status: header.status,
    workers,
    materials
  };
}

// Dong cho giao dich chua gan voi LSX chinh thuc nao (VD user ghi Nhat ky
// NVL truoc khi tao LSX o man Lenh san xuat) - suy ra toan bo thong tin tu
// chinh cac giao dich, giu nguyen hanh vi cu truoc khi tach tang Ma hang.
function buildRowFromLooseMovements(code: string, sku: string, movements: ProductionOrder[]): OrderSummary {
  const { sorted, workers, materials, statuses, issued, returned, powder, loss } = summarizeMovements(movements);
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  return {
    code,
    sku,
    productName: latest?.productName ?? "",
    destination: latest?.destination ?? "",
    orderDate: oldest?.occurredDate ?? "",
    occurredDate: latest?.occurredDate ?? "",
    documentNo: latest?.documentNo ?? "",
    documentInNo: latest?.documentInNo ?? "",
    documentLineNo: latest?.documentLineNo ?? "",
    movementType: latest?.movementType,
    qtyPiece: latest?.qtyPiece ?? 0,
    plannedDate: oldest?.occurredDate ?? "",
    plannedStage: latest?.stage ?? "",
    plannedWorker: latest?.worker ?? "",
    plannedMaterial: latest?.material ?? "",
    materialSpec: "",
    plannedGoldAge: latest?.goldAge ?? 0,
    plannedMaterialType: latest?.materialType ?? "",
    deliveryStatus: "",
    orderMonth: latest?.nxtPeriod ?? "",
    salesType: "",
    customerName: "",
    specification: "",
    deadlineDate: "",
    completedDate: "",
    deliveredQty: 0,
    actualProgressNote: "",
    completedWeightGram: 0,
    issuedDefault: latest?.issued ?? 0,
    returnedDefault: latest?.returned ?? 0,
    powderDefault: latest?.powder ?? 0,
    transferred: latest?.transferred ?? 0,
    lossPeriod: latest?.lossPeriod ?? "",
    nxtPeriod: latest?.nxtPeriod ?? "",
    sourceMaterialName: latest?.sourceMaterialName ?? "",
    sourceName: latest?.sourceName ?? "",
    importSource: latest?.importSource ?? "",
    exportSource: latest?.exportSource ?? "",
    nxtLinkCode: latest?.nxtLinkCode ?? "",
    convertedIssueWeight: latest?.convertedIssueWeight ?? 0,
    convertedReturnWeight: latest?.convertedReturnWeight ?? 0,
    note: "",
    parentOrderCode: "",
    movementCount: movements.length,
    issued,
    returned,
    powder,
    loss,
    status: getSummaryStatus(statuses),
    workers,
    materials
  };
}

// 1 dong = 1 Ma hang (khong con gop nhieu Ma hang cua cung 1 LSX vao 1
// dong nua). Neu LSX co danh sach Ma hang chinh thuc (Phase 2, man Lenh
// san xuat), moi Ma hang la 1 dong voi giao dich NK NVL rieng cua no.
// LSX chua co danh sach Ma hang (header.items rong) hoac giao dich ghi
// truoc khi tao LSX chinh thuc van fallback ve 1 dong duy nhat nhu truoc.
export function buildOrderSummaries(orders: ProductionOrder[], productionHeaders: ProductionOrderHeader[]): OrderSummary[] {
  const rows: OrderSummary[] = [];
  const consumedMovementIds = new Set<string>();

  for (const header of productionHeaders) {
    const items: ProductionOrderItem[] = header.items.length > 0 ? header.items : [{ sku: header.sku, productName: header.productName }];

    for (const item of items) {
      const sku = item.sku.trim();
      if (!sku) continue;
      const movements = orders.filter((order) => order.code === header.code && (order.itemSku || order.sku) === sku);
      movements.forEach((order) => consumedMovementIds.add(order.id));
      rows.push(buildRowFromHeaderItem(header, item, movements));
    }
  }

  const looseGroups = new Map<string, ProductionOrder[]>();
  for (const order of orders) {
    if (consumedMovementIds.has(order.id)) continue;
    const key = `${order.code}::${order.itemSku || order.sku}`;
    const list = looseGroups.get(key) ?? [];
    list.push(order);
    looseGroups.set(key, list);
  }
  for (const [key, movements] of looseGroups) {
    const [code, sku] = key.split("::");
    rows.push(buildRowFromLooseMovements(code, sku, movements));
  }

  return rows;
}

export function selectMovementsForOrder(orders: ProductionOrder[], code: string | undefined | null, itemSku?: string | null): ProductionOrder[] {
  if (!code) return [];
  const trimmedItemSku = itemSku?.trim();
  return sortMovementsLatestFirst(
    orders.filter((order) => order.code === code && (!trimmedItemSku || (order.itemSku || order.sku) === trimmedItemSku))
  );
}

export function computeMovementTotals(movements: ProductionOrder[]) {
  return movements.reduce(
    (acc, order) => {
      acc.issued += Number(order.issued || 0);
      acc.returned += Number(order.returned || 0);
      acc.powder += Number(order.powder || 0);
      acc.loss += Number(order.loss || 0);
      return acc;
    },
    { issued: 0, returned: 0, powder: 0, loss: 0 }
  );
}

export type StageOption = { value: string; label: string };

export function buildStageOptionsForDropdown(
  stages: Array<{ stage_code: string; stage_name: string }>,
  journalStages: StageOption[]
): StageOption[] {
  if (stages.length === 0) return journalStages;
  const merged = new Map(journalStages.map((item) => [item.value, item]));
  for (const stage of stages) {
    merged.set(stage.stage_code, { value: stage.stage_code, label: `${stage.stage_code} – ${stage.stage_name}` });
  }
  return Array.from(merged.values());
}

// itemSku (neu truyen vao): chi lay tien trinh khau cua DUNG Ma hang do
// trong LSX (1 LSX co the co nhieu Ma hang, moi Ma hang 1 tien trinh rieng).
// Bo qua neu rong (tuong thich giao dich cu chua gan Ma hang).
export function buildDraftStageMovements(orders: ProductionOrder[], code: string, itemSku?: string): Map<string, ProductionOrder> {
  const map = new Map<string, ProductionOrder>();
  const trimmedCode = code.trim();
  if (!trimmedCode) return map;
  const trimmedItemSku = itemSku?.trim();
  for (const order of orders) {
    if (order.code !== trimmedCode) continue;
    if (trimmedItemSku && (order.itemSku || order.sku) !== trimmedItemSku) continue;
    const stageCode = normalizeStageCode(order.stage);
    if (!stageCode) continue;
    const existing = map.get(stageCode);
    if (!existing || (order.occurredDate || "") >= (existing.occurredDate || "")) {
      map.set(stageCode, order);
    }
  }
  return map;
}

export type LossReportRow = {
  id: string;
  stage: string;
  count: number;
  material: string;
  issued: number;
  returned: number;
  loss: number;
  convertedLoss: number;
  worker: string;
  lsxCode: string;
  sku: string;
  status: Status;
};

export function buildLossReportRows(orders: ProductionOrder[]): LossReportRow[] {
  return orders
    .map((order) => {
      const purity = Number(order.goldAge || (order.convertedIssueWeight && order.issued ? order.convertedIssueWeight / order.issued : 1));
      const convertedLoss = Number((order.loss * purity).toFixed(4));

      return {
        id: order.id,
        stage: normalizeStageCode(order.stage),
        count: 1,
        material: order.material || "-",
        issued: order.issued,
        returned: order.returned,
        loss: order.loss,
        convertedLoss,
        worker: order.worker || "-",
        lsxCode: order.code || "-",
        sku: order.sku || "-",
        status: order.status
      };
    })
    .sort((a, b) => b.loss - a.loss);
}

export type StageProgressItem = {
  code: string;
  label: string;
  movementCount: number;
  issued: number;
  returned: number;
  qtyPiece: number;
  latestDate: string;
  isCurrent: boolean;
};

export function buildStageProgress(stageOptions: StageOption[], movements: ProductionOrder[]): StageProgressItem[] {
  const currentStageCode = movements[0]?.stage ? normalizeStageCode(movements[0].stage) : "";

  return stageOptions.map((stageOption) => {
    const stageMovements = movements.filter((movement) => normalizeStageCode(movement.stage) === stageOption.value);
    return {
      code: stageOption.value,
      label: stageOption.label,
      movementCount: stageMovements.length,
      issued: stageMovements.reduce((sum, movement) => sum + Number(movement.issued || 0), 0),
      returned: stageMovements.reduce((sum, movement) => sum + Number(movement.returned || 0), 0),
      qtyPiece: stageMovements.reduce((sum, movement) => sum + Number(movement.qtyPiece || 0), 0),
      latestDate: stageMovements[0]?.occurredDate || "",
      isCurrent: stageOption.value === currentStageCode && stageMovements.length > 0
    };
  });
}
