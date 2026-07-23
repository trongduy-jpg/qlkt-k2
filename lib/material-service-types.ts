import type { ProductionOrder, Status } from "@/lib/domain/production";

// Kieu du lieu dung chung cho toan bo lop service (materials, workers,
// stages, reference options, production orders, movements...).

export type MaterialMaster = {
  id: string;
  code: string;
  name: string;
  category: string;
  purity: number;
  unit: string;
};

export type WorkerMaster = {
  id: string;
  worker_code: string;
  full_name: string;
  department: string;
  // Danh sach cac ma khau tho nay co the dam nhan. Hau het khau cho phep
  // nhieu tho luan chuyen; chi rieng CKE/DAN/KBI la co dinh 1 tho
  // (xem isSingleWorkerStage trong lib/production-business-rules.ts).
  stages: string[];
};

export type StageMaster = {
  id: string;
  stage_code: string;
  stage_name: string;
  hao_hut_rule: "truc_tiep" | "kiem_soat_rui_ro" | "binh_thuong";
};

export type ReferenceOption = {
  id: string;
  list_key: string;
  option_code: string;
  option_label: string;
  sort_order: number;
};

export type DatabaseHealth = {
  usingRealSupabase: boolean;
  counts: {
    productionOrders: number;
    materialMovements: number;
    materials: number;
    workers: number;
    auditLogs: number;
  };
  hasOperationalData: boolean;
  errorMessage?: string;
};

export type ProductionOrderHeaderInput = {
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
  issued?: number;
  returned?: number;
  powder?: number;
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
  status: Status;
  // Ma LSX goc khi don nay duoc tao qua "+ Tao don moi cho khach nay" -
  // dung de hien dau hieu "cung khach hang" tren giao dien.
  parentOrderCode?: string;
};

export type ProductionOrderHeaderRecord = ProductionOrderHeaderInput & {
  id: string;
  createdAt: string;
};

// Mot Ma hang (line item) thuoc 1 LSX. 1 LSX co the co nhieu Ma hang, moi
// Ma hang co bo thong tin rieng va tien trinh cong doan rieng.
export type ProductionOrderItem = {
  sku: string;
  productName?: string;
  quantityPiece?: number;
  materialSpec?: string;
  plannedMaterial?: string;
  plannedGoldAge?: number;
  plannedMaterialType?: string;
  plannedWeightGram?: number;
  deliveredQty?: number;
  completedWeightGram?: number;
  note?: string;
  sortOrder?: number;
};

export type ProductionOrderItemRecord = ProductionOrderItem & {
  id: string;
  orderCode: string;
  createdAt: string;
};
