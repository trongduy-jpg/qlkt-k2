import { productionOrders, type ProductionOrder, type Status } from "@/lib/demo-data";
import { fromDbStatus, movementRowToProductionOrder, toDbStatus, type MovementRow } from "@/lib/supabase-mappers";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
  stage: string | null;
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
};

export type ProductionOrderHeaderRecord = ProductionOrderHeaderInput & {
  id: string;
  createdAt: string;
};

const materialCodeByName: Record<string, string> = {
  "Vàng 24K": "AU9999",
  "Vàng 18K": "AU750",
  "Platinum 900": "PT900",
  "Bạc 92.5": "AG925"
};

function buildWorkerCode(workerName: string) {
  return `W-${workerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 24)}`;
}

export async function loadProductionOrders(): Promise<ProductionOrder[]> {
  if (!isSupabaseConfigured || !supabase) {
    return productionOrders;
  }

  let result: any = await supabase
    .from("material_movements")
    .select(`
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
      order_id,
      production_orders(order_code, sku, product_name),
      materials(name),
      workers(full_name)
    `)
    .order("occurred_date", { ascending: false, nullsFirst: false });

  if (result.error?.message?.includes("column") || result.error?.message?.includes("schema cache")) {
    result = await supabase
      .from("material_movements")
      .select(`
        id,
        order_id,
        process_name,
        order_id,
        issued_gram,
        returned_gram,
        powder_gram,
        loss_gram,
        status,
        production_orders(order_code, sku),
        materials(name),
        workers(full_name)
      `)
      .order("id", { ascending: false });
  }

  if (result.error || !result.data) {
    console.error("Failed to load material movements", result.error);
    throw new Error(`Không tải được nhật ký NVL: ${result.error?.message ?? "unknown error"}`);
  }

  return (result.data as unknown as MovementRow[]).map(movementRowToProductionOrder);
}

export async function loadMaterials(): Promise<MaterialMaster[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [
      { id: "local-au9999", code: "AU9999", name: "Vàng 24K", category: "gold", purity: 0.9999, unit: "gram" },
      { id: "local-au750", code: "AU750", name: "Vàng 18K", category: "gold", purity: 0.75, unit: "gram" },
      { id: "local-pt900", code: "PT900", name: "Platinum 900", category: "platinum", purity: 0.9, unit: "gram" },
      { id: "local-ag925", code: "AG925", name: "Bạc 92.5", category: "silver", purity: 0.925, unit: "gram" }
    ];
  }

  const { data, error } = await supabase
    .from("materials")
    .select("id, code, name, category, purity, unit")
    .order("code", { ascending: true });

  if (error || !data) throw new Error(`Cannot load materials: ${error?.message ?? "unknown error"}`);
  return data.map((item) => ({ ...item, purity: Number(item.purity) })) as MaterialMaster[];
}

export async function loadWorkers(): Promise<WorkerMaster[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [
      { id: "local-td003", worker_code: "TD003", full_name: "Le Van Tung", department: "San xuat", stage: "Can keo" },
      { id: "local-td004", worker_code: "TD004", full_name: "Nguyen Van An", department: "San xuat", stage: "Can dat" }
    ];
  }

  const { data, error } = await supabase
    .from("workers")
    .select("id, worker_code, full_name, department, stage")
    .order("worker_code", { ascending: true });

  if (error || !data) throw new Error(`Cannot load workers: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster[];
}

export async function loadProductionOrderHeaders(): Promise<ProductionOrderHeaderRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let result: any = await supabase
    .from("production_orders")
    .select("id, order_code, sku, product_name, destination, order_date, occurred_date, document_no, document_in_no, document_line_no, movement_type, quantity_piece, planned_date, planned_stage, planned_worker, planned_material, material_spec, planned_gold_age, planned_material_type, delivery_status, order_month, sales_type, customer_name, specification, deadline_date, completed_date, delivered_qty, actual_progress_note, completed_weight_gram, issued_gram, returned_gram, powder_gram, transferred_weight_gram, loss_period, nxt_period, source_material_name, source_name, import_source, export_source, nxt_link_code, converted_issue_weight, converted_return_weight, note, status, created_at")
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
    createdAt: String(row.created_at ?? "")
  }));
}

export async function loadDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      usingRealSupabase: false,
      counts: {
        productionOrders: 0,
        materialMovements: 0,
        materials: 0,
        workers: 0,
        auditLogs: 0
      },
      hasOperationalData: false
    };
  }

  const [productionOrdersResult, materialMovementsResult, materialsResult, workersResult, auditLogsResult] = await Promise.all([
    supabase.from("production_orders").select("*", { count: "exact", head: true }),
    supabase.from("material_movements").select("*", { count: "exact", head: true }),
    supabase.from("materials").select("*", { count: "exact", head: true }),
    supabase.from("workers").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("*", { count: "exact", head: true })
  ]);

  const errorMessage = [
    productionOrdersResult.error?.message,
    materialMovementsResult.error?.message,
    materialsResult.error?.message,
    workersResult.error?.message,
    auditLogsResult.error?.message
  ]
    .filter(Boolean)
    .join(" | ");

  const counts = {
    productionOrders: productionOrdersResult.count ?? 0,
    materialMovements: materialMovementsResult.count ?? 0,
    materials: materialsResult.count ?? 0,
    workers: workersResult.count ?? 0,
    auditLogs: auditLogsResult.count ?? 0
  };

  return {
    usingRealSupabase: true,
    counts,
    hasOperationalData: counts.productionOrders > 0 || counts.materialMovements > 0,
    errorMessage: errorMessage || undefined
  };
}

export async function createMaterial(input: Omit<MaterialMaster, "id">): Promise<MaterialMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("materials")
    .insert(input)
    .select("id, code, name, category, purity, unit")
    .single();

  if (error || !data) throw new Error(`Cannot create material: ${error?.message ?? "unknown error"}`);
  return { ...data, purity: Number(data.purity) } as MaterialMaster;
}

export async function createWorker(input: Omit<WorkerMaster, "id">): Promise<WorkerMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("workers")
    .insert(input)
    .select("id, worker_code, full_name, department, stage")
    .single();

  if (error || !data) throw new Error(`Cannot create worker: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster;
}

export async function updateWorker(id: string, input: Omit<WorkerMaster, "id">): Promise<WorkerMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id };
  }

  const { data, error } = await supabase
    .from("workers")
    .update(input)
    .eq("id", id)
    .select("id, worker_code, full_name, department, stage")
    .single();

  if (error || !data) throw new Error(`Cannot update worker: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster;
}

export async function deleteWorker(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (error) throw new Error(`Cannot delete worker: ${error.message}`);
}

export async function createProductionOrderHeader(input: ProductionOrderHeaderInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  let result = await supabase
    .from("production_orders")
    .upsert(
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
        status: toDbStatus(input.status)
      },
      { onConflict: "order_code" }
    )
    .select("id")
    .single();

  if (result.error || !result.data) {
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
      status: toDbStatus(input.status)
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

  const movementPayload = {
    order_id: orderId,
    material_id: materialId,
    worker_id: workerId,
    process_name: order.stage,
    issued_gram: order.issued,
    returned_gram: order.returned,
    powder_gram: order.powder,
    status: toDbStatus(order.status),
    note: "Created from QLKT K2 demo"
  };

  const extendedMovementPayload = {
    ...movementPayload,
    occurred_date: order.occurredDate || null,
    destination: order.destination || null,
    document_no: order.documentNo || null,
    document_in_no: order.documentInNo || null,
    document_line_no: order.documentLineNo || null,
    movement_type: order.movementType || "issue",
    qty_piece: order.qtyPiece || null,
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

  let insertResult = await supabase
    .from("material_movements")
    .insert(extendedMovementPayload)
    .select(`
      id,
      process_name,
      occurred_date,
      destination,
      document_no,
      document_in_no,
      document_line_no,
      movement_type,
      qty_piece,
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
      order_id,
      production_orders(order_code, sku, product_name),
      materials(name),
      workers(full_name)
    `)
    .single();

  if (insertResult.error?.message.includes("column") || insertResult.error?.message.includes("schema cache")) {
    insertResult = await supabase
      .from("material_movements")
      .insert(movementPayload)
      .select(`
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
      `)
      .single();
  }

  const { data, error } = insertResult;

  if (error || !data) throw new Error(`Cannot create material movement: ${error?.message ?? "unknown error"}`);
  return {
    ...order,
    ...movementRowToProductionOrder(data as unknown as MovementRow),
    code: order.code,
    sku: order.sku,
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

export async function updateMaterialMovement(order: ProductionOrder): Promise<ProductionOrder> {
  if (!isSupabaseConfigured || !supabase) return order;
  if (!order.id) throw new Error("Thiếu id giao dịch để cập nhật NVL.");

  const [orderId, materialId, workerId] = await Promise.all([
    upsertProductionOrder(order),
    getMaterialId(order.material),
    upsertWorker(order.worker, order.stage)
  ]);

  const movementPayload = {
    order_id: orderId,
    material_id: materialId,
    worker_id: workerId,
    process_name: order.stage,
    issued_gram: order.issued,
    returned_gram: order.returned,
    powder_gram: order.powder,
    status: toDbStatus(order.status),
    note: "Updated from QLKT K2 demo",
    occurred_date: order.occurredDate || null,
    destination: order.destination || null,
    document_no: order.documentNo || null,
    document_in_no: order.documentInNo || null,
    document_line_no: order.documentLineNo || null,
    movement_type: order.movementType || "issue",
    qty_piece: order.qtyPiece || null,
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

  const { data, error } = await supabase
    .from("material_movements")
    .update(movementPayload)
    .eq("id", order.id)
    .select(`
      id,
      process_name,
      order_id,
      occurred_date,
      destination,
      document_no,
      document_in_no,
      document_line_no,
      movement_type,
      qty_piece,
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
    `)
    .single();

  if (error || !data) throw new Error(`Cannot update material movement: ${error?.message ?? "unknown error"}`);

  return {
    ...order,
    ...movementRowToProductionOrder(data as unknown as MovementRow),
    code: order.code,
    sku: order.sku,
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

export async function updateMaterialMovementStatus(id: string, status: Status) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("material_movements")
    .update({ status: toDbStatus(status) })
    .eq("id", id);

  if (error) throw new Error(`Cannot update status: ${error.message}`);
}

export async function updateProductionOrderStatus(orderCode: string, status: Status) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("production_orders")
    .update({ status: toDbStatus(status) })
    .eq("order_code", orderCode);

  if (error) throw new Error(`Cannot update production order status: ${error.message}`);
}

export async function deleteMaterialMovement(id: string) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("material_movements")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Cannot delete movement: ${error.message}`);
}

export async function createAuditLog(action: string, detail: string, entityId?: string) {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase.from("audit_logs").insert({
    entity_name: "material_movements",
    entity_id: entityId ?? "00000000-0000-0000-0000-000000000000",
    action,
    after_data: { detail }
  });
}
