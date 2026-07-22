export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export const journalDestinations: SelectOption[] = [
  { value: "NKBC", label: "NKBC – NK Bạc/CĐ" },
  { value: "BKNXT", label: "BKNXT – Bảng kê NXT" },
  { value: "KCP", label: "KCP – Kho cấp phát" }
];

export const productionOrderDestinations: SelectOption[] = [
  { value: "CH1", label: "CH1" },
  { value: "CH2", label: "CH2" },
  { value: "CH3", label: "CH3" },
  { value: "ADM2", label: "ADM2" },
  { value: "PKD Si", label: "PKD Si" },
  { value: "PSX L2", label: "PSX L2" }
];

export const productionOrderMaterialSpecOptions: SelectOption[] = [
  { value: "18KY", label: "18KY" },
  { value: "18KW", label: "18KW" },
  { value: "18KR", label: "18KR" },
  { value: "18K3M", label: "18K3M" },
  { value: "18KW/KY", label: "18KW/KY" },
  { value: "18KW/KR", label: "18KW/KR" },
  { value: "18KW/KY/KR", label: "18KW/KY/KR" },
  { value: "18KY/KR", label: "18KY/KR" },
  { value: "14KY", label: "14KY" },
  { value: "14KW", label: "14KW" },
  { value: "14KR", label: "14KR" },
  { value: "14KW/KY", label: "14KW/KY" },
  { value: "10KY", label: "10KY" },
  { value: "10KW", label: "10KW" },
  { value: "24K", label: "24K" },
  { value: "22K", label: "22K" },
  { value: "24K/18KY", label: "24K/18KY" },
  { value: "22K/18KY", label: "22K/18KY" },
  { value: "PT950", label: "PT950" },
  { value: "PT900", label: "PT900" },
  { value: "PT950-18K", label: "PT950-18K" },
  { value: "PT/18KW", label: "PT/18KW" },
  { value: "PT/18KY", label: "PT/18KY" },
  { value: "24K/PT", label: "24K/PT" },
  { value: "BAC", label: "BAC" },
  { value: "BAC925", label: "BAC925" }
];

export const productionOrderDeliveryStatusOptions: SelectOption[] = [
  { value: "Chưa Hoàn Tất", label: "Chưa hoàn tất" },
  { value: "Hoàn tất", label: "Hoàn tất" },
  { value: "Chưa giao đủ", label: "Chưa giao đủ" },
  { value: "Ngưng Sản Xuất", label: "Ngưng sản xuất" }
];

export const productionOrderSalesTypeOptions: SelectOption[] = [
  { value: "SR", label: "SR" },
  { value: "KH", label: "KH" }
];

// 12 cong doan chinh dung de cap nhat trong Nhat ky NVL. Cac ma khac
// (KHO, XMA, HAN...) van ton tai o danh muc tho vi chung la cong doan
// con cua 12 khau nay, nhung khong hien thi thanh tab rieng o NK NVL.
export const mainJournalStageCodes = [
  "NAU", "CKE", "DAN", "KBI", "QBI", "DAP",
  "NEN", "DKB", "BAO", "GEP", "BAS", "SXK"
];

export const journalStages: SelectOption[] = [
  { value: "NAU", label: "NAU – Nấu nguyên liệu" },
  { value: "CKE", label: "CKE – Cán chỉ/cán dát" },
  { value: "DAN", label: "DAN – Đan dây" },
  { value: "KBI", label: "KBI – Khắc bi" },
  { value: "QBI", label: "QBI – Quay bóng" },
  { value: "DAP", label: "DAP – Dập định hình" },
  { value: "NEN", label: "NEN – Nén khít" },
  { value: "DKB", label: "DKB – Ra dây" },
  { value: "BAO", label: "BAO – Bào dây" },
  { value: "GEP", label: "GEP – Ghép dây" },
  { value: "BAS", label: "BAS – Dập bass, bông khoen" },
  { value: "SXK", label: "SXK – Sản xuất khóa" },
  { value: "KHO", label: "KHO – Kho cấp phát" },
  { value: "GSK", label: "GSK" },
  { value: "CDA", label: "CDA – Cắt ra dây" },
  { value: "DLL", label: "DLL – Dập lưỡi lam" },
  { value: "KDA", label: "KDA – Khắc dấu" },
  { value: "HAN", label: "HAN – Hàn băng tải" },
  { value: "TV", label: "TV – Tư vấn" },
  { value: "CVB", label: "CVB – Cắt/vo bi" },
  { value: "XMA", label: "XMA – Xi mạ" },
  { value: "NAUPK", label: "NAUPK – Nấu phân kim" },
  { value: "KCH", label: "KCH – Kéo chi" },
  { value: "CCD", label: "CCD – Cán/cắt dát" },
  { value: "HCO", label: "HCO – Hàn cuốn ống" },
  { value: "DBI", label: "DBI – Dập trái châu" },
  { value: "HBK", label: "HBK – Hàn khóa bass" },
  { value: "HUY", label: "HUY – Hủy sản phẩm" },
  { value: "HBT", label: "HBT – Hàn băng tải" },
  { value: "BHH", label: "BHH – Bảo hành sản phẩm" },
  { value: "NPK", label: "NPK – Nấu phân kim" }
];

export const journalMovementReasons: SelectOption[] = [
  { value: "Xuat can keo", label: "Xuất cán kéo" },
  { value: "Nhap sau can keo", label: "Nhập sau cán kéo" },
  { value: "Xuat dan day", label: "Xuất đan dây" },
  { value: "Nhap sau dan day", label: "Nhập sau đan dây" },
  { value: "Xuat quay bi", label: "Xuất quay bi" },
  { value: "Nhap sau quay bi", label: "Nhập sau quay bi" },
  { value: "Xuat bao day", label: "Xuất bao dây" },
  { value: "Nhap sau bao day", label: "Nhập sau bao dây" },
  { value: "Xuat nau moi", label: "Xuất nấu mới" },
  { value: "Nhap sau nau moi", label: "Nhập sau nấu mới" },
  { value: "Xuat nau lai", label: "Xuất nấu lại" },
  { value: "Nhap sau nau lai", label: "Nhập sau nấu lại" }
];

export const goldAgeOptions: SelectOption[] = [
  { value: "0.9999", label: "24K / 99.99%" },
  { value: "0.9583", label: "23K / 95.83%" },
  { value: "0.75", label: "18K / 75.00%" },
  { value: "0.61", label: "15K / 61.00%" },
  { value: "0.925", label: "Bạc 92.5%" }
];

// Danh sach day du ma nhom NXT theo thuc te (fallback khi bang
// reference_options chua co du lieu). Cau truc ma = {Loai hinh}{Kim loai/tuoi}:
// NL = Nguyen lieu, BOT = Bot, VAYHAN = Vay han, PK = Phe khac,
// BTPBI = BTP bi, BTPDAY = BTP day, TP = Thanh pham.
export const sourceMaterialOptions: SelectOption[] = [
  // Vang
  { value: "NL24K", label: "NL24K – Nguyên liệu Vàng 24K" },
  { value: "NL23K", label: "NL23K – Nguyên liệu Vàng 23K" },
  { value: "NL99", label: "NL99 – Nguyên liệu Vàng 99" },
  { value: "NL999", label: "NL999 – Nguyên liệu Vàng 999" },
  { value: "NL18K", label: "NL18K – Nguyên liệu Vàng 18K" },
  { value: "NL17K", label: "NL17K – Nguyên liệu Vàng 17K" },
  { value: "NL16K", label: "NL16K – Nguyên liệu Vàng 16K" },
  { value: "NL15K", label: "NL15K – Nguyên liệu Vàng 15K" },
  { value: "NL10K", label: "NL10K – Nguyên liệu Vàng 10K" },
  { value: "BOT18K", label: "BOT18K – Bột Vàng 18K" },
  { value: "BOT16K", label: "BOT16K – Bột Vàng 16K" },
  { value: "BOT15K", label: "BOT15K – Bột Vàng 15K" },
  { value: "BOT24K", label: "BOT24K – Bột Vàng 24K" },
  { value: "BOT23K", label: "BOT23K – Bột Vàng 23K" },
  { value: "BOT10K", label: "BOT10K – Bột Vàng 10K" },
  { value: "BOT17K", label: "BOT17K – Bột Vàng 17K" },
  { value: "VAYHAN18K", label: "VAYHAN18K – Vảy hàn Vàng 18K" },
  { value: "VAYHAN16K", label: "VAYHAN16K – Vảy hàn Vàng 16K" },
  { value: "VAYHAN15K", label: "VAYHAN15K – Vảy hàn Vàng 15K" },
  { value: "PK18K", label: "PK18K – Phế khác Vàng 18K" },
  { value: "PK16K", label: "PK16K – Phế khác Vàng 16K" },
  { value: "PK15K", label: "PK15K – Phế khác Vàng 15K" },
  { value: "PK24K", label: "PK24K – Phế khác Vàng 24K" },
  { value: "PK10K", label: "PK10K – Phế khác Vàng 10K" },
  { value: "BTPBI18K", label: "BTPBI18K – BTP bi Vàng 18K" },
  { value: "BTPDAY18K", label: "BTPDAY18K – BTP dây Vàng 18K" },
  { value: "BTPDAY17K", label: "BTPDAY17K – BTP dây Vàng 17K" },
  { value: "BTPBI16K", label: "BTPBI16K – BTP bi Vàng 16K" },
  { value: "BTPDAY16K", label: "BTPDAY16K – BTP dây Vàng 16K" },
  { value: "BTPBI15K", label: "BTPBI15K – BTP bi Vàng 15K" },
  { value: "BTPDAY15K", label: "BTPDAY15K – BTP dây Vàng 15K" },
  { value: "BTPDAY24K", label: "BTPDAY24K – BTP dây Vàng 24K" },
  { value: "BTPDAY23K", label: "BTPDAY23K – BTP dây Vàng 23K" },
  { value: "BTPDAY10K", label: "BTPDAY10K – BTP dây Vàng 10K" },
  { value: "BTPBI10K", label: "BTPBI10K – BTP bi Vàng 10K" },
  { value: "TP18K", label: "TP18K – Thành phẩm Vàng 18K" },
  { value: "TP16K", label: "TP16K – Thành phẩm Vàng 16K" },
  { value: "TP15K", label: "TP15K – Thành phẩm Vàng 15K" },
  { value: "TP24K", label: "TP24K – Thành phẩm Vàng 24K" },
  { value: "TP17K", label: "TP17K – Thành phẩm Vàng 17K" },
  { value: "TP10K", label: "TP10K – Thành phẩm Vàng 10K" },
  // Bac
  { value: "BACNTO", label: "BACNTO – Bạc NTO" },
  { value: "NLBAC9999", label: "NLBAC9999 – Nguyên liệu Bạc 9999" },
  { value: "NLBAC999", label: "NLBAC999 – Nguyên liệu Bạc 999" },
  { value: "NLBAC950", label: "NLBAC950 – Nguyên liệu Bạc 950" },
  { value: "NLBAC92.5", label: "NLBAC92.5 – Nguyên liệu Bạc 92.5" },
  { value: "BOTBAC92.5", label: "BOTBAC92.5 – Bột Bạc 92.5" },
  { value: "VAYHANBAC92.5", label: "VAYHANBAC92.5 – Vảy hàn Bạc 92.5" },
  { value: "BTPBIBAC92.5", label: "BTPBIBAC92.5 – BTP bi Bạc 92.5" },
  { value: "BTPDAYBAC92.5", label: "BTPDAYBAC92.5 – BTP dây Bạc 92.5" },
  { value: "PKBAC92.5", label: "PKBAC92.5 – Phế khác Bạc 92.5" },
  { value: "TPBAC92.5", label: "TPBAC92.5 – Thành phẩm Bạc 92.5" },
  // Bach kim (PT)
  { value: "NLPT900", label: "NLPT900 – Nguyên liệu PT 900" },
  { value: "NLPT950", label: "NLPT950 – Nguyên liệu PT 950" },
  { value: "NLPT999", label: "NLPT999 – Nguyên liệu PT 999" },
  { value: "NLPT9999", label: "NLPT9999 – Nguyên liệu PT 9999" },
  { value: "NLPT99", label: "NLPT99 – Nguyên liệu PT 99" },
  { value: "NLPT900-PD", label: "NLPT900-PD – Nguyên liệu PT 900-PD" },
  { value: "NLPT950-PD", label: "NLPT950-PD – Nguyên liệu PT 950-PD" },
  { value: "NLPTPK", label: "NLPTPK – Nguyên liệu PT phế khác" },
  { value: "BOTPT900-PD", label: "BOTPT900-PD – Bột PT 900-PD" },
  { value: "BOTPT900", label: "BOTPT900 – Bột PT 900" },
  { value: "PKPT900", label: "PKPT900 – Phế khác PT 900" },
  { value: "PKPT900-PD", label: "PKPT900-PD – Phế khác PT 900-PD" },
  { value: "PKPT950-PD", label: "PKPT950-PD – Phế khác PT 950-PD" },
  { value: "PKPT950", label: "PKPT950 – Phế khác PT 950" },
  { value: "BTPDAYPT900", label: "BTPDAYPT900 – BTP dây PT 900" },
  { value: "BTPDAYPT900-PD", label: "BTPDAYPT900-PD – BTP dây PT 900-PD" },
  { value: "BTPDAYPT950-PD", label: "BTPDAYPT950-PD – BTP dây PT 950-PD" },
  { value: "BTPDAYPT950", label: "BTPDAYPT950 – BTP dây PT 950" },
  { value: "TPPT900", label: "TPPT900 – Thành phẩm PT 900" },
  { value: "TPPT900-PD", label: "TPPT900-PD – Thành phẩm PT 900-PD" },
  { value: "TPPT950-PD", label: "TPPT950-PD – Thành phẩm PT 950-PD" },
  { value: "TPPT970-PD", label: "TPPT970-PD – Thành phẩm PT 970-PD" }
];

// Nhom cac ma nhom NXT theo tien to loai hinh (Nguyen lieu/Bot/Vay han/
// Phe khac/BTP bi/BTP day/Thanh pham) de hien thi dropdown co optgroup
// thay vi 1 danh sach phang ~90 dong.
const NXT_GROUP_PREFIXES: Array<{ prefix: string; label: string }> = [
  { prefix: "BTPBI", label: "BTP bi" },
  { prefix: "BTPDAY", label: "BTP dây" },
  { prefix: "VAYHAN", label: "Vảy hàn" },
  { prefix: "BOT", label: "Bột" },
  { prefix: "PK", label: "Phế khác" },
  { prefix: "NL", label: "Nguyên liệu" },
  { prefix: "TP", label: "Thành phẩm" }
];

export function groupNxtLinkOptions(options: SelectOption[]): Array<{ label: string; options: SelectOption[] }> {
  const order: string[] = [];
  const groups = new Map<string, SelectOption[]>();

  for (const option of options) {
    const match = NXT_GROUP_PREFIXES.find((item) => option.value.toUpperCase().startsWith(item.prefix));
    const groupLabel = match?.label ?? "Khác";
    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, []);
      order.push(groupLabel);
    }
    groups.get(groupLabel)!.push(option);
  }

  return order.map((label) => ({ label, options: groups.get(label)! }));
}

export const materialTypeOptions: SelectOption[] = [
  { value: "NL18K", label: "NL18K – Vàng 18K" },
  { value: "NL24K", label: "NL24K – Vàng 24K" },
  { value: "NL23K", label: "NL23K – Vàng 23K" },
  { value: "NLBAC92.5", label: "NLBAC92.5 – Bạc 92.5" },
  { value: "NLBAC9999", label: "NLBAC9999 – Bạc 99.99" },
  { value: "BOT18K", label: "BOT18K – Bột 18K" },
  { value: "BOT23K", label: "BOT23K – Bột 23K" },
  { value: "BOT24K", label: "BOT24K – Bột 24K" },
  { value: "PK18K", label: "PK18K – Phụ kiện 18K" },
  { value: "BTPDAY18K", label: "BTPDAY18K – BTP dây 18K" },
  { value: "BTPDAYBAC92.5", label: "BTPDAYBAC92.5 – BTP dây bạc" }
];

export const materialMetalOptions: SelectOption[] = [
  { value: "AU", label: "AU – Vàng" },
  { value: "AG", label: "AG – Bạc" },
  { value: "PT", label: "PT – Platinum" }
];

export const sourceOptions: SelectOption[] = [
  { value: "CD", label: "CD – Công đoạn" },
  { value: "VN", label: "VN – Nguồn Việt Nam" },
  { value: "PHAN_KIM", label: "Phân kim" },
  { value: "US", label: "Nhập từ US" },
  { value: "PL", label: "PL – Phân loại/phiếu lẻ" },
  { value: "KCP", label: "KCP – Kho cấp phát" }
];

export const movementLossStatusOptions: SelectOption[] = [
  { value: "Treo nợ", label: "Treo nợ" },
  { value: "Xác định", label: "Xác định" }
];

export const movementGoldAgeOptions: SelectOption[] = [
  { value: "0.9999", label: "24K" },
  { value: "0.75", label: "18K" },
  { value: "0.6667", label: "16K" },
  { value: "0.7083", label: "17K" },
  { value: "0.625", label: "15K" },
  { value: "0.4167", label: "10K" },
  { value: "0.9", label: "PT" },
  { value: "0.925", label: "BAC" }
];

// Ghi chu: cac ma US/VN/KS/PK/L2/CD/BH/KT/BK la ma nghiep vu noi bo,
// chua co dien giai chinh thuc - giu nguyen cho den khi xac nhan y nghia
// tu nguoi dung de tranh chu thich sai.
export const movementImportSourceOptions: SelectOption[] = [
  { value: "US", label: "US" },
  { value: "VN", label: "VN" },
  { value: "KS", label: "KS" },
  { value: "PK", label: "PK" },
  { value: "L2", label: "L2" },
  { value: "CĐ", label: "CĐ" },
  { value: "BH", label: "BH" }
];

export const movementExportSourceOptions: SelectOption[] = [
  { value: "KT", label: "KT" },
  { value: "L2", label: "L2" },
  { value: "BK", label: "BK" },
  { value: "CD", label: "CD" },
  { value: "BH", label: "BH" }
];

export const movementStageStatusOptions: SelectOption[] = [
  { value: "Đang thực hiện", label: "Đang thực hiện" },
  { value: "Hoàn thành", label: "Hoàn thành" },
  { value: "Bỏ qua", label: "Bỏ qua" }
];
