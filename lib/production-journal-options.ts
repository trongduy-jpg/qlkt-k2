export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export const journalDestinations: SelectOption[] = [
  { value: "NKBC", label: "NKBC – Nhật ký bạc/công đoạn" },
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

export const journalStages: SelectOption[] = [
  { value: "CKE", label: "CKE – Cán kéo" },
  { value: "CDT", label: "CDT – Cán dát" },
  { value: "DAN", label: "DAN – Đan dây" },
  { value: "BIEN", label: "BIEN – Biến" },
  { value: "QBI", label: "QBI – Quay bi" },
  { value: "BAO", label: "BAO – Bao dây" },
  { value: "PI", label: "PI – Pi" },
  { value: "DAP", label: "DAP – Đập định hình" },
  { value: "DKB", label: "DKB – Đánh bóng" },
  { value: "GEP", label: "GEP – Ghép dây" },
  { value: "NAU", label: "NAU – Nấu" },
  { value: "SXK", label: "SXK – Sản xuất khóa" },
  { value: "HTH", label: "HTH – Hoàn thiện" }
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

export const sourceMaterialOptions: SelectOption[] = [
  { value: "750Y", label: "750Y – Vàng 18K màu vàng" },
  { value: "750W", label: "750W – Vàng 18K màu trắng" },
  { value: "750R", label: "750R – Vàng 18K màu hồng" },
  { value: "BAC925", label: "BAC925 – Bạc 92.5" },
  { value: "Nau moi", label: "NM – Nấu mới" },
  { value: "Nau quay dau", label: "NQD – Nấu quay đầu" },
  { value: "TP", label: "TP – Thành phẩm nhập lại" }
];

export const materialTypeOptions: SelectOption[] = [
  { value: "NL18K", label: "NL18K – Nguyên liệu vàng 18K" },
  { value: "NL24K", label: "NL24K – Nguyên liệu vàng 24K" },
  { value: "NL23K", label: "NL23K – Nguyên liệu vàng 23K" },
  { value: "NLBAC92.5", label: "NLBAC92.5 – Nguyên liệu bạc 92.5" },
  { value: "NLBAC9999", label: "NLBAC9999 – Bạc 99.99" },
  { value: "BOT18K", label: "BOT18K – Bột vàng 18K" },
  { value: "BOT23K", label: "BOT23K – Bột vàng 23K" },
  { value: "BOT24K", label: "BOT24K – Bột vàng 24K" },
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
  { value: "Hoàn thành", label: "Hoàn thành" }
];
