import { describe, expect, it } from "vitest";
import { LOSS_STATUSES, type LossStatus } from "@/lib/domain/production";
import { isClosedStatus, statusClass, statusOptions } from "@/lib/production-helpers";
import { fromDbStatus, toDbStatus } from "@/lib/supabase-mappers";

describe("LOSS_STATUSES", () => {
  it("chua dung 4 gia tri trang thai tinh hao, dung thu tu", () => {
    expect(LOSS_STATUSES).toEqual(["Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"]);
  });

  it("khong co gia tri nao ngoai 4 gia tri tren", () => {
    expect(LOSS_STATUSES).toHaveLength(4);
  });
});

describe("statusOptions", () => {
  it("suy ra tu LOSS_STATUSES voi sentinel Tat ca dung dau, giu nguyen thu tu", () => {
    expect(statusOptions).toEqual(["Tất cả", "Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"]);
  });

  it("chi them dung 1 sentinel so voi LOSS_STATUSES", () => {
    expect(statusOptions).toHaveLength(LOSS_STATUSES.length + 1);
  });
});

describe("statusClass", () => {
  it("co class cho ca 4 trang thai", () => {
    LOSS_STATUSES.forEach((status) => {
      expect(statusClass[status]).toBeTruthy();
    });
  });
});

describe("isClosedStatus", () => {
  it("chi Da chot duoc coi la da dong", () => {
    expect(isClosedStatus("Đã chốt")).toBe(true);
    expect(isClosedStatus("Đang xử lý")).toBe(false);
    expect(isClosedStatus("Treo nợ")).toBe(false);
    expect(isClosedStatus("Xác định")).toBe(false);
  });
});

describe("toDbStatus / fromDbStatus", () => {
  it("map dung 4 gia tri sang ma snake_case cua DB", () => {
    expect(toDbStatus("Đang xử lý")).toBe("dang_xu_ly");
    expect(toDbStatus("Treo nợ")).toBe("treo_no");
    expect(toDbStatus("Xác định")).toBe("xac_dinh");
    expect(toDbStatus("Đã chốt")).toBe("da_chot");
  });

  it("round-trip khong lam mat gia tri voi ca 4 trang thai", () => {
    LOSS_STATUSES.forEach((status) => {
      expect(fromDbStatus(toDbStatus(status))).toBe(status);
    });
  });

  it("gia tri DB khong xac dinh fallback ve Dang xu ly", () => {
    expect(fromDbStatus("khong_biet")).toBe("Đang xử lý");
    expect(fromDbStatus("")).toBe("Đang xử lý");
  });

  it("gia tri gui di khong hop le fallback ve dang_xu_ly", () => {
    // Cast CO Y va chi dung trong test: fallback nay chi cham duoc luc runtime
    // (gia tri di qua cac assertion o bien UI), TypeScript coi nhu khong xay ra.
    // Test nay ghim lai hanh vi fallback de khong bi xoa nham khi refactor.
    const invalidStatus = "khong hop le" as LossStatus;
    expect(toDbStatus(invalidStatus)).toBe("dang_xu_ly");
  });
});
