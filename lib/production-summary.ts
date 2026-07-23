import type { ProductionOrder, Status } from "@/lib/demo-data";
import { getSummaryStatus, pickNumber, pickText } from "@/lib/production-helpers";
import { normalizeStageCode } from "@/lib/production-business-rules";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";

// Ham thuan tong hop du lieu LSX / giao dich / tien trinh cong doan.
// Tach ra khoi material-dashboard.tsx (cac useMemo lon nhat) de de doc,
// de test doc lap va giam do dai file component.

export function buildOrderSummaries(orders: ProductionOrder[], productionHeaders: ProductionOrderHeader[]): OrderSummary[] {
  const map = new Map<string, OrderSummary & { statuses: Status[] }>();

  for (const header of productionHeaders) {
    map.set(header.code, {
      code: header.code,
      sku: header.sku,
      productName: header.productName,
      destination: header.destination,
      orderDate: header.orderDate,
      occurredDate: header.occurredDate,
      documentNo: header.documentNo,
      documentInNo: header.documentInNo,
      documentLineNo: header.documentLineNo,
      movementType: header.movementType,
      qtyPiece: header.qtyPiece,
      plannedDate: header.plannedDate,
      plannedStage: header.plannedStage,
      plannedWorker: header.plannedWorker,
      plannedMaterial: header.plannedMaterial,
      materialSpec: header.materialSpec,
      plannedGoldAge: header.plannedGoldAge,
      plannedMaterialType: header.plannedMaterialType,
      deliveryStatus: header.deliveryStatus,
      orderMonth: header.orderMonth,
      salesType: header.salesType,
      customerName: header.customerName,
      specification: header.specification,
      deadlineDate: header.deadlineDate,
      completedDate: header.completedDate,
      deliveredQty: header.deliveredQty,
      actualProgressNote: header.actualProgressNote,
      completedWeightGram: header.completedWeightGram,
      issuedDefault: header.issued,
      returnedDefault: header.returned,
      powderDefault: header.powder,
      transferred: header.transferred,
      lossPeriod: header.lossPeriod,
      nxtPeriod: header.nxtPeriod,
      sourceMaterialName: header.sourceMaterialName,
      sourceName: header.sourceName,
      importSource: header.importSource,
      exportSource: header.exportSource,
      nxtLinkCode: header.nxtLinkCode,
      convertedIssueWeight: header.convertedIssueWeight,
      convertedReturnWeight: header.convertedReturnWeight,
      note: header.note,
      createdAt: header.createdAt,
      headerStatus: header.status,
      parentOrderCode: header.parentOrderCode,
      movementCount: 0,
      issued: 0,
      returned: 0,
      powder: 0,
      loss: 0,
      status: header.status,
      workers: [],
      materials: [],
      statuses: [header.status]
    });
  }

  for (const order of orders) {
    const current = map.get(order.code) ?? {
      code: order.code,
      sku: order.sku,
      productName: order.productName,
      destination: order.destination,
      orderDate: order.occurredDate,
      occurredDate: order.occurredDate,
      documentNo: order.documentNo,
      documentInNo: order.documentInNo,
      documentLineNo: order.documentLineNo,
      movementType: order.movementType,
      qtyPiece: order.qtyPiece,
      plannedDate: order.occurredDate,
      plannedStage: order.stage,
      plannedWorker: order.worker,
      plannedMaterial: order.material,
      materialSpec: "",
      plannedGoldAge: order.goldAge,
      plannedMaterialType: order.materialType,
      deliveryStatus: "",
      orderMonth: order.nxtPeriod,
      salesType: "",
      customerName: "",
      specification: "",
      deadlineDate: "",
      completedDate: "",
      deliveredQty: 0,
      actualProgressNote: "",
      completedWeightGram: 0,
      issuedDefault: order.issued,
      returnedDefault: order.returned,
      powderDefault: order.powder,
      transferred: order.transferred,
      lossPeriod: order.lossPeriod,
      nxtPeriod: order.nxtPeriod,
      sourceMaterialName: order.sourceMaterialName,
      sourceName: order.sourceName,
      importSource: order.importSource,
      exportSource: order.exportSource,
      nxtLinkCode: order.nxtLinkCode,
      convertedIssueWeight: order.convertedIssueWeight,
      convertedReturnWeight: order.convertedReturnWeight,
      note: "",
      headerStatus: undefined,
      movementCount: 0,
      issued: 0,
      returned: 0,
      powder: 0,
      loss: 0,
      status: order.status,
      workers: [],
      materials: [],
      statuses: []
    };

    current.movementCount += 1;
    const isLatestMovementForSummary = current.movementCount === 1;

    current.productName = isLatestMovementForSummary
      ? pickText(order.productName, current.productName)
      : pickText(current.productName, order.productName);
    current.destination = isLatestMovementForSummary
      ? pickText(order.destination, current.destination)
      : pickText(current.destination, order.destination);
    current.orderDate = pickText(current.orderDate, order.occurredDate);
    current.occurredDate = isLatestMovementForSummary
      ? pickText(order.occurredDate, current.occurredDate)
      : pickText(current.occurredDate, order.occurredDate);
    current.documentNo = isLatestMovementForSummary
      ? pickText(order.documentNo, current.documentNo)
      : pickText(current.documentNo, order.documentNo);
    current.documentInNo = isLatestMovementForSummary
      ? pickText(order.documentInNo, current.documentInNo)
      : pickText(current.documentInNo, order.documentInNo);
    current.documentLineNo = isLatestMovementForSummary
      ? pickText(order.documentLineNo, current.documentLineNo)
      : pickText(current.documentLineNo, order.documentLineNo);
    current.movementType = isLatestMovementForSummary ? order.movementType || current.movementType : current.movementType || order.movementType;
    current.qtyPiece =
      isLatestMovementForSummary && pickNumber(order.qtyPiece) > 0
        ? pickNumber(order.qtyPiece)
        : pickNumber(current.qtyPiece, order.qtyPiece);
    current.plannedDate = pickText(current.plannedDate, order.occurredDate);
    current.plannedStage = isLatestMovementForSummary
      ? pickText(order.stage, current.plannedStage)
      : pickText(current.plannedStage, order.stage);
    current.plannedWorker = isLatestMovementForSummary
      ? pickText(order.worker, current.plannedWorker)
      : pickText(current.plannedWorker, order.worker);
    current.plannedMaterial = isLatestMovementForSummary
      ? pickText(order.material, current.plannedMaterial)
      : pickText(current.plannedMaterial, order.material);
    current.plannedGoldAge =
      isLatestMovementForSummary && pickNumber(order.goldAge) > 0
        ? pickNumber(order.goldAge)
        : pickNumber(current.plannedGoldAge, order.goldAge);
    current.plannedMaterialType = isLatestMovementForSummary
      ? pickText(order.materialType, current.plannedMaterialType)
      : pickText(current.plannedMaterialType, order.materialType);
    current.issuedDefault = isLatestMovementForSummary ? pickNumber(order.issued, current.issuedDefault) : pickNumber(current.issuedDefault, order.issued);
    current.returnedDefault = isLatestMovementForSummary ? pickNumber(order.returned, current.returnedDefault) : pickNumber(current.returnedDefault, order.returned);
    current.powderDefault = isLatestMovementForSummary ? pickNumber(order.powder, current.powderDefault) : pickNumber(current.powderDefault, order.powder);
    current.transferred = isLatestMovementForSummary ? pickNumber(order.transferred, current.transferred) : pickNumber(current.transferred, order.transferred);
    current.lossPeriod = isLatestMovementForSummary
      ? pickText(order.lossPeriod, current.lossPeriod)
      : pickText(current.lossPeriod, order.lossPeriod);
    current.nxtPeriod = isLatestMovementForSummary
      ? pickText(order.nxtPeriod, current.nxtPeriod)
      : pickText(current.nxtPeriod, order.nxtPeriod);
    current.sourceMaterialName = isLatestMovementForSummary
      ? pickText(order.sourceMaterialName, current.sourceMaterialName)
      : pickText(current.sourceMaterialName, order.sourceMaterialName);
    current.sourceName = isLatestMovementForSummary
      ? pickText(order.sourceName, current.sourceName)
      : pickText(current.sourceName, order.sourceName);
    current.importSource = isLatestMovementForSummary
      ? pickText(order.importSource, current.importSource)
      : pickText(current.importSource, order.importSource);
    current.exportSource = isLatestMovementForSummary
      ? pickText(order.exportSource, current.exportSource)
      : pickText(current.exportSource, order.exportSource);
    current.nxtLinkCode = isLatestMovementForSummary
      ? pickText(order.nxtLinkCode, current.nxtLinkCode)
      : pickText(current.nxtLinkCode, order.nxtLinkCode);
    current.convertedIssueWeight =
      isLatestMovementForSummary && pickNumber(order.convertedIssueWeight) > 0
        ? pickNumber(order.convertedIssueWeight)
        : pickNumber(current.convertedIssueWeight, order.convertedIssueWeight);
    current.convertedReturnWeight =
      isLatestMovementForSummary && pickNumber(order.convertedReturnWeight) > 0
        ? pickNumber(order.convertedReturnWeight)
        : pickNumber(current.convertedReturnWeight, order.convertedReturnWeight);
    current.issued += order.issued;
    current.returned += order.returned;
    current.powder += order.powder;
    current.loss += order.loss;
    current.statuses.push(order.status);
    if (!current.workers.includes(order.worker)) current.workers.push(order.worker);
    if (!current.materials.includes(order.material)) current.materials.push(order.material);
    current.status = current.headerStatus ?? getSummaryStatus(current.statuses);
    map.set(order.code, current);
  }

  return Array.from(map.values()).map(({ statuses: _statuses, headerStatus: _headerStatus, ...summary }) => summary);
}

export function selectMovementsForOrder(orders: ProductionOrder[], code: string | undefined | null): ProductionOrder[] {
  if (!code) return [];
  return orders
    .filter((order) => order.code === code)
    .sort((left, right) => {
      const leftDate = left.occurredDate || "";
      const rightDate = right.occurredDate || "";
      if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
      return String(right.id).localeCompare(String(left.id));
    });
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

export function buildDraftStageMovements(orders: ProductionOrder[], code: string): Map<string, ProductionOrder> {
  const map = new Map<string, ProductionOrder>();
  const trimmedCode = code.trim();
  if (!trimmedCode) return map;
  for (const order of orders) {
    if (order.code !== trimmedCode) continue;
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
