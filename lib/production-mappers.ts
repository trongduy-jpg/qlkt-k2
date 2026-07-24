import type { ProductionOrder, Status } from "@/lib/domain/production";
import { pickNumber, pickText } from "@/lib/production-helpers";
import {
  buildProductionOrderCode,
  normalizeStageCode as normalizeProductionStageCode,
  toIsoDate,
  toMonthCode
} from "@/lib/production-business-rules";
import type { loadProductionOrderHeaders } from "@/lib/material-service";
import type { ProductionOrderItem } from "@/lib/material-service-types";
import type { ProductionOrderHeader } from "@/lib/production-types";

// 1 Ma hang rong cho danh sach Ma hang trong form LSX.
export function createEmptyProductionOrderItem(): ProductionOrderItem {
  return {
    sku: "",
    productName: "",
    quantityPiece: 0,
    materialSpec: "18KY",
    plannedMaterial: "Vàng 18K",
    plannedGoldAge: 0.75,
    plannedMaterialType: "NL18K",
    plannedWeightGram: 0,
    deliveredQty: 0,
    completedWeightGram: 0,
    note: "",
    status: "Đang xử lý"
  };
}

// Dung header (cac truong sku/... primary cu) tao 1 Ma hang - fallback khi
// LSX chua co dong nao trong production_order_items. status ke thua tu
// header/summary (LSX cu, chua tach Ma hang, chi co 1 Ma hang = trang thai
// cua chinh LSX do).
export function itemFromHeaderPrimary(header: {
  sku?: string;
  productName?: string;
  qtyPiece?: number;
  materialSpec?: string;
  plannedMaterial?: string;
  plannedGoldAge?: number;
  plannedMaterialType?: string;
  completedWeightGram?: number;
  deliveredQty?: number;
  status?: Status;
}): ProductionOrderItem {
  return {
    ...createEmptyProductionOrderItem(),
    sku: header.sku ?? "",
    productName: header.productName ?? "",
    quantityPiece: header.qtyPiece ?? 0,
    materialSpec: header.materialSpec || "18KY",
    plannedMaterial: header.plannedMaterial || "Vàng 18K",
    plannedGoldAge: header.plannedGoldAge || 0.75,
    plannedMaterialType: header.plannedMaterialType || "NL18K",
    deliveredQty: header.deliveredQty ?? 0,
    completedWeightGram: header.completedWeightGram ?? 0,
    status: header.status || "Đang xử lý"
  };
}

// Factory va ham merge/mapping cho LSX (header) va giao dich (movement).
// Tach ra khoi material-dashboard.tsx de tai su dung va de test doc lap.

export function createEmptyOrder(): ProductionOrder {
  const today = toIsoDate();
  return {
    id: "",
    code: buildProductionOrderCode("DHAG", today),
    sku: "",
    productName: "",
    material: "Vàng 18K",
    worker: "",
    stage: "CKE",
    stageStatus: "Đang thực hiện",
    destination: "KCP",
    occurredDate: today,
    documentNo: "",
    documentInNo: "",
    documentLineNo: "",
    movementType: "issue",
    qtyPiece: 0,
    issued: 0,
    returned: 0,
    powder: 0,
    transferred: 0,
    lossPeriod: toMonthCode(today),
    nxtPeriod: toMonthCode(today),
    goldAge: 0.75,
    sourceMaterialName: "",
    nxtLinkCode: "",
    importSource: "",
    exportSource: "",
    convertedIssueWeight: 0,
    convertedReturnWeight: 0,
    loss: 0,
    status: "Treo nợ"
  };
}

export function createEmptyProductionOrderHeaderDraft(): Omit<ProductionOrderHeader, "id" | "createdAt"> {
  const today = toIsoDate();
  return {
    code: buildProductionOrderCode("DHAG", today),
    sku: "",
    productName: "",
    destination: "CH1",
    orderDate: today,
    occurredDate: today,
    documentNo: "",
    documentInNo: "",
    documentLineNo: "",
    movementType: "issue",
    qtyPiece: 0,
    plannedDate: today,
    plannedStage: "CKE",
    plannedWorker: "",
    plannedMaterial: "Vàng 18K",
    materialSpec: "18KY",
    plannedGoldAge: 0.75,
    plannedMaterialType: "NL18K",
    deliveryStatus: "Chưa Hoàn Tất",
    orderMonth: toMonthCode(today),
    salesType: "SR",
    customerName: "",
    specification: "",
    deadlineDate: "",
    completedDate: "",
    deliveredQty: 0,
    actualProgressNote: "",
    completedWeightGram: 0,
    issued: 0,
    returned: 0,
    powder: 0,
    transferred: 0,
    lossPeriod: toMonthCode(today),
    nxtPeriod: toMonthCode(today),
    sourceMaterialName: "",
    sourceName: "",
    importSource: "",
    exportSource: "",
    nxtLinkCode: "",
    convertedIssueWeight: 0,
    convertedReturnWeight: 0,
    note: "",
    status: "Đang xử lý",
    parentOrderCode: "",
    items: [createEmptyProductionOrderItem()]
  };
}

export function mapRemoteHeaderToProductionHeader(
  header: Awaited<ReturnType<typeof loadProductionOrderHeaders>>[number]
): ProductionOrderHeader {
  return {
    id: header.id,
    code: header.code,
    sku: header.sku,
    productName: header.productName ?? "",
    destination: header.destination ?? "",
    orderDate: header.orderDate ?? "",
    occurredDate: header.occurredDate ?? header.plannedDate ?? "",
    documentNo: header.documentNo ?? "",
    documentInNo: header.documentInNo ?? "",
    documentLineNo: header.documentLineNo ?? "",
    movementType: header.movementType ?? "issue",
    qtyPiece: header.qtyPiece ?? 0,
    plannedDate: header.plannedDate ?? "",
    plannedStage: header.plannedStage ?? "CKE",
    plannedWorker: header.plannedWorker ?? "",
    plannedMaterial: header.plannedMaterial ?? "Vàng 18K",
    materialSpec: header.materialSpec ?? "18KY",
    plannedGoldAge: header.plannedGoldAge ?? 0.75,
    plannedMaterialType: header.plannedMaterialType ?? "NL18K",
    deliveryStatus: header.deliveryStatus ?? "Chưa Hoàn Tất",
    orderMonth: header.orderMonth ?? toMonthCode(header.plannedDate ?? header.occurredDate ?? toIsoDate()),
    salesType: header.salesType ?? "SR",
    customerName: header.customerName ?? "",
    specification: header.specification ?? "",
    deadlineDate: header.deadlineDate ?? "",
    completedDate: header.completedDate ?? "",
    deliveredQty: header.deliveredQty ?? 0,
    actualProgressNote: header.actualProgressNote ?? "",
    completedWeightGram: header.completedWeightGram ?? 0,
    issued: header.issued ?? 0,
    returned: header.returned ?? 0,
    powder: header.powder ?? 0,
    transferred: header.transferred ?? 0,
    lossPeriod: header.lossPeriod ?? "",
    nxtPeriod: header.nxtPeriod ?? "",
    sourceMaterialName: header.sourceMaterialName ?? "",
    sourceName: header.sourceName ?? "",
    importSource: header.importSource ?? "",
    exportSource: header.exportSource ?? "",
    nxtLinkCode: header.nxtLinkCode ?? "",
    convertedIssueWeight: header.convertedIssueWeight ?? 0,
    convertedReturnWeight: header.convertedReturnWeight ?? 0,
    note: header.note ?? "",
    status: header.status,
    createdAt: header.createdAt,
    parentOrderCode: header.parentOrderCode ?? "",
    // items duoc gan sau tu production_order_items (xem use-operational-data);
    // mac dinh rong o day.
    items: []
  };
}

export function mergeProductionHeaderWithDraft(
  header: ProductionOrderHeader,
  cachedDraft?: Omit<ProductionOrderHeader, "id" | "createdAt">
): ProductionOrderHeader {
  if (!cachedDraft) return header;

  return {
    ...header,
    code: pickText(header.code, cachedDraft.code),
    sku: pickText(header.sku, cachedDraft.sku),
    productName: pickText(header.productName, cachedDraft.productName),
    destination: pickText(header.destination, cachedDraft.destination),
    orderDate: pickText(header.orderDate, cachedDraft.orderDate),
    occurredDate: pickText(header.occurredDate, cachedDraft.occurredDate, cachedDraft.plannedDate),
    documentNo: pickText(header.documentNo, cachedDraft.documentNo),
    documentInNo: pickText(header.documentInNo, cachedDraft.documentInNo),
    documentLineNo: pickText(header.documentLineNo, cachedDraft.documentLineNo),
    movementType: header.movementType || cachedDraft.movementType || "issue",
    qtyPiece: pickNumber(header.qtyPiece, cachedDraft.qtyPiece),
    plannedDate: pickText(header.plannedDate, cachedDraft.plannedDate, cachedDraft.occurredDate),
    plannedStage: pickText(header.plannedStage, cachedDraft.plannedStage),
    plannedWorker: pickText(header.plannedWorker, cachedDraft.plannedWorker),
    plannedMaterial: pickText(header.plannedMaterial, cachedDraft.plannedMaterial),
    materialSpec: pickText(header.materialSpec, cachedDraft.materialSpec),
    plannedGoldAge: pickNumber(header.plannedGoldAge, cachedDraft.plannedGoldAge),
    plannedMaterialType: pickText(header.plannedMaterialType, cachedDraft.plannedMaterialType),
    deliveryStatus: pickText(header.deliveryStatus, cachedDraft.deliveryStatus),
    orderMonth: pickText(header.orderMonth, cachedDraft.orderMonth),
    salesType: pickText(header.salesType, cachedDraft.salesType),
    customerName: pickText(header.customerName, cachedDraft.customerName),
    specification: pickText(header.specification, cachedDraft.specification),
    deadlineDate: pickText(header.deadlineDate, cachedDraft.deadlineDate),
    completedDate: pickText(header.completedDate, cachedDraft.completedDate),
    deliveredQty: pickNumber(header.deliveredQty, cachedDraft.deliveredQty),
    actualProgressNote: pickText(header.actualProgressNote, cachedDraft.actualProgressNote),
    completedWeightGram: pickNumber(header.completedWeightGram, cachedDraft.completedWeightGram),
    issued: pickNumber(header.issued, cachedDraft.issued),
    returned: pickNumber(header.returned, cachedDraft.returned),
    powder: pickNumber(header.powder, cachedDraft.powder),
    transferred: pickNumber(header.transferred, cachedDraft.transferred),
    lossPeriod: pickText(header.lossPeriod, cachedDraft.lossPeriod),
    nxtPeriod: pickText(header.nxtPeriod, cachedDraft.nxtPeriod),
    sourceMaterialName: pickText(header.sourceMaterialName, cachedDraft.sourceMaterialName),
    sourceName: pickText(header.sourceName, cachedDraft.sourceName),
    importSource: pickText(header.importSource, cachedDraft.importSource),
    exportSource: pickText(header.exportSource, cachedDraft.exportSource),
    nxtLinkCode: pickText(header.nxtLinkCode, cachedDraft.nxtLinkCode),
    convertedIssueWeight: pickNumber(header.convertedIssueWeight, cachedDraft.convertedIssueWeight),
    convertedReturnWeight: pickNumber(header.convertedReturnWeight, cachedDraft.convertedReturnWeight),
    note: pickText(header.note, cachedDraft.note),
    status: header.status || cachedDraft.status,
    parentOrderCode: pickText(header.parentOrderCode, cachedDraft.parentOrderCode),
    // Uu tien danh sach Ma hang tu draft (dang sua) neu co, khong thi lay
    // tu du lieu remote da gan. Rieng "status" (trang thai van hanh cua
    // tung Ma hang: Dang xu ly/Da chot) LUON lay tu header (server, vua
    // tai lai) - khong duoc de draft cache (co the cu, tu truoc khi Chot/
    // Mo lai LSX) ghi de len, neu khong "Chot LSX" se bi revert ve trang
    // thai cu ngay sau khi reload.
    items: mergeItemsStatusFromHeader(
      cachedDraft.items && cachedDraft.items.length > 0 ? cachedDraft.items : header.items,
      header.items
    )
  };
}

function mergeItemsStatusFromHeader(
  items: ProductionOrderItem[],
  authoritativeItems: ProductionOrderItem[]
): ProductionOrderItem[] {
  const statusBySku = new Map(authoritativeItems.map((item) => [item.sku, item.status]));
  return items.map((item) => (statusBySku.has(item.sku) ? { ...item, status: statusBySku.get(item.sku) } : item));
}

export function mergeMovementWithContext(
  order: ProductionOrder,
  cachedDraft?: ProductionOrder,
  header?: ProductionOrderHeader
): ProductionOrder {
  return {
    ...order,
    code: pickText(order.code, cachedDraft?.code, header?.code),
    sku: pickText(order.sku, cachedDraft?.sku, header?.sku),
    productName: pickText(order.productName, cachedDraft?.productName, header?.productName),
    material: pickText(order.material, cachedDraft?.material, header?.plannedMaterial),
    worker: pickText(order.worker, cachedDraft?.worker, header?.plannedWorker),
    stage: normalizeProductionStageCode(pickText(order.stage, cachedDraft?.stage, header?.plannedStage)),
    occurredDate: pickText(order.occurredDate, cachedDraft?.occurredDate, header?.occurredDate, header?.plannedDate),
    destination: pickText(order.destination, cachedDraft?.destination, header?.destination),
    documentNo: pickText(order.documentNo, cachedDraft?.documentNo, header?.documentNo),
    documentInNo: pickText(order.documentInNo, cachedDraft?.documentInNo, header?.documentInNo),
    documentLineNo: pickText(order.documentLineNo, cachedDraft?.documentLineNo, header?.documentLineNo),
    movementType: order.movementType || cachedDraft?.movementType || header?.movementType || "issue",
    qtyPiece: pickNumber(order.qtyPiece, cachedDraft?.qtyPiece, header?.qtyPiece),
    stageStatus: pickText(order.stageStatus, cachedDraft?.stageStatus) || "Đang thực hiện",
    issued: pickNumber(order.issued, cachedDraft?.issued, header?.issued),
    returned: pickNumber(order.returned, cachedDraft?.returned, header?.returned),
    powder: pickNumber(order.powder, cachedDraft?.powder, header?.powder),
    transferred: pickNumber(order.transferred, cachedDraft?.transferred, header?.transferred),
    loss:
      typeof order.loss === "number" && Number.isFinite(order.loss)
        ? order.loss
        : Math.max(
            0,
            Number(
              (
                pickNumber(order.issued, cachedDraft?.issued, header?.issued) -
                pickNumber(order.returned, cachedDraft?.returned, header?.returned) -
                pickNumber(order.transferred, cachedDraft?.transferred, header?.transferred)
              ).toFixed(4)
            )
          ),
    lossPeriod: pickText(order.lossPeriod, cachedDraft?.lossPeriod, header?.lossPeriod),
    nxtPeriod: pickText(order.nxtPeriod, cachedDraft?.nxtPeriod, header?.nxtPeriod),
    goldAge: pickNumber(order.goldAge, cachedDraft?.goldAge, header?.plannedGoldAge),
    sourceMaterialName: pickText(order.sourceMaterialName, cachedDraft?.sourceMaterialName, header?.sourceMaterialName),
    sourceName: pickText(order.sourceName, cachedDraft?.sourceName, header?.sourceName),
    importSource: pickText(order.importSource, cachedDraft?.importSource, header?.importSource),
    exportSource: pickText(order.exportSource, cachedDraft?.exportSource, header?.exportSource),
    materialType: pickText(order.materialType, cachedDraft?.materialType, header?.plannedMaterialType),
    nxtLinkCode: pickText(order.nxtLinkCode, cachedDraft?.nxtLinkCode, header?.nxtLinkCode),
    convertedIssueWeight: pickNumber(order.convertedIssueWeight, cachedDraft?.convertedIssueWeight, header?.convertedIssueWeight),
    convertedReturnWeight: pickNumber(order.convertedReturnWeight, cachedDraft?.convertedReturnWeight, header?.convertedReturnWeight),
    status: order.status || cachedDraft?.status || header?.status || "Đang xử lý"
  };
}
