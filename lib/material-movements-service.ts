import { productionOrders } from "@/lib/demo-data";
import type { ProductionOrder, Status } from "@/lib/domain/production";
import { movementRowToProductionOrder, toDbStatus, type MovementRow } from "@/lib/supabase-mappers";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { buildWorkerCode } from "@/lib/workers-service";

const materialCodeByName: Record<string, string> = {
  "Vàng 24K": "AU9999",
  "Vàng 18K": "AU750",
  "Platinum 900": "PT900",
  "Bạc 92.5": "AG925"
};

// Danh sach cot select cho material_movements dung chung o moi cho doc/ghi
// (load, create, update) - tranh liet ke tay lap lai o tung noi (de lech
// cot / quen cot khi them truong moi). fallback la ban rut gon dung khi
// Supabase bao loi thieu cot/schema cache (truoc khi user chay migration
// + reload schema).
const MOVEMENT_SELECT_COLUMNS = `
  id,
  order_id,
  process_name,
  occurred_date,
  destination,
  document_no,
  document_in_no,
  document_line_no,
  movement_type,
  qty_piece,
  item_sku,
  stage_status,
  issued_gram,
  returned_gram,
  powder_gram,
  transferred_weight_gram,
  loss_gram,
  loss_period,
  nxt_period,
  gold_age,
  source_material_name,
  source_name,
  import_source,
  export_source,
  material_type,
  nxt_link_code,
  converted_issue_weight,
  converted_return_weight,
  status,
  production_orders(order_code, sku, product_name),
  materials(name),
  workers(full_name)
`;

const MOVEMENT_SELECT_COLUMNS_FALLBACK = `
  id,
  order_id,
  process_name,
  issued_gram,
  returned_gram,
  powder_gram,
  loss_gram,
  status,
  production_orders(order_code, sku),
  materials(name),
  workers(full_name)
`;

function isMissingColumnError(message: string | undefined) {
  return Boolean(message?.includes("column") || message?.includes("schema cache"));
}

// Xay payload ghi vao material_movements tu 1 ProductionOrder - dung chung
// cho ca create va update, tranh liet ke tay field lap lai o 2 noi (chinh
// nguyen nhan gay bug rot field o cac phien sua truoc).
function buildMovementRow(
  order: ProductionOrder,
  params: { orderId: string; materialId: string; workerId: string; note: string }
) {
  return {
    order_id: params.orderId,
    material_id: params.materialId,
    worker_id: params.workerId,
    process_name: order.stage,
    issued_gram: order.issued,
    returned_gram: order.returned,
    powder_gram: order.powder,
    status: toDbStatus(order.status),
    note: params.note,
    occurred_date: order.occurredDate || null,
    destination: order.destination || null,
    document_no: order.documentNo || null,
    document_in_no: order.documentInNo || null,
    document_line_no: order.documentLineNo || null,
    movement_type: order.movementType || "issue",
    qty_piece: order.qtyPiece || null,
    item_sku: order.itemSku || order.sku || null,
    stage_status: order.stageStatus || null,
    transferred_weight_gram: order.transferred || null,
    gold_age: order.goldAge || null,
    source_material_name: order.sourceMaterialName || null,
    source_name: order.sourceName || null,
    import_source: order.importSource || null,
    export_source: order.exportSource || null,
    material_type: order.materialType || null,
    nxt_link_code: order.nxtLinkCode || null,
    loss_period: order.lossPeriod || null,
    nxt_period: order.nxtPeriod || null,
    converted_issue_weight: order.convertedIssueWeight || null,
    converted_return_weight: order.convertedReturnWeight || null
  };
}

// Ban rut gon cua buildMovementRow, dung lam fallback khi insert day du bi
// Supabase tu choi vi thieu cot (chua chay migration/reload schema).
function buildMovementRowBaseOnly(
  order: ProductionOrder,
  params: { orderId: string; materialId: string; workerId: string; note: string }
) {
  return {
    order_id: params.orderId,
    material_id: params.materialId,
    worker_id: params.workerId,
    process_name: order.stage,
    issued_gram: order.issued,
    returned_gram: order.returned,
    powder_gram: order.powder,
    status: toDbStatus(order.status),
    note: params.note
  };
}

// Gop ket qua tra ve tu Supabase (data map qua movementRowToProductionOrder)
// voi cac truong "goc" cua order dang giu o client - dung chung cho ca
// create va update de tranh viet tay lap lai danh sach field o 2 noi.
function mergeMovementResult(order: ProductionOrder, data: unknown): ProductionOrder {
  return {
    ...order,
    ...movementRowToProductionOrder(data as unknown as MovementRow),
    code: order.code,
    sku: order.sku,
    itemSku: order.itemSku || order.sku,
    productName: order.productName,
    destination: order.destination,
    occurredDate: order.occurredDate,
    documentNo: order.documentNo,
    documentInNo: order.documentInNo,
    documentLineNo: order.documentLineNo,
    movementType: order.movementType,
    qtyPiece: order.qtyPiece,
    transferred: order.transferred,
    lossPeriod: order.lossPeriod,
    nxtPeriod: order.nxtPeriod,
    goldAge: order.goldAge,
    sourceMaterialName: order.sourceMaterialName,
    nxtLinkCode: order.nxtLinkCode,
    sourceName: order.sourceName,
    importSource: order.importSource,
    exportSource: order.exportSource,
    materialType: order.materialType,
    convertedIssueWeight: order.convertedIssueWeight,
    convertedReturnWeight: order.convertedReturnWeight
  };
}

export async function loadProductionOrders(): Promise<ProductionOrder[]> {
  if (!isSupabaseConfigured || !supabase) {
    return productionOrders;
  }

  let result: any = await supabase
    .from("material_movements")
    .select(MOVEMENT_SELECT_COLUMNS)
    .order("occurred_date", { ascending: false, nullsFirst: false });

  if (isMissingColumnError(result.error?.message)) {
    result = await supabase
      .from("material_movements")
      .select(MOVEMENT_SELECT_COLUMNS_FALLBACK)
      .order("id", { ascending: false });
  }

  if (result.error || !result.data) {
    console.error("Failed to load material movements", result.error);
    throw new Error(`Không tải được nhật ký NVL: ${result.error?.message ?? "unknown error"}`);
  }

  return (result.data as unknown as MovementRow[]).map(movementRowToProductionOrder);
}

async function getMaterialId(materialName: string) {
  if (!supabase) throw new Error("Supabase is not configured");

  const byName = await supabase
    .from("materials")
    .select("id")
    .eq("name", materialName)
    .maybeSingle();

  if (byName.data) return byName.data.id as string;

  const code = materialCodeByName[materialName] ?? "AU750";
  const { data, error } = await supabase.from("materials").select("id").eq("code", code).single();

  if (error || !data) throw new Error(`Cannot find material ${code}`);
  return data.id as string;
}

async function upsertWorker(workerName: string, stage: string) {
  if (!supabase) throw new Error("Supabase is not configured");

  const byName = await supabase.from("workers").select("id").eq("full_name", workerName).maybeSingle();
  if (byName.data) return byName.data.id as string;

  const workerCode = buildWorkerCode(workerName);
  const { data, error } = await supabase
    .from("workers")
    .upsert(
      {
        worker_code: workerCode,
        full_name: workerName,
        department: "San xuat",
        stage
      },
      { onConflict: "worker_code" }
    )
    .select("id")
    .single();

  if (error || !data) throw new Error(`Cannot upsert worker ${workerName}`);
  return data.id as string;
}

async function upsertProductionOrder(order: ProductionOrder) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: existingOrder } = await supabase
    .from("production_orders")
    .select(
      "order_code, sku, product_name, destination, occurred_date, document_no, document_in_no, document_line_no, movement_type, quantity_piece, planned_date, planned_stage, planned_worker, planned_material, planned_gold_age, planned_material_type, issued_gram, returned_gram, powder_gram, transferred_weight_gram, loss_period, nxt_period, source_material_name, source_name, import_source, export_source, nxt_link_code, converted_issue_weight, converted_return_weight, status"
    )
    .eq("order_code", order.code)
    .maybeSingle();

  const mergedPayload = {
    order_code: order.code,
    sku: order.sku || existingOrder?.sku || null,
    product_name: order.productName || existingOrder?.product_name || null,
    destination: order.destination || existingOrder?.destination || null,
    occurred_date: order.occurredDate || existingOrder?.occurred_date || null,
    document_no: order.documentNo || existingOrder?.document_no || null,
    document_in_no: order.documentInNo || existingOrder?.document_in_no || null,
    document_line_no: order.documentLineNo || existingOrder?.document_line_no || null,
    movement_type: order.movementType || existingOrder?.movement_type || "issue",
    quantity_piece: order.qtyPiece && order.qtyPiece > 0 ? order.qtyPiece : existingOrder?.quantity_piece || null,
    planned_date: order.occurredDate || existingOrder?.planned_date || null,
    planned_stage: order.stage || existingOrder?.planned_stage || null,
    planned_worker: order.worker || existingOrder?.planned_worker || null,
    planned_material: order.material || existingOrder?.planned_material || null,
    planned_gold_age: order.goldAge || existingOrder?.planned_gold_age || null,
    planned_material_type: order.materialType || existingOrder?.planned_material_type || null,
    issued_gram: typeof order.issued === "number" ? order.issued : existingOrder?.issued_gram || null,
    returned_gram: typeof order.returned === "number" ? order.returned : existingOrder?.returned_gram || null,
    powder_gram: typeof order.powder === "number" ? order.powder : existingOrder?.powder_gram || null,
    transferred_weight_gram: typeof order.transferred === "number" ? order.transferred : existingOrder?.transferred_weight_gram || null,
    loss_period: order.lossPeriod || existingOrder?.loss_period || null,
    nxt_period: order.nxtPeriod || existingOrder?.nxt_period || null,
    source_material_name: order.sourceMaterialName || existingOrder?.source_material_name || null,
    source_name: order.sourceName || existingOrder?.source_name || null,
    import_source: order.importSource || existingOrder?.import_source || null,
    export_source: order.exportSource || existingOrder?.export_source || null,
    nxt_link_code: order.nxtLinkCode || existingOrder?.nxt_link_code || null,
    converted_issue_weight:
      typeof order.convertedIssueWeight === "number" ? order.convertedIssueWeight : existingOrder?.converted_issue_weight || null,
    converted_return_weight:
      typeof order.convertedReturnWeight === "number" ? order.convertedReturnWeight : existingOrder?.converted_return_weight || null,
    status: toDbStatus(order.status)
  };

  let result = await supabase
    .from("production_orders")
    .upsert(mergedPayload, { onConflict: "order_code" })
    .select("id")
    .single();

  const { data, error } = result;

  if (error || !data) {
    throw new Error(
      `Không lưu được LSX ${order.code} (thiếu cột trên Supabase? hãy chạy production_business_rules_upgrade.sql): ${error?.message ?? "unknown error"}`
    );
  }
  return data.id as string;
}

export async function createMaterialMovement(order: ProductionOrder): Promise<ProductionOrder> {
  if (!isSupabaseConfigured || !supabase) return order;

  const [orderId, materialId, workerId] = await Promise.all([
    upsertProductionOrder(order),
    getMaterialId(order.material),
    upsertWorker(order.worker, order.stage)
  ]);

  const rowParams = { orderId, materialId, workerId, note: "Created from QLKT K2 demo" };
  const fullRow = buildMovementRow(order, rowParams);

  let insertResult = await supabase
    .from("material_movements")
    .insert(fullRow)
    .select(MOVEMENT_SELECT_COLUMNS)
    .single();

  if (isMissingColumnError(insertResult.error?.message)) {
    insertResult = await supabase
      .from("material_movements")
      .insert(buildMovementRowBaseOnly(order, rowParams))
      .select(MOVEMENT_SELECT_COLUMNS_FALLBACK)
      .single();
  }

  const { data, error } = insertResult;

  if (error || !data) throw new Error(`Cannot create material movement: ${error?.message ?? "unknown error"}`);
  return mergeMovementResult(order, data);
}

export async function updateMaterialMovement(order: ProductionOrder): Promise<ProductionOrder> {
  if (!isSupabaseConfigured || !supabase) return order;
  if (!order.id) throw new Error("Thiếu id giao dịch để cập nhật NVL.");

  const [orderId, materialId, workerId] = await Promise.all([
    upsertProductionOrder(order),
    getMaterialId(order.material),
    upsertWorker(order.worker, order.stage)
  ]);

  const fullRow = buildMovementRow(order, { orderId, materialId, workerId, note: "Updated from QLKT K2 demo" });

  const { data, error } = await supabase
    .from("material_movements")
    .update(fullRow)
    .eq("id", order.id)
    .select(MOVEMENT_SELECT_COLUMNS)
    .single();

  if (error || !data) throw new Error(`Cannot update material movement: ${error?.message ?? "unknown error"}`);

  return mergeMovementResult(order, data);
}

export async function updateMaterialMovementStatus(id: string, status: Status) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("material_movements")
    .update({ status: toDbStatus(status) })
    .eq("id", id);

  if (error) throw new Error(`Cannot update status: ${error.message}`);
}

export async function deleteMaterialMovement(id: string) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("material_movements")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Cannot delete movement: ${error.message}`);
}
