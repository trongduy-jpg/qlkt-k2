import type { ProductionOrder, Status } from "@/lib/demo-data";

const statusToDb: Record<Status, string> = {
  "Đang xử lý": "dang_xu_ly",
  "Treo nợ": "treo_no",
  "Xác định": "xac_dinh",
  "Đã chốt": "da_chot"
};

const statusFromDb: Record<string, Status> = {
  dang_xu_ly: "Đang xử lý",
  treo_no: "Treo nợ",
  xac_dinh: "Xác định",
  da_chot: "Đã chốt"
};

export function toDbStatus(status: Status) {
  return statusToDb[status] ?? "dang_xu_ly";
}

export function fromDbStatus(status: string): Status {
  return statusFromDb[status] ?? "Đang xử lý";
}

export type MovementRow = {
  id: string;
  order_id?: string | null;
  process_name: string;
  occurred_date?: string | null;
  destination?: string | null;
  document_no?: string | null;
  document_in_no?: string | null;
  document_line_no?: string | null;
  movement_type?: ProductionOrder["movementType"] | null;
  qty_piece?: number | null;
  item_sku?: string | null;
  stage_status?: string | null;
  issued_gram: number;
  returned_gram: number;
  powder_gram: number;
  transferred_weight_gram?: number | null;
  loss_gram: number;
  loss_period?: string | null;
  nxt_period?: string | null;
  gold_age?: number | null;
  source_material_name?: string | null;
  source_name?: string | null;
  import_source?: string | null;
  export_source?: string | null;
  material_type?: string | null;
  nxt_link_code?: string | null;
  converted_issue_weight?: number | null;
  converted_return_weight?: number | null;
  status: string;
  production_orders: {
    order_code: string;
    sku: string;
    product_name?: string | null;
  } | null;
  materials: {
    name: string;
  } | null;
  workers: {
    full_name: string;
  } | null;
};

export function movementRowToProductionOrder(row: MovementRow): ProductionOrder {
  return {
    id: row.id,
    orderId: row.order_id ?? "",
    code: row.production_orders?.order_code ?? "",
    sku: row.production_orders?.sku ?? "",
    itemSku: row.item_sku ?? "",
    productName: row.production_orders?.product_name ?? "",
    material: row.materials?.name ?? "",
    worker: row.workers?.full_name ?? "",
    stage: row.process_name,
    occurredDate: row.occurred_date ?? "",
    destination: row.destination ?? "",
    documentNo: row.document_no ?? "",
    documentInNo: row.document_in_no ?? "",
    documentLineNo: row.document_line_no ?? "",
    movementType: row.movement_type ?? "issue",
    qtyPiece: row.qty_piece ?? 0,
    stageStatus: row.stage_status ?? "Đang thực hiện",
    issued: Number(row.issued_gram),
    returned: Number(row.returned_gram),
    powder: Number(row.powder_gram),
    transferred: Number(row.transferred_weight_gram ?? 0),
    loss: Number(row.loss_gram),
    lossPeriod: row.loss_period ?? "",
    nxtPeriod: row.nxt_period ?? "",
    goldAge: row.gold_age ? Number(row.gold_age) : undefined,
    sourceMaterialName: row.source_material_name ?? "",
    sourceName: row.source_name ?? "",
    importSource: row.import_source ?? "",
    exportSource: row.export_source ?? "",
    materialType: row.material_type ?? "",
    nxtLinkCode: row.nxt_link_code ?? "",
    convertedIssueWeight: row.converted_issue_weight ? Number(row.converted_issue_weight) : undefined,
    convertedReturnWeight: row.converted_return_weight ? Number(row.converted_return_weight) : undefined,
    status: fromDbStatus(row.status)
  };
}
