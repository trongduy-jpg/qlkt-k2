import type { ProductionOrder, Status } from "@/lib/domain/production";
import type { ProductionOrderItem } from "@/lib/material-service-types";

// Cac kieu du lieu dung chung cho man Lenh san xuat / Nhat ky NVL.
// Tach ra khoi material-dashboard.tsx de de tai su dung va bao tri.

export type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type OrderSummary = {
  code: string;
  sku: string;
  productName?: string;
  destination?: string;
  orderDate?: string;
  occurredDate?: string;
  documentNo?: string;
  documentInNo?: string;
  documentLineNo?: string;
  movementType?: ProductionOrder["movementType"];
  qtyPiece?: number;
  plannedDate?: string;
  plannedStage?: string;
  plannedWorker?: string;
  plannedMaterial?: string;
  materialSpec?: string;
  plannedGoldAge?: number;
  plannedMaterialType?: string;
  deliveryStatus?: string;
  orderMonth?: string;
  salesType?: string;
  customerName?: string;
  specification?: string;
  deadlineDate?: string;
  completedDate?: string;
  deliveredQty?: number;
  actualProgressNote?: string;
  completedWeightGram?: number;
  issuedDefault?: number;
  returnedDefault?: number;
  powderDefault?: number;
  transferred?: number;
  lossPeriod?: string;
  nxtPeriod?: string;
  sourceMaterialName?: string;
  sourceName?: string;
  importSource?: string;
  exportSource?: string;
  nxtLinkCode?: string;
  convertedIssueWeight?: number;
  convertedReturnWeight?: number;
  note?: string;
  createdAt?: string;
  headerStatus?: Status;
  parentOrderCode?: string;
  movementCount: number;
  issued: number;
  returned: number;
  powder: number;
  loss: number;
  status: Status;
  workers: string[];
  materials: string[];
};

export type ProductionOrderHeader = {
  id: string;
  code: string;
  sku: string;
  productName: string;
  destination: string;
  orderDate: string;
  occurredDate: string;
  documentNo: string;
  documentInNo: string;
  documentLineNo: string;
  movementType: ProductionOrder["movementType"];
  qtyPiece: number;
  plannedDate: string;
  plannedStage: string;
  plannedWorker: string;
  plannedMaterial: string;
  materialSpec: string;
  plannedGoldAge: number;
  plannedMaterialType: string;
  deliveryStatus: string;
  orderMonth: string;
  salesType: string;
  customerName: string;
  specification: string;
  deadlineDate: string;
  completedDate: string;
  deliveredQty: number;
  actualProgressNote: string;
  completedWeightGram: number;
  issued: number;
  returned: number;
  powder: number;
  transferred: number;
  lossPeriod: string;
  nxtPeriod: string;
  sourceMaterialName: string;
  sourceName: string;
  importSource: string;
  exportSource: string;
  nxtLinkCode: string;
  convertedIssueWeight: number;
  convertedReturnWeight: number;
  note: string;
  status: Status;
  createdAt: string;
  parentOrderCode: string;
  // Danh sach Ma hang cua LSX. 1 LSX co the co nhieu Ma hang, moi Ma hang
  // mot bo thong tin rieng. Cac truong sku/productName/... o tren van giu
  // = Ma hang dau tien (primary) de tuong thich cac logic hien co.
  items: ProductionOrderItem[];
};

export type PendingJournalRow = {
  id: string;
  kind: "pending";
  code: string;
  sku: string;
  productName?: string;
  material: string;
  worker: string;
  stage: string;
  qtyPiece?: number;
  occurredDate?: string;
  lossPeriod?: string;
  nxtPeriod?: string;
  status: Status;
  deliveryStatus?: string;
  summary: OrderSummary;
};
