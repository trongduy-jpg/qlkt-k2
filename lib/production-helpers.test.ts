import { describe, expect, it } from "vitest";
import type { ProductionOrder } from "@/lib/domain/production";
import { createEmptyOrder } from "@/lib/production-mappers";
import { validateMovementDraft } from "./production-helpers";

function makeValidDraft(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    id: "",
    code: "DHAG-26071",
    sku: "BC925",
    material: "Vàng 18K",
    worker: "An",
    stage: "CKE",
    stageStatus: "Đang thực hiện",
    destination: "KCP",
    occurredDate: "2026-07-20",
    issued: 10,
    returned: 8,
    powder: 0,
    transferred: 1,
    goldAge: 0.75,
    loss: 1,
    status: "Xác định",
    ...overrides
  };
}

const NUMERIC_FIELD_LABELS: Record<"issued" | "returned" | "transferred" | "goldAge", string> = {
  issued: "Xuất",
  returned: "Nhập",
  transferred: "Chuyển",
  goldAge: "Tuổi vàng"
};

describe("validateMovementDraft — numeric field validation", () => {
  (Object.keys(NUMERIC_FIELD_LABELS) as Array<keyof typeof NUMERIC_FIELD_LABELS>).forEach((field) => {
    const label = NUMERIC_FIELD_LABELS[field];

    it(`chan NaN cho truong ${field}`, () => {
      const draft = makeValidDraft({ [field]: NaN });
      expect(validateMovementDraft(draft)).toContain(label);
    });

    it(`chan Infinity cho truong ${field}`, () => {
      const draft = makeValidDraft({ [field]: Infinity });
      expect(validateMovementDraft(draft)).toContain(label);
    });

    it(`chan -Infinity cho truong ${field}`, () => {
      const draft = makeValidDraft({ [field]: -Infinity });
      expect(validateMovementDraft(draft)).toContain(label);
    });

    it(`chan gia tri am cho truong ${field}`, () => {
      const draft = makeValidDraft({ [field]: -1 });
      expect(validateMovementDraft(draft)).toContain(label);
    });

    it(`khong chan gia tri 0 cho truong ${field} - van luu duoc binh thuong (hoi quy)`, () => {
      const draft = makeValidDraft({ [field]: 0 });
      expect(validateMovementDraft(draft)).not.toContain(label);
    });
  });

  it("khong chan transferred = undefined (truong tuy chon, hoi quy)", () => {
    const draft = makeValidDraft({ transferred: undefined });
    expect(validateMovementDraft(draft)).not.toContain(NUMERIC_FIELD_LABELS.transferred);
  });

  it("khong chan goldAge = undefined (truong tuy chon, hoi quy)", () => {
    const draft = makeValidDraft({ goldAge: undefined });
    expect(validateMovementDraft(draft)).not.toContain(NUMERIC_FIELD_LABELS.goldAge);
  });

  it("khong chan returned > issued - khong them rang buoc so sanh nao (hoi quy)", () => {
    const draft = makeValidDraft({ issued: 5, returned: 10 });
    const missing = validateMovementDraft(draft);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.issued);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.returned);
  });

  it("khong them loi so hoc moi cho draft mac dinh cua createEmptyOrder() (Treo nợ, hoi quy)", () => {
    const draft = createEmptyOrder();
    const missing = validateMovementDraft(draft);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.issued);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.returned);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.transferred);
    expect(missing).not.toContain(NUMERIC_FIELD_LABELS.goldAge);
  });
});

describe("validateMovementDraft — existing required-field checks (hoi quy)", () => {
  it("bao thieu du 8 truong bat buoc khi draft rong", () => {
    const missing = validateMovementDraft(createEmptyOrder());
    expect(missing).toEqual(expect.arrayContaining(["Mã hàng", "Công đoạn", "Thợ phụ trách"]));
  });

  it("khong bao loi nao voi draft hop le day du", () => {
    expect(validateMovementDraft(makeValidDraft())).toEqual([]);
  });
});
