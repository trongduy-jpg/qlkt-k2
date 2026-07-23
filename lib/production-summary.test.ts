import { describe, expect, it } from "vitest";
import type { ProductionOrder } from "./demo-data";
import {
  buildDraftStageMovements,
  buildLossReportRows,
  buildOrderSummaries,
  buildStageOptionsForDropdown,
  buildStageProgress,
  computeMovementTotals,
  selectMovementsForOrder
} from "./production-summary";

function makeOrder(overrides: Partial<ProductionOrder>): ProductionOrder {
  return {
    id: overrides.id ?? "mov-1",
    code: "DHAG-26071",
    sku: "RG750Y",
    material: "Vàng 18K",
    worker: "Nguyen Van An",
    stage: "CKE",
    occurredDate: "2026-07-20",
    issued: 0,
    returned: 0,
    powder: 0,
    loss: 0,
    status: "Treo nợ",
    ...overrides
  };
}

describe("selectMovementsForOrder", () => {
  const orders = [
    makeOrder({ id: "a", code: "DHAG-26071", occurredDate: "2026-07-18" }),
    makeOrder({ id: "b", code: "DHAG-26071", occurredDate: "2026-07-20" }),
    makeOrder({ id: "c", code: "DHAG-26072", occurredDate: "2026-07-21" })
  ];

  it("chi lay giao dich cua dung ma LSX, moi nhat truoc", () => {
    const result = selectMovementsForOrder(orders, "DHAG-26071");
    expect(result.map((o) => o.id)).toEqual(["b", "a"]);
  });

  it("tra ve mang rong khi khong co code", () => {
    expect(selectMovementsForOrder(orders, null)).toEqual([]);
    expect(selectMovementsForOrder(orders, undefined)).toEqual([]);
  });
});

describe("computeMovementTotals", () => {
  it("cong don issued/returned/powder/loss", () => {
    const movements = [
      makeOrder({ issued: 10, returned: 8, powder: 0.5, loss: 1.5 }),
      makeOrder({ issued: 5, returned: 5, powder: 0, loss: 0 })
    ];
    expect(computeMovementTotals(movements)).toEqual({ issued: 15, returned: 13, powder: 0.5, loss: 1.5 });
  });

  it("tra ve tat ca 0 khi mang rong", () => {
    expect(computeMovementTotals([])).toEqual({ issued: 0, returned: 0, powder: 0, loss: 0 });
  });
});

describe("buildOrderSummaries", () => {
  it("gop nhieu giao dich cung ma LSX thanh 1 dong tong hop", () => {
    const orders = [
      makeOrder({ id: "a", code: "DHAG-26071", stage: "CKE", worker: "An", issued: 10, returned: 8, loss: 2, status: "Treo nợ" }),
      makeOrder({ id: "b", code: "DHAG-26071", stage: "CDT", worker: "Binh", issued: 5, returned: 4, loss: 1, status: "Đang xử lý" })
    ];

    const summaries = buildOrderSummaries(orders, []);
    expect(summaries).toHaveLength(1);
    const summary = summaries[0];
    expect(summary.code).toBe("DHAG-26071");
    expect(summary.movementCount).toBe(2);
    expect(summary.issued).toBe(15);
    expect(summary.returned).toBe(12);
    expect(summary.loss).toBe(3);
    expect(summary.workers).toEqual(expect.arrayContaining(["An", "Binh"]));
  });

  it("LSX chua co giao dich nao van xuat hien tu header voi movementCount = 0", () => {
    const header = {
      id: "h1",
      code: "DHAG-26073",
      sku: "RG750Y",
      productName: "",
      destination: "CH1",
      orderDate: "2026-07-20",
      occurredDate: "2026-07-20",
      documentNo: "",
      documentInNo: "",
      documentLineNo: "",
      movementType: "issue" as const,
      qtyPiece: 0,
      plannedDate: "2026-07-20",
      plannedStage: "CKE",
      plannedWorker: "",
      plannedMaterial: "Vàng 18K",
      materialSpec: "18KY",
      plannedGoldAge: 0.75,
      plannedMaterialType: "NL18K",
      deliveryStatus: "Chưa Hoàn Tất",
      orderMonth: "2026-07",
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
      lossPeriod: "",
      nxtPeriod: "",
      sourceMaterialName: "",
      sourceName: "",
      importSource: "",
      exportSource: "",
      nxtLinkCode: "",
      convertedIssueWeight: 0,
      convertedReturnWeight: 0,
      note: "",
      status: "Đang xử lý",
      createdAt: "20/07/26 10:00:00",
      parentOrderCode: "",
      items: []
    };

    const summaries = buildOrderSummaries([], [header]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].movementCount).toBe(0);
    expect(summaries[0].status).toBe("Đang xử lý");
  });
});

describe("buildDraftStageMovements va buildStageProgress", () => {
  const stageOptions = buildStageOptionsForDropdown([], [
    { value: "CKE", label: "CKE – Cán kéo" },
    { value: "CDT", label: "CDT – Cán dát" }
  ]);

  it("buildDraftStageMovements chi lay giao dich moi nhat cho moi khau cua dung LSX", () => {
    const orders = [
      makeOrder({ id: "a", code: "DHAG-26071", stage: "CKE", occurredDate: "2026-07-18" }),
      makeOrder({ id: "b", code: "DHAG-26071", stage: "CKE", occurredDate: "2026-07-20" }),
      makeOrder({ id: "c", code: "DHAG-26072", stage: "CKE", occurredDate: "2026-07-25" })
    ];
    const map = buildDraftStageMovements(orders, "DHAG-26071");
    expect(map.size).toBe(1);
    expect(map.get("CKE")?.id).toBe("b");
  });

  it("buildStageProgress danh dau khau da qua va khau hien tai", () => {
    const movements = selectMovementsForOrder(
      [
        makeOrder({ id: "a", code: "DHAG-26071", stage: "CKE", occurredDate: "2026-07-18", issued: 10, returned: 8 }),
        makeOrder({ id: "b", code: "DHAG-26071", stage: "CDT", occurredDate: "2026-07-20", issued: 5, returned: 5 })
      ],
      "DHAG-26071"
    );

    const progress = buildStageProgress(stageOptions, movements);
    const cke = progress.find((p) => p.code === "CKE")!;
    const cdt = progress.find((p) => p.code === "CDT")!;

    expect(cke.movementCount).toBe(1);
    expect(cke.isCurrent).toBe(false);
    expect(cdt.movementCount).toBe(1);
    expect(cdt.isCurrent).toBe(true);
  });

  it("buildStageProgress: khau chua co giao dich thi movementCount = 0 va khong phai khau hien tai", () => {
    const progress = buildStageProgress(stageOptions, []);
    expect(progress.every((p) => p.movementCount === 0 && !p.isCurrent)).toBe(true);
  });
});

describe("buildLossReportRows", () => {
  it("tinh hao hut quy doi theo tuoi vang va sap xep giam dan theo loss", () => {
    const orders = [
      makeOrder({ id: "a", loss: 1, goldAge: 0.75 }),
      makeOrder({ id: "b", loss: 5, goldAge: 0.61 })
    ];
    const rows = buildLossReportRows(orders);
    expect(rows[0].id).toBe("b");
    expect(rows[0].convertedLoss).toBeCloseTo(5 * 0.61, 4);
    expect(rows[1].convertedLoss).toBeCloseTo(1 * 0.75, 4);
  });
});
