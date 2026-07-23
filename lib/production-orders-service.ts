import type { ProductionOrder, Status } from "@/lib/domain/production";
import { fromDbStatus, toDbStatus } from "@/lib/supabase-mappers";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductionOrderHeaderInput, ProductionOrderHeaderRecord } from "@/lib/material-service-types";

export async function loadProductionOrderHeaders(): Promise<ProductionOrderHeaderRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let result: any = await supabase
    .from("production_orders")
    .select("id, order_code, sku, product_name, destination, order_date, occurred_date, document_no, document_in_no, document_line_no, movement_type, quantity_piece, planned_date, planned_stage, planned_worker, planned_material, material_spec, planned_gold_age, planned_material_type, delivery_status, order_month, sales_type, customer_name, specification, deadline_date, completed_date, delivered_qty, actual_progress_note, completed_weight_gram, issued_gram, returned_gram, powder_gram, transferred_weight_gram, loss_period, nxt_period, source_material_name, source_name, import_source, export_source, nxt_link_code, converted_issue_weight, converted_return_weight, note, status, created_at, parent_order_code")
    .order("created_at", { ascending: false });

  if (result.error || !result.data) {
    console.error("Failed to load production order headers", result.error);
    throw new Error(
      `Không tải được thông tin LSX (thiếu cột trên Supabase? hãy chạy production_business_rules_upgrade.sql roi NOTIFY pgrst, 'reload schema';): ${result.error?.message ?? "unknown error"}`
    );
  }

  return result.data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    code: String(row.order_code ?? ""),
    sku: String(row.sku ?? ""),
    productName: String(row.product_name ?? ""),
    destination: String(row.destination ?? ""),
    orderDate: String(row.order_date ?? ""),
    occurredDate: String(row.occurred_date ?? row.planned_date ?? ""),
    documentNo: String(row.document_no ?? ""),
    documentInNo: String(row.document_in_no ?? ""),
    documentLineNo: String(row.document_line_no ?? ""),
    movementType: (String(row.movement_type ?? "issue") as ProductionOrder["movementType"]),
    qtyPiece: Number(row.quantity_piece ?? 0),
    plannedDate: String(row.planned_date ?? ""),
    plannedStage: String(row.planned_stage ?? ""),
    plannedWorker: String(row.planned_worker ?? ""),
    plannedMaterial: String(row.planned_material ?? ""),
    materialSpec: String(row.material_spec ?? ""),
    plannedGoldAge: Number(row.planned_gold_age ?? 0),
    plannedMaterialType: String(row.planned_material_type ?? ""),
    deliveryStatus: String(row.delivery_status ?? ""),
    orderMonth: String(row.order_month ?? ""),
    salesType: String(row.sales_type ?? ""),
    customerName: String(row.customer_name ?? ""),
    specification: String(row.specification ?? ""),
    deadlineDate: String(row.deadline_date ?? ""),
    completedDate: String(row.completed_date ?? ""),
    deliveredQty: Number(row.delivered_qty ?? 0),
    actualProgressNote: String(row.actual_progress_note ?? ""),
    completedWeightGram: Number(row.completed_weight_gram ?? 0),
    issued: Number(row.issued_gram ?? 0),
    returned: Number(row.returned_gram ?? 0),
    powder: Number(row.powder_gram ?? 0),
    transferred: Number(row.transferred_weight_gram ?? 0),
    lossPeriod: String(row.loss_period ?? ""),
    nxtPeriod: String(row.nxt_period ?? ""),
    sourceMaterialName: String(row.source_material_name ?? ""),
    sourceName: String(row.source_name ?? ""),
    importSource: String(row.import_source ?? ""),
    exportSource: String(row.export_source ?? ""),
    nxtLinkCode: String(row.nxt_link_code ?? ""),
    convertedIssueWeight: Number(row.converted_issue_weight ?? 0),
    convertedReturnWeight: Number(row.converted_return_weight ?? 0),
    note: String(row.note ?? ""),
    status: fromDbStatus(String(row.status ?? "dang_xu_ly")),
    createdAt: String(row.created_at ?? ""),
    parentOrderCode: String(row.parent_order_code ?? "")
  }));
}

export async function createProductionOrderHeader(input: ProductionOrderHeaderInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  let result = await supabase
    .from("production_orders")
    .insert(
      {
        order_code: input.code,
        sku: input.sku,
        product_name: input.productName || null,
        destination: input.destination || null,
        order_date: input.orderDate || null,
        occurred_date: input.occurredDate || input.plannedDate || null,
        document_no: input.documentNo || null,
        document_in_no: input.documentInNo || null,
        document_line_no: input.documentLineNo || null,
        movement_type: input.movementType || "issue",
        quantity_piece: input.qtyPiece || null,
        planned_date: input.plannedDate || null,
        planned_stage: input.plannedStage || null,
        planned_worker: input.plannedWorker || null,
        planned_material: input.plannedMaterial || null,
        material_spec: input.materialSpec || null,
        planned_gold_age: input.plannedGoldAge || null,
        planned_material_type: input.plannedMaterialType || null,
        delivery_status: input.deliveryStatus || null,
        order_month: input.orderMonth || null,
        sales_type: input.salesType || null,
        customer_name: input.customerName || null,
        specification: input.specification || null,
        deadline_date: input.deadlineDate || null,
        completed_date: input.completedDate || null,
        delivered_qty: input.deliveredQty || null,
        actual_progress_note: input.actualProgressNote || null,
        completed_weight_gram: input.completedWeightGram || null,
        issued_gram: input.issued || null,
        returned_gram: input.returned || null,
        powder_gram: input.powder || null,
        transferred_weight_gram: input.transferred || null,
        loss_period: input.lossPeriod || null,
        nxt_period: input.nxtPeriod || null,
        source_material_name: input.sourceMaterialName || null,
        source_name: input.sourceName || null,
        import_source: input.importSource || null,
        export_source: input.exportSource || null,
        nxt_link_code: input.nxtLinkCode || null,
        converted_issue_weight: input.convertedIssueWeight || null,
        converted_return_weight: input.convertedReturnWeight || null,
        note: input.note || null,
        status: toDbStatus(input.status),
        parent_order_code: input.parentOrderCode || null
      }
    )
    .select("id")
    .single();

  if (result.error || !result.data) {
    if (result.error?.code === "23505" || result.error?.message.includes("duplicate key")) {
      throw new Error(`LSX ${input.code} đã tồn tại. Vui lòng chọn mã khác.`);
    }
    throw new Error(
      `Không lưu được LSX (thiếu cột trên Supabase? hãy chạy production_business_rules_upgrade.sql): ${result.error?.message ?? "unknown error"}`
    );
  }
  return { ...input, id: result.data.id as string };
}

export async function updateProductionOrderHeader(orderCode: string, input: ProductionOrderHeaderInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: orderCode };
  }

  let result = await supabase
    .from("production_orders")
    .update({
      order_code: input.code,
      sku: input.sku,
      product_name: input.productName || null,
      destination: input.destination || null,
      order_date: input.orderDate || null,
      occurred_date: input.occurredDate || input.plannedDate || null,
      document_no: input.documentNo || null,
      document_in_no: input.documentInNo || null,
      document_line_no: input.documentLineNo || null,
      movement_type: input.movementType || "issue",
      quantity_piece: input.qtyPiece || null,
      planned_date: input.plannedDate || null,
      planned_stage: input.plannedStage || null,
      planned_worker: input.plannedWorker || null,
      planned_material: input.plannedMaterial || null,
      material_spec: input.materialSpec || null,
      planned_gold_age: input.plannedGoldAge || null,
      planned_material_type: input.plannedMaterialType || null,
      delivery_status: input.deliveryStatus || null,
      order_month: input.orderMonth || null,
      sales_type: input.salesType || null,
      customer_name: input.customerName || null,
      specification: input.specification || null,
      deadline_date: input.deadlineDate || null,
      completed_date: input.completedDate || null,
      delivered_qty: input.deliveredQty || null,
      actual_progress_note: input.actualProgressNote || null,
      completed_weight_gram: input.completedWeightGram || null,
      issued_gram: input.issued || null,
      returned_gram: input.returned || null,
      powder_gram: input.powder || null,
      transferred_weight_gram: input.transferred || null,
      loss_period: input.lossPeriod || null,
      nxt_period: input.nxtPeriod || null,
      source_material_name: input.sourceMaterialName || null,
      source_name: input.sourceName || null,
      import_source: input.importSource || null,
      export_source: input.exportSource || null,
      nxt_link_code: input.nxtLinkCode || null,
      converted_issue_weight: input.convertedIssueWeight || null,
      converted_return_weight: input.convertedReturnWeight || null,
      note: input.note || null,
      status: toDbStatus(input.status),
      parent_order_code: input.parentOrderCode || null
    })
    .eq("order_code", orderCode)
    .select("id")
    .single();

  if (result.error || !result.data) {
    throw new Error(
      `Không cập nhật được LSX (thiếu cột trên Supabase? hãy chạy production_business_rules_upgrade.sql): ${result.error?.message ?? "unknown error"}`
    );
  }
  return { ...input, id: result.data.id as string };
}

export async function updateProductionOrderStatus(orderCode: string, status: Status) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("production_orders")
    .update({ status: toDbStatus(status) })
    .eq("order_code", orderCode);

  if (error) throw new Error(`Cannot update production order status: ${error.message}`);
}
