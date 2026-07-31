export type MovementType = "issue" | "return" | "transfer" | "adjustment";

// Trang thai tinh hao (loss status) - 4 gia tri, la nguon su that duy nhat.
// Moi option array/map lien quan phai suy ra tu day de khong lech nhau.
// Luu y: stageStatus va deliveryStatus KHONG thuoc bo tu vung nay - chung
// duoc luu tho xuong DB, chua kiem chung duoc gia tri thuc te, nen van
// giu kieu string (xem tasks/backlog/008-low-priority.md).
export const LOSS_STATUSES = ["Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"] as const;

export type LossStatus = (typeof LOSS_STATUSES)[number];

/** @deprecated Use `LossStatus`. Alias tam thoi de migrate dan cac file import. */
export type Status = LossStatus;

export type ProductionOrder = {
  id: string;
  orderId?: string;
  code: string;
  sku: string;
  itemSku?: string;
  productName?: string;
  material: string;
  worker: string;
  stage: string;
  stageStatus?: string;
  destination?: string;
  occurredDate?: string;
  documentNo?: string;
  documentInNo?: string;
  documentLineNo?: string;
  movementType?: MovementType;
  qtyPiece?: number;
  issueDate?: string;
  issueSku?: string;
  issueProductName?: string;
  issueQtyPiece?: number;
  returnDate?: string;
  returnSku?: string;
  returnProductName?: string;
  returnQtyPiece?: number;
  issued: number;
  returned: number;
  powder: number;
  transferred?: number;
  lossPeriod?: string;
  nxtPeriod?: string;
  goldAge?: number;
  sourceMaterialName?: string;
  nxtLinkCode?: string;
  sourceName?: string;
  importSource?: string;
  exportSource?: string;
  materialType?: string;
  convertedIssueWeight?: number;
  convertedReturnWeight?: number;
  loss: number;
  status: LossStatus;
};
