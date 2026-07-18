export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export const journalDestinations: SelectOption[] = [
  { value: "NKBC", label: "NKBC - Nhat ky bac/cong doan" },
  { value: "BKNXT", label: "BKNXT - Bang ke NXT" },
  { value: "KCP", label: "KCP - Kho cap phat" }
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
  { value: "CKE", label: "CKE - Can keo" },
  { value: "CDT", label: "CDT - Can dat" },
  { value: "DAN", label: "DAN - Dan day" },
  { value: "BIEN", label: "BIEN - Bien" },
  { value: "QBI", label: "QBI - Quay bi" },
  { value: "BAO", label: "BAO - Bao day" },
  { value: "PI", label: "PI - Pi" },
  { value: "DAP", label: "DAP - Dap dinh hinh" },
  { value: "DKB", label: "DKB - Danh bong" },
  { value: "GEP", label: "GEP - Ghep day" },
  { value: "NAU", label: "NAU - Nau" },
  { value: "SXK", label: "SXK - San xuat khoa" },
  { value: "HTH", label: "HTH - Hoan thien" }
];

export const journalMovementReasons: SelectOption[] = [
  { value: "Xuat can keo", label: "Xuat can keo" },
  { value: "Nhap sau can keo", label: "Nhap sau can keo" },
  { value: "Xuat dan day", label: "Xuat dan day" },
  { value: "Nhap sau dan day", label: "Nhap sau dan day" },
  { value: "Xuat quay bi", label: "Xuat quay bi" },
  { value: "Nhap sau quay bi", label: "Nhap sau quay bi" },
  { value: "Xuat bao day", label: "Xuat bao day" },
  { value: "Nhap sau bao day", label: "Nhap sau bao day" },
  { value: "Xuat nau moi", label: "Xuat nau moi" },
  { value: "Nhap sau nau moi", label: "Nhap sau nau moi" },
  { value: "Xuat nau lai", label: "Xuat nau lai" },
  { value: "Nhap sau nau lai", label: "Nhap sau nau lai" }
];

export const goldAgeOptions: SelectOption[] = [
  { value: "0.9999", label: "24K / 99.99%" },
  { value: "0.9583", label: "23K / 95.83%" },
  { value: "0.75", label: "18K / 75.00%" },
  { value: "0.61", label: "15K / 61.00%" },
  { value: "0.925", label: "Bac 92.5%" }
];

export const sourceMaterialOptions: SelectOption[] = [
  { value: "750Y", label: "750Y - Vang 18K vang" },
  { value: "750W", label: "750W - Vang 18K trang" },
  { value: "750R", label: "750R - Vang 18K hong" },
  { value: "BAC925", label: "BAC925 - Bac 92.5" },
  { value: "Nau moi", label: "Nau moi" },
  { value: "Nau quay dau", label: "Nau quay dau" },
  { value: "TP", label: "TP - Thanh pham/BTP nhap lai" }
];

export const materialTypeOptions: SelectOption[] = [
  { value: "NL18K", label: "NL18K - Nguyen lieu vang 18K" },
  { value: "NL24K", label: "NL24K - Nguyen lieu vang 24K" },
  { value: "NL23K", label: "NL23K - Nguyen lieu vang 23K" },
  { value: "NLBAC92.5", label: "NLBAC92.5 - Nguyen lieu bac 92.5" },
  { value: "NLBAC9999", label: "NLBAC9999 - Bac 9999" },
  { value: "BOT18K", label: "BOT18K - Bot vang 18K" },
  { value: "BOT23K", label: "BOT23K - Bot vang 23K" },
  { value: "BOT24K", label: "BOT24K - Bot vang 24K" },
  { value: "PK18K", label: "PK18K - Phu kien 18K" },
  { value: "BTPDAY18K", label: "BTPDAY18K - BTP day 18K" },
  { value: "BTPDAYBAC92.5", label: "BTPDAYBAC92.5 - BTP day bac" }
];

export const materialMetalOptions: SelectOption[] = [
  { value: "AU", label: "AU - Vang" },
  { value: "AG", label: "AG - Bac" },
  { value: "PT", label: "PT - Platinum" }
];

export const sourceOptions: SelectOption[] = [
  { value: "CD", label: "CD - Cong doan" },
  { value: "VN", label: "VN - Nguon Viet Nam" },
  { value: "PHAN_KIM", label: "Phan kim" },
  { value: "US", label: "Nhap tu US" },
  { value: "PL", label: "PL - Phan loai/phieu le" },
  { value: "KCP", label: "KCP - Kho cap phat" }
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
