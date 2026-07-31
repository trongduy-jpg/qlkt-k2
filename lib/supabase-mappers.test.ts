import { describe, expect, it } from "vitest";
import { movementRowToProductionOrder, type MovementRow } from "./supabase-mappers";

// Row day du nhu duong doc BINH THUONG (MOVEMENT_SELECT_COLUMNS) tra ve.
function makeFullMovementRow(overrides: Partial<MovementRow> = {}): MovementRow {
  return {
    id: "mv-1",
    order_id: "ord-1",
    material_id: "mat-1",
    worker_id: "wrk-1",
    process_name: "CKE",
    occurred_date: "2026-07-20",
    destination: "KCP",
    document_no: "PX-01",
    document_in_no: "PN-01",
    document_line_no: "3",
    movement_type: "issue",
    qty_piece: 2,
    issue_date: "2026-07-20",
    issue_sku: "RG750Y",
    issue_product_name: "Nhan vang",
    issue_qty_piece: 2,
    return_date: "2026-07-21",
    return_sku: "RG750Y",
    return_product_name: "Nhan vang",
    return_qty_piece: 2,
    item_sku: "RG750Y",
    stage_status: "Hoàn thành",
    issued_gram: 10,
    returned_gram: 8,
    powder_gram: 0,
    transferred_weight_gram: 1,
    loss_gram: 1,
    loss_period: "2026-07",
    nxt_period: "2026-07",
    gold_age: 0.75,
    source_material_name: "Vàng 18K",
    source_name: "KCP",
    import_source: "VN",
    export_source: "KT",
    material_type: "NL18K",
    nxt_link_code: "NXT-1",
    converted_issue_weight: 7.5,
    converted_return_weight: 6,
    status: "treo_no",
    production_orders: { order_code: "DHAG-26071", sku: "RG750Y", product_name: "Nhan vang" },
    materials: { name: "Vàng 18K" },
    workers: { full_name: "Nguyen Van An" },
    ...overrides
  };
}

// Row nhu duong FALLBACK rut gon (MOVEMENT_SELECT_COLUMNS_FALLBACK) tra ve:
// khong he co 2 khoa material_id / worker_id.
function makeFallbackMovementRow(): MovementRow {
  return {
    id: "mv-2",
    order_id: "ord-2",
    process_name: "DAN",
    issued_gram: 5,
    returned_gram: 4,
    powder_gram: 0,
    loss_gram: 1,
    status: "dang_xu_ly",
    production_orders: { order_code: "DHAG-26072", sku: "BC925", product_name: null },
    materials: { name: "Bạc 92.5" },
    workers: { full_name: "Tran Thi Bich" }
  };
}

describe("movementRowToProductionOrder — materialId / workerId", () => {
  it("map material_id va worker_id khi row day du (duong doc binh thuong)", () => {
    const mapped = movementRowToProductionOrder(makeFullMovementRow());
    expect(mapped.materialId).toBe("mat-1");
    expect(mapped.workerId).toBe("wrk-1");
  });

  it("tra ve undefined khi row KHONG co 2 truong nay (duong fallback)", () => {
    const mapped = movementRowToProductionOrder(makeFallbackMovementRow());
    expect(mapped.materialId).toBeUndefined();
    expect(mapped.workerId).toBeUndefined();
  });

  it("tra ve undefined khi id la null tuong minh", () => {
    const mapped = movementRowToProductionOrder(
      makeFullMovementRow({ material_id: null, worker_id: null })
    );
    expect(mapped.materialId).toBeUndefined();
    expect(mapped.workerId).toBeUndefined();
  });

  it("KHONG bao gio doi id thanh chuoi rong (chan hoi quy `?? \"\"`)", () => {
    const fromFallback = movementRowToProductionOrder(makeFallbackMovementRow());
    expect(fromFallback.materialId).not.toBe("");
    expect(fromFallback.workerId).not.toBe("");

    const fromNull = movementRowToProductionOrder(
      makeFullMovementRow({ material_id: null, worker_id: null })
    );
    expect(fromNull.materialId).not.toBe("");
    expect(fromNull.workerId).not.toBe("");
  });

  it("ten hien thi material/worker van lay tu bang join, khong bi id ghi de", () => {
    const mapped = movementRowToProductionOrder(makeFullMovementRow());
    expect(mapped.material).toBe("Vàng 18K");
    expect(mapped.worker).toBe("Nguyen Van An");
  });

  it("giu nguyen hanh vi cu: join material/worker null thi ten la chuoi rong", () => {
    const mapped = movementRowToProductionOrder(
      makeFullMovementRow({ materials: null, workers: null })
    );
    expect(mapped.material).toBe("");
    expect(mapped.worker).toBe("");
    // Id van map binh thuong du ten join bi null.
    expect(mapped.materialId).toBe("mat-1");
    expect(mapped.workerId).toBe("wrk-1");
  });
});

describe("movementRowToProductionOrder — hoi quy toan bo truong da map", () => {
  it("map dung tung truong mot cho row day du", () => {
    expect(movementRowToProductionOrder(makeFullMovementRow())).toEqual({
      id: "mv-1",
      orderId: "ord-1",
      code: "DHAG-26071",
      sku: "RG750Y",
      itemSku: "RG750Y",
      productName: "Nhan vang",
      material: "Vàng 18K",
      worker: "Nguyen Van An",
      materialId: "mat-1",
      workerId: "wrk-1",
      stage: "CKE",
      occurredDate: "2026-07-20",
      destination: "KCP",
      documentNo: "PX-01",
      documentInNo: "PN-01",
      documentLineNo: "3",
      movementType: "issue",
      qtyPiece: 2,
      issueDate: "2026-07-20",
      issueSku: "RG750Y",
      issueProductName: "Nhan vang",
      issueQtyPiece: 2,
      returnDate: "2026-07-21",
      returnSku: "RG750Y",
      returnProductName: "Nhan vang",
      returnQtyPiece: 2,
      stageStatus: "Hoàn thành",
      issued: 10,
      returned: 8,
      powder: 0,
      transferred: 1,
      loss: 1,
      lossPeriod: "2026-07",
      nxtPeriod: "2026-07",
      goldAge: 0.75,
      sourceMaterialName: "Vàng 18K",
      sourceName: "KCP",
      importSource: "VN",
      exportSource: "KT",
      materialType: "NL18K",
      nxtLinkCode: "NXT-1",
      convertedIssueWeight: 7.5,
      convertedReturnWeight: 6,
      status: "Treo nợ"
    });
  });

  it("map dung tung truong mot cho row fallback (cac truong thieu ve mac dinh cu)", () => {
    expect(movementRowToProductionOrder(makeFallbackMovementRow())).toEqual({
      id: "mv-2",
      orderId: "ord-2",
      code: "DHAG-26072",
      sku: "BC925",
      itemSku: "",
      productName: "",
      material: "Bạc 92.5",
      worker: "Tran Thi Bich",
      materialId: undefined,
      workerId: undefined,
      stage: "DAN",
      occurredDate: "",
      destination: "",
      documentNo: "",
      documentInNo: "",
      documentLineNo: "",
      movementType: "issue",
      qtyPiece: 0,
      issueDate: "",
      issueSku: "",
      issueProductName: "",
      issueQtyPiece: 0,
      returnDate: "",
      returnSku: "",
      returnProductName: "",
      returnQtyPiece: 0,
      stageStatus: "Đang thực hiện",
      issued: 5,
      returned: 4,
      powder: 0,
      transferred: 0,
      loss: 1,
      lossPeriod: "",
      nxtPeriod: "",
      goldAge: undefined,
      sourceMaterialName: "",
      sourceName: "",
      importSource: "",
      exportSource: "",
      materialType: "",
      nxtLinkCode: "",
      convertedIssueWeight: undefined,
      convertedReturnWeight: undefined,
      status: "Đang xử lý"
    });
  });
});
