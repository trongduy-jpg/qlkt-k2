import type { MaterialMaster, ReferenceOption, StageMaster, WorkerMaster } from "@/lib/material-service";
import type { AppUser } from "@/lib/auth-service";

// Factory tao draft rong cho cac man CRUD danh muc (Cau hinh).
// Tach ra khoi material-dashboard.tsx de tai su dung va giam do dai file.

export function createEmptyMaterialDraft(): Omit<MaterialMaster, "id"> {
  return {
    code: "",
    name: "",
    category: "gold",
    purity: 0.75,
    unit: "gram"
  };
}

export function createEmptyWorkerDraft(): Omit<WorkerMaster, "id"> {
  return {
    worker_code: "",
    full_name: "",
    department: "San xuat",
    stage: "CKE"
  };
}

export function createEmptyStageDraft(): Omit<StageMaster, "id"> {
  return {
    stage_code: "",
    stage_name: "",
    hao_hut_rule: "binh_thuong"
  };
}

export const referenceListKeys: Array<{ key: string; label: string }> = [
  { key: "nk_nvl_noi_nhan", label: "Nơi nhận (Nhật ký NVL)" },
  { key: "lsx_noi_nhan", label: "Nơi nhận (Lệnh sản xuất)" },
  { key: "loai_nguyen_lieu", label: "Loại nguyên liệu" },
  { key: "tuoi_vang", label: "Tuổi vàng" },
  { key: "nguon_nvl", label: "Nguồn NVL / Mã nối NXT" },
  { key: "nguon_nhap", label: "Nguồn nhập" },
  { key: "nguon_xuat", label: "Nguồn xuất" }
];

export function createEmptyReferenceDraft(listKey: string): Omit<ReferenceOption, "id"> {
  return {
    list_key: listKey,
    option_code: "",
    option_label: "",
    sort_order: 0
  };
}

export function createEmptyAppUserDraft(): Omit<AppUser, "id"> {
  return {
    email: "",
    full_name: "",
    role: "nhan_vien"
  };
}
