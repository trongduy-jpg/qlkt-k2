import type { ProductionOrder, Status } from "@/lib/domain/production";
import { createEmptyOrder, mergeMovementWithContext } from "@/lib/production-mappers";
import { normalizeStageCode } from "@/lib/production-business-rules";
import { pickNumber, pickText } from "@/lib/production-helpers";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";

type MovementDraftFromSummaryInput = {
  summary: OrderSummary;
  currentDraft?: ProductionOrder;
  cachedDraft?: ProductionOrder;
  latestMovement?: ProductionOrder;
  header?: ProductionOrderHeader;
  stageOverride?: string;
  stageMovements?: ProductionOrder[];
};

export function buildMovementDraftFromSummary({
  summary,
  currentDraft,
  cachedDraft,
  latestMovement,
  header,
  stageOverride,
  stageMovements = []
}: MovementDraftFromSummaryInput): ProductionOrder {
  const baseDraft = mergeMovementWithContext(
    cachedDraft ?? latestMovement ?? currentDraft ?? createEmptyOrder(),
    cachedDraft,
    header
  );

  const workerFromStage = stageOverride
    ? stageMovements.find((movement) => normalizeStageCode(movement.stage) === stageOverride)?.worker
    : undefined;

  return {
    ...baseDraft,
    code: summary.code,
    sku: summary.sku,
    productName: pickText(baseDraft.productName, summary.productName),
    destination: pickText(baseDraft.destination, summary.destination),
    documentNo: pickText(baseDraft.documentNo, summary.documentNo),
    documentInNo: pickText(baseDraft.documentInNo, summary.documentInNo),
    documentLineNo: pickText(baseDraft.documentLineNo, summary.documentLineNo),
    movementType: summary.movementType ?? baseDraft.movementType,
    qtyPiece: pickNumber(baseDraft.qtyPiece, summary.qtyPiece),
    occurredDate: pickText(baseDraft.occurredDate, summary.occurredDate, summary.plannedDate),
    stage: stageOverride || pickText(baseDraft.stage, summary.plannedStage),
    stageStatus: baseDraft.stageStatus || "Đang thực hiện",
    worker: stageOverride
      ? pickText(workerFromStage, baseDraft.worker, summary.plannedWorker)
      : pickText(baseDraft.worker, summary.plannedWorker),
    material: pickText(baseDraft.material, summary.plannedMaterial, summary.materials[0]),
    issued: pickNumber(baseDraft.issued, summary.issuedDefault),
    returned: pickNumber(baseDraft.returned, summary.returnedDefault),
    powder: pickNumber(baseDraft.powder, summary.powderDefault),
    transferred: pickNumber(baseDraft.transferred, summary.transferred),
    lossPeriod: pickText(baseDraft.lossPeriod, summary.lossPeriod),
    nxtPeriod: pickText(baseDraft.nxtPeriod, summary.nxtPeriod),
    goldAge: pickNumber(baseDraft.goldAge, summary.plannedGoldAge),
    sourceMaterialName: pickText(baseDraft.sourceMaterialName, summary.sourceMaterialName),
    sourceName: pickText(baseDraft.sourceName, summary.sourceName),
    importSource: pickText(baseDraft.importSource, summary.importSource),
    exportSource: pickText(baseDraft.exportSource, summary.exportSource),
    nxtLinkCode: pickText(baseDraft.nxtLinkCode, summary.nxtLinkCode),
    convertedIssueWeight: pickNumber(baseDraft.convertedIssueWeight, summary.convertedIssueWeight),
    convertedReturnWeight: pickNumber(baseDraft.convertedReturnWeight, summary.convertedReturnWeight),
    status: summary.status === "Đã chốt" ? "Treo nợ" : summary.status
  };
}

export function buildSeedMovementFromSummary(
  summary: OrderSummary,
  header?: ProductionOrderHeader,
  status: Status = "Đang xử lý"
): ProductionOrder {
  const baseDraft = mergeMovementWithContext(createEmptyOrder(), undefined, header);

  return {
    ...baseDraft,
    code: summary.code,
    sku: summary.sku,
    productName: pickText(summary.productName, header?.productName),
    destination: pickText(summary.destination, header?.destination, baseDraft.destination),
    documentNo: pickText(summary.documentNo, header?.documentNo),
    documentInNo: pickText(summary.documentInNo, header?.documentInNo),
    documentLineNo: pickText(summary.documentLineNo, header?.documentLineNo),
    movementType: summary.movementType ?? baseDraft.movementType,
    qtyPiece: pickNumber(summary.qtyPiece, header?.qtyPiece, baseDraft.qtyPiece),
    occurredDate: pickText(summary.occurredDate, summary.plannedDate, header?.occurredDate, header?.plannedDate, baseDraft.occurredDate),
    stage: pickText(summary.plannedStage, header?.plannedStage, baseDraft.stage),
    stageStatus: "Đang thực hiện",
    worker: pickText(summary.plannedWorker, header?.plannedWorker, baseDraft.worker),
    material: pickText(summary.plannedMaterial, header?.plannedMaterial, summary.materials[0], baseDraft.material),
    issued: pickNumber(summary.issuedDefault, header?.issued, 0),
    returned: pickNumber(summary.returnedDefault, header?.returned, 0),
    powder: pickNumber(summary.powderDefault, header?.powder, 0),
    transferred: pickNumber(summary.transferred, header?.transferred, 0),
    lossPeriod: pickText(summary.lossPeriod, header?.lossPeriod, baseDraft.lossPeriod),
    nxtPeriod: pickText(summary.nxtPeriod, header?.nxtPeriod, baseDraft.nxtPeriod),
    goldAge: pickNumber(summary.plannedGoldAge, header?.plannedGoldAge, baseDraft.goldAge),
    sourceMaterialName: pickText(summary.sourceMaterialName, header?.sourceMaterialName, baseDraft.sourceMaterialName),
    sourceName: pickText(summary.sourceName, header?.sourceName, baseDraft.sourceName),
    importSource: pickText(summary.importSource, header?.importSource, baseDraft.importSource),
    exportSource: pickText(summary.exportSource, header?.exportSource, baseDraft.exportSource),
    materialType: pickText(summary.plannedMaterialType, header?.plannedMaterialType, baseDraft.materialType),
    nxtLinkCode: pickText(summary.nxtLinkCode, header?.nxtLinkCode, baseDraft.nxtLinkCode),
    convertedIssueWeight: pickNumber(summary.convertedIssueWeight, header?.convertedIssueWeight, 0),
    convertedReturnWeight: pickNumber(summary.convertedReturnWeight, header?.convertedReturnWeight, 0),
    status
  };
}
