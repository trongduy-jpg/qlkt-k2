import { describe, expect, it } from "vitest";
import type { ProductionOrder } from "./demo-data";
import type { OrderSummary, ProductionOrderHeader } from "./production-types";
import {
  buildProductionOverview,
  buildSelectedOrderDetail,
  filterJournalOrders,
  filterProductionSummaries
} from "./production-workflow";

function makeMovement(overrides: Partial<ProductionOrder>): ProductionOrder {
  return {
    id: overrides.id ?? "mov-1",
    code: overrides.code ?? "DHAG-26071",
    sku: overrides.sku ?? "RG750Y",
    productName: overrides.productName ?? "Nhẫn test",
    material: overrides.material ?? "Vàng 18K",
    worker: overrides.worker ?? "Nguyen Van An",
    stage: overrides.stage ?? "CKE",
    occurredDate: overrides.occurredDate ?? "2026-07-20",
    issued: overrides.issued ?? 0,
    returned: overrides.returned ?? 0,
    powder: overrides.powder ?? 0,
    loss: overrides.loss ?? 0,
    status: overrides.status ?? "Đang xử lý",
    ...overrides
  };
}

function makeSummary(overrides: Partial<OrderSummary>): OrderSummary {
  return {
    code: overrides.code ?? "DHAG-26071",
    sku: overrides.sku ?? "RG750Y",
    productName: overrides.productName ?? "Nhẫn test",
    destination: overrides.destination ?? "CH1",
    qtyPiece: overrides.qtyPiece ?? 12,
    plannedDate: overrides.plannedDate ?? "2026-07-17",
    plannedStage: overrides.plannedStage ?? "CKE",
    plannedWorker: overrides.plannedWorker ?? "Le Van Tung",
    plannedMaterial: overrides.plannedMaterial ?? "Vàng 18K",
    materialSpec: overrides.materialSpec ?? "18KY",
    deliveryStatus: overrides.deliveryStatus ?? "Chưa Hoàn Tất",
    salesType: overrides.salesType ?? "SR",
    customerName: overrides.customerName ?? "Khach test",
    deadlineDate: overrides.deadlineDate ?? "2026-07-25",
    movementCount: overrides.movementCount ?? 0,
    issued: overrides.issued ?? 0,
    returned: overrides.returned ?? 0,
    powder: overrides.powder ?? 0,
    loss: overrides.loss ?? 0,
    status: overrides.status ?? "Đang xử lý",
    workers: overrides.workers ?? [],
    materials: overrides.materials ?? [],
    ...overrides
  };
}

function makeHeader(overrides: Partial<ProductionOrderHeader>): ProductionOrderHeader {
  return {
    id: overrides.id ?? "h1",
    code: overrides.code ?? "DHAG-26071",
    sku: overrides.sku ?? "RG750Y",
    productName: overrides.productName ?? "Nhẫn header",
    destination: overrides.destination ?? "CH2",
    orderDate: overrides.orderDate ?? "2026-07-17",
    occurredDate: overrides.occurredDate ?? "2026-07-17",
    documentNo: overrides.documentNo ?? "",
    documentInNo: overrides.documentInNo ?? "",
    documentLineNo: overrides.documentLineNo ?? "",
    movementType: overrides.movementType ?? "issue",
    qtyPiece: overrides.qtyPiece ?? 10,
    plannedDate: overrides.plannedDate ?? "2026-07-17",
    plannedStage: overrides.plannedStage ?? "CDT",
    plannedWorker: overrides.plannedWorker ?? "Tran Minh Khoi",
    plannedMaterial: overrides.plannedMaterial ?? "Bạc 92.5",
    materialSpec: overrides.materialSpec ?? "BAC925",
    plannedGoldAge: overrides.plannedGoldAge ?? 0.925,
    plannedMaterialType: overrides.plannedMaterialType ?? "BAC925",
    deliveryStatus: overrides.deliveryStatus ?? "Chưa Hoàn Tất",
    orderMonth: overrides.orderMonth ?? "2026-07",
    salesType: overrides.salesType ?? "KH",
    customerName: overrides.customerName ?? "Khach header",
    specification: overrides.specification ?? "",
    deadlineDate: overrides.deadlineDate ?? "2026-07-28",
    completedDate: overrides.completedDate ?? "",
    deliveredQty: overrides.deliveredQty ?? 0,
    actualProgressNote: overrides.actualProgressNote ?? "",
    completedWeightGram: overrides.completedWeightGram ?? 0,
    issued: overrides.issued ?? 0,
    returned: overrides.returned ?? 0,
    powder: overrides.powder ?? 0,
    transferred: overrides.transferred ?? 0,
    lossPeriod: overrides.lossPeriod ?? "",
    nxtPeriod: overrides.nxtPeriod ?? "",
    sourceMaterialName: overrides.sourceMaterialName ?? "",
    sourceName: overrides.sourceName ?? "",
    importSource: overrides.importSource ?? "",
    exportSource: overrides.exportSource ?? "",
    nxtLinkCode: overrides.nxtLinkCode ?? "",
    convertedIssueWeight: overrides.convertedIssueWeight ?? 0,
    convertedReturnWeight: overrides.convertedReturnWeight ?? 0,
    note: overrides.note ?? "",
    status: overrides.status ?? "Đang xử lý",
    createdAt: overrides.createdAt ?? "17/07/26 10:00:00",
    ...overrides
  };
}

describe("filterProductionSummaries", () => {
  it("loc LSX theo query va trang thai deadline", () => {
    const rows = [
      makeSummary({ code: "DHAG-1", sku: "A", customerName: "Alpha", deadlineDate: "2026-07-10" }),
      makeSummary({ code: "DHAG-2", sku: "B", customerName: "Beta", deadlineDate: "2026-08-10" })
    ];

    const result = filterProductionSummaries(rows, {
      deliveryStatus: "Tất cả trạng thái LSX",
      salesType: "Tất cả SR/KH",
      deadlineFilter: "Quá hạn",
      destination: "Tất cả cửa hàng",
      codeMonth: "Tất cả tháng",
      query: "alpha",
      today: "2026-07-22"
    });

    expect(result.map((item) => item.code)).toEqual(["DHAG-1"]);
  });

  it("loc LSX theo cua hang va thang doc tu Ma LSX", () => {
    const rows = [
      makeSummary({ code: "DHAG-26071", sku: "A", destination: "CH1" }),
      makeSummary({ code: "DHAG-26072", sku: "B", destination: "CH2" }),
      makeSummary({ code: "DHAG-26081", sku: "C", destination: "CH1" })
    ];

    const byDestination = filterProductionSummaries(rows, {
      deliveryStatus: "Tất cả trạng thái LSX",
      salesType: "Tất cả SR/KH",
      deadlineFilter: "Tất cả deadline",
      destination: "CH1",
      codeMonth: "Tất cả tháng",
      query: ""
    });
    expect(byDestination.map((item) => item.code)).toEqual(["DHAG-26071", "DHAG-26081"]);

    const byMonth = filterProductionSummaries(rows, {
      deliveryStatus: "Tất cả trạng thái LSX",
      salesType: "Tất cả SR/KH",
      deadlineFilter: "Tất cả deadline",
      destination: "Tất cả cửa hàng",
      codeMonth: "2026-07",
      query: ""
    });
    expect(byMonth.map((item) => item.code)).toEqual(["DHAG-26071", "DHAG-26072"]);
  });
});

describe("filterJournalOrders", () => {
  it("loc NK NVL theo ma LSX, ma hang, ten hang, tho hoac cong doan", () => {
    const rows = [
      makeMovement({ code: "DHAG-1", sku: "RG750Y", worker: "An", stage: "CKE", status: "Đang xử lý" }),
      makeMovement({ code: "DHAG-2", sku: "BC925", worker: "Binh", stage: "NAU", status: "Treo nợ" })
    ];

    expect(filterJournalOrders(rows, { query: "bc925", status: "Tất cả" }).map((item) => item.code)).toEqual(["DHAG-2"]);
    expect(filterJournalOrders(rows, { query: "", status: "Đang xử lý" }).map((item) => item.code)).toEqual(["DHAG-1"]);
  });
});

describe("buildProductionOverview", () => {
  it("tinh tong, LSX chua co giao dich, dang xu ly va qua han", () => {
    const rows = [
      makeSummary({ movementCount: 0, status: "Đang xử lý", deadlineDate: "2026-07-10" }),
      makeSummary({ code: "DHAG-2", movementCount: 1, status: "Đã chốt", deadlineDate: "2026-08-01" })
    ];

    expect(buildProductionOverview(rows, "2026-07-22")).toEqual({
      total: 2,
      noMovementCount: 1,
      overdueCount: 1,
      inProgressCount: 1
    });
  });
});

describe("buildSelectedOrderDetail", () => {
  it("uu tien giao dich moi nhat cho thong tin van hanh, giu header cho thong tin goc", () => {
    const detail = buildSelectedOrderDetail(
      makeSummary({ code: "DHAG-1", sku: "SUM", qtyPiece: 3, plannedStage: "CKE", plannedWorker: "Worker summary" }),
      [
        makeMovement({
          code: "DHAG-1",
          sku: "MOV",
          destination: "NKBC",
          stage: "NAU",
          worker: "Worker movement",
          material: "Platinum 900",
          goldAge: 0.9,
          status: "Treo nợ"
        })
      ],
      [makeHeader({ code: "DHAG-1", sku: "HEADER", customerName: "Customer header" })]
    );

    expect(detail).toMatchObject({
      code: "DHAG-1",
      sku: "SUM",
      customerName: "Khach test",
      operationalStatus: "Treo nợ",
      destination: "NKBC",
      stage: "NAU",
      worker: "Worker movement",
      plannedMaterial: "Platinum 900",
      movementCount: 1
    });
  });
});
