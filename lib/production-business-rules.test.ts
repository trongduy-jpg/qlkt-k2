import { describe, expect, it } from "vitest";
import {
  buildProductionOrderCode,
  buildUniqueProductionOrderCode,
  formatDisplayDate,
  formatDisplayDateTime,
  getCarryOverLossPeriod,
  getStageLabel,
  getWorkerInventoryRiskStatus,
  isLargeWeightMovement,
  normalizeStageCode,
  shouldForceDirectCharge,
  toMonthCode
} from "./production-business-rules";

describe("buildProductionOrderCode", () => {
  it("sinh ma dau tien cua thang la STT 1", () => {
    expect(buildProductionOrderCode("DHAG", "2026-07-20", [])).toBe("DHAG-26071");
  });

  it("lay STT tiep theo dua tren ma lon nhat da co trong thang", () => {
    expect(buildProductionOrderCode("DHAG", "2026-07-20", ["DHAG-26071"])).toBe("DHAG-26072");
  });

  it("STT hai chu so khi da co 15 lenh trong thang", () => {
    const existing = Array.from({ length: 15 }, (_, i) => `DHAG-2607${i + 1}`);
    expect(buildProductionOrderCode("DHAG", "2026-07-25", existing)).toBe("DHAG-260716");
  });

  it("khong bi anh huong boi ma cua thang khac", () => {
    const existing = ["DHAG-26069", "DHAG-260610"];
    expect(buildProductionOrderCode("DHAG", "2026-07-01", existing)).toBe("DHAG-26071");
  });

  it("buildUniqueProductionOrderCode la alias tuong duong", () => {
    expect(buildUniqueProductionOrderCode("DHAG", "2026-07-20", ["DHAG-26071"])).toBe("DHAG-26072");
  });
});

describe("normalizeStageCode", () => {
  it("nhan dien ten cong doan co dau va khong dau", () => {
    expect(normalizeStageCode("Cán kéo")).toBe("CKE");
    expect(normalizeStageCode("can keo")).toBe("CKE");
    expect(normalizeStageCode("Đánh bóng")).toBe("DKB");
    expect(normalizeStageCode("ghep day")).toBe("GEP");
  });

  it("giu nguyen ma da chuan hoa (khong khop bang ten)", () => {
    expect(normalizeStageCode("CKE")).toBe("CKE");
    expect(normalizeStageCode("XYZ")).toBe("XYZ");
  });
});

describe("getStageLabel", () => {
  it("tra ve ten day du cua ma cong doan hop le", () => {
    expect(getStageLabel("DKB")).toBe("Đánh bóng");
    expect(getStageLabel("CKE")).toBe("Cán kéo");
  });

  it("tra ve chinh ma neu khong nhan dien duoc", () => {
    expect(getStageLabel("ZZZ")).toBe("ZZZ");
  });
});

describe("shouldForceDirectCharge", () => {
  it("chan trang thai Xac dinh o cong doan khong thuoc nhom truc_tiep", () => {
    expect(shouldForceDirectCharge("BAO", "Xác định")).toBe(true);
    expect(shouldForceDirectCharge("DKB", "Xác định")).toBe(true);
  });

  it("cho phep Xac dinh o cong doan Can keo/Dan day/Bien (mac dinh truc_tiep)", () => {
    expect(shouldForceDirectCharge("CKE", "Xác định")).toBe(false);
    expect(shouldForceDirectCharge("DAN", "Xác định")).toBe(false);
    expect(shouldForceDirectCharge("BIEN", "Xác định")).toBe(false);
  });

  it("khong chan cac trang thai khac Xac dinh", () => {
    expect(shouldForceDirectCharge("BAO", "Treo nợ")).toBe(false);
  });

  it("tuan theo stageRules tuy chinh tu DB thay vi mac dinh", () => {
    expect(shouldForceDirectCharge("BAO", "Xác định", { BAO: "truc_tiep" })).toBe(false);
    expect(shouldForceDirectCharge("CKE", "Xác định", { CKE: "binh_thuong" })).toBe(true);
  });
});

describe("isLargeWeightMovement", () => {
  it("bao dong khi xuat/nhap/chuyen vuot 2000g", () => {
    expect(isLargeWeightMovement({ issued: 2500, returned: 0, transferred: 0 })).toBe(true);
    expect(isLargeWeightMovement({ issued: 0, returned: 0, transferred: 2001 })).toBe(true);
  });

  it("khong bao dong khi duoi nguong", () => {
    expect(isLargeWeightMovement({ issued: 1999, returned: 1999, transferred: 0 })).toBe(false);
  });
});

describe("getCarryOverLossPeriod", () => {
  it("giu nguyen thang hien tai khi trang thai da chot/xac dinh/treo no", () => {
    expect(getCarryOverLossPeriod("2026-07-31", "Đã chốt")).toBe("2026-07");
    expect(getCarryOverLossPeriod("2026-07-31", "Xác định")).toBe("2026-07");
    expect(getCarryOverLossPeriod("2026-07-31", "Treo nợ")).toBe("2026-07");
  });

  it("chuyen sang thang sau neu Dang xu ly va tu ngay 28 tro di", () => {
    expect(getCarryOverLossPeriod("2026-07-28", "Đang xử lý")).toBe("2026-08");
    expect(getCarryOverLossPeriod("2026-07-31", "Đang xử lý")).toBe("2026-08");
  });

  it("giu nguyen thang hien tai neu Dang xu ly nhung truoc ngay 28", () => {
    expect(getCarryOverLossPeriod("2026-07-15", "Đang xử lý")).toBe("2026-07");
  });
});

describe("getWorkerInventoryRiskStatus", () => {
  it("an toan khi chenh lech nho hon 5g", () => {
    expect(getWorkerInventoryRiskStatus("CKE", 3)).toBe("An toàn");
    expect(getWorkerInventoryRiskStatus("CKE", -4.9)).toBe("An toàn");
  });

  it("dang kiem soat o cong doan kiem_soat_rui_ro khi vuot 5g", () => {
    expect(getWorkerInventoryRiskStatus("BAO", 10)).toBe("Đang kiểm soát");
    expect(getWorkerInventoryRiskStatus("PI", -10)).toBe("Đang kiểm soát");
  });

  it("rui ro o cong doan binh thuong/truc_tiep khi vuot 5g", () => {
    expect(getWorkerInventoryRiskStatus("CKE", 10)).toBe("Rủi ro");
    expect(getWorkerInventoryRiskStatus("HTH", 10)).toBe("Rủi ro");
  });
});

describe("toMonthCode", () => {
  it("lay 7 ky tu dau (YYYY-MM) cua chuoi ngay ISO", () => {
    expect(toMonthCode("2026-07-20")).toBe("2026-07");
  });
});

describe("formatDisplayDate", () => {
  it("chuyen ISO date sang dd/mm/yy", () => {
    expect(formatDisplayDate("2026-07-20")).toBe("20/07/26");
  });

  it("tra ve chuoi rong voi input rong/null", () => {
    expect(formatDisplayDate("")).toBe("");
    expect(formatDisplayDate(null)).toBe("");
    expect(formatDisplayDate(undefined)).toBe("");
  });
});

describe("formatDisplayDateTime", () => {
  it("dinh dang dd/mm/yy hh:mm:ss", () => {
    const date = new Date(2026, 6, 20, 14, 5, 9);
    expect(formatDisplayDateTime(date)).toBe("20/07/26 14:05:09");
  });
});
