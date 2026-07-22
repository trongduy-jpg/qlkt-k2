"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { MaterialMaster, ReferenceOption, StageMaster, WorkerMaster } from "@/lib/material-service";
import type { AppUser } from "@/lib/auth-service";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createStage,
  updateStage,
  deleteStage,
  createReferenceOption,
  updateReferenceOption,
  deleteReferenceOption,
  createWorker,
  updateWorker,
  deleteWorker
} from "@/lib/material-service";
import { createAppUser, updateAppUser, deleteAppUser } from "@/lib/auth-service";
import { createAuditLog } from "@/lib/audit-log-service";
import {
  createEmptyMaterialDraft,
  createEmptyWorkerDraft,
  createEmptyStageDraft,
  createEmptyReferenceDraft,
  createEmptyAppUserDraft,
  referenceListKeys
} from "@/lib/master-data-drafts";

// Toan bo state + handler CRUD cho man "Danh muc nen" (Cau hinh) duoc gom
// vao 1 hook rieng, tach khoi MaterialDashboard de component chinh gon hon.
// Cac list du lieu (materials/workers/...) van do MaterialDashboard so huu
// (dung o nhieu noi khac), hook nay chi nhan setter de cap nhat sau khi luu.

export type MasterDataCrudDeps = {
  setMaterials: Dispatch<SetStateAction<MaterialMaster[]>>;
  setWorkers: Dispatch<SetStateAction<WorkerMaster[]>>;
  setStages: Dispatch<SetStateAction<StageMaster[]>>;
  setReferenceOptions: Dispatch<SetStateAction<ReferenceOption[]>>;
  setAppUsers: Dispatch<SetStateAction<AppUser[]>>;
  currentUserId?: string;
  pushAudit: (action: string, detail: string) => void;
  setRemoteError: (message: string | null) => void;
};

export function useMasterDataCrud(deps: MasterDataCrudDeps) {
  const { setMaterials, setWorkers, setStages, setReferenceOptions, setAppUsers, currentUserId, pushAudit, setRemoteError } =
    deps;

  const [materialDraft, setMaterialDraft] = useState<Omit<MaterialMaster, "id">>(createEmptyMaterialDraft());
  const [workerDraft, setWorkerDraft] = useState<Omit<WorkerMaster, "id">>(createEmptyWorkerDraft());
  const [stageDraft, setStageDraft] = useState<Omit<StageMaster, "id">>(createEmptyStageDraft());
  const [referenceListKey, setReferenceListKey] = useState<string>(referenceListKeys[0].key);
  const [referenceDraft, setReferenceDraft] = useState<Omit<ReferenceOption, "id">>(
    createEmptyReferenceDraft(referenceListKeys[0].key)
  );
  const [appUserDraft, setAppUserDraft] = useState<Omit<AppUser, "id">>(createEmptyAppUserDraft());

  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
  const [editingAppUserId, setEditingAppUserId] = useState<string | null>(null);

  async function addMaterial() {
    if (!materialDraft.code.trim() || !materialDraft.name.trim()) return;

    const normalizedMaterial = {
      ...materialDraft,
      code: materialDraft.code.trim().toUpperCase(),
      name: materialDraft.name.trim(),
      category: materialDraft.category.trim() || "gold",
      unit: materialDraft.unit.trim() || "gram",
      purity: Number(materialDraft.purity)
    };

    try {
      if (editingMaterialId) {
        const savedMaterial = await updateMaterial(editingMaterialId, normalizedMaterial);
        setMaterials((current) =>
          current.map((item) => (item.id === editingMaterialId ? savedMaterial : item)).sort((a, b) => a.code.localeCompare(b.code))
        );
        setEditingMaterialId(null);
        setMaterialDraft(createEmptyMaterialDraft());
        pushAudit("update_material", `Cập nhật NVL ${savedMaterial.code} - ${savedMaterial.name}`);
        await createAuditLog("update_material", `Cập nhật NVL ${savedMaterial.code} - ${savedMaterial.name}`, savedMaterial.id);
      } else {
        const savedMaterial = await createMaterial(normalizedMaterial);
        setMaterials((current) => [...current, savedMaterial].sort((a, b) => a.code.localeCompare(b.code)));
        setMaterialDraft(createEmptyMaterialDraft());
        pushAudit("create_material", `Thêm NVL ${savedMaterial.code} - ${savedMaterial.name}`);
        await createAuditLog("create_material", `Thêm NVL ${savedMaterial.code} - ${savedMaterial.name}`, savedMaterial.id);
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không lưu được NVL");
    }
  }

  function startEditMaterial(material: MaterialMaster) {
    setEditingMaterialId(material.id);
    setMaterialDraft({
      code: material.code,
      name: material.name,
      category: material.category,
      purity: material.purity,
      unit: material.unit
    });
  }

  function cancelEditMaterial() {
    setEditingMaterialId(null);
    setMaterialDraft(createEmptyMaterialDraft());
  }

  async function removeMaterial(id: string) {
    try {
      await deleteMaterial(id);
      setMaterials((current) => current.filter((item) => item.id !== id));
      if (editingMaterialId === id) cancelEditMaterial();
      pushAudit("delete_material", `Xóa NVL ${id}`);
      await createAuditLog("delete_material", `Xóa NVL ${id}`, id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được NVL (có thể đang được dùng trong giao dịch NVL)");
    }
  }

  async function addStage() {
    if (!stageDraft.stage_code.trim() || !stageDraft.stage_name.trim()) return;

    const normalizedStage = {
      ...stageDraft,
      stage_code: stageDraft.stage_code.trim().toUpperCase(),
      stage_name: stageDraft.stage_name.trim()
    };

    try {
      if (editingStageId) {
        const savedStage = await updateStage(editingStageId, normalizedStage);
        setStages((current) =>
          current.map((item) => (item.id === editingStageId ? savedStage : item)).sort((a, b) => a.stage_code.localeCompare(b.stage_code))
        );
        setEditingStageId(null);
        setStageDraft(createEmptyStageDraft());
        pushAudit("update_stage", `Cập nhật công đoạn ${savedStage.stage_code} - ${savedStage.stage_name}`);
        await createAuditLog("update_stage", `Cập nhật công đoạn ${savedStage.stage_code} - ${savedStage.stage_name}`, savedStage.id);
      } else {
        const savedStage = await createStage(normalizedStage);
        setStages((current) => [...current, savedStage].sort((a, b) => a.stage_code.localeCompare(b.stage_code)));
        setStageDraft(createEmptyStageDraft());
        pushAudit("create_stage", `Thêm công đoạn ${savedStage.stage_code} - ${savedStage.stage_name}`);
        await createAuditLog("create_stage", `Thêm công đoạn ${savedStage.stage_code} - ${savedStage.stage_name}`, savedStage.id);
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không lưu được công đoạn");
    }
  }

  function startEditStage(stage: StageMaster) {
    setEditingStageId(stage.id);
    setStageDraft({
      stage_code: stage.stage_code,
      stage_name: stage.stage_name,
      hao_hut_rule: stage.hao_hut_rule
    });
  }

  function cancelEditStage() {
    setEditingStageId(null);
    setStageDraft(createEmptyStageDraft());
  }

  async function removeStage(id: string) {
    try {
      await deleteStage(id);
      setStages((current) => current.filter((item) => item.id !== id));
      if (editingStageId === id) cancelEditStage();
      pushAudit("delete_stage", `Xóa công đoạn ${id}`);
      await createAuditLog("delete_stage", `Xóa công đoạn ${id}`, id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được công đoạn");
    }
  }

  async function addReferenceOption() {
    if (!referenceDraft.option_code.trim() || !referenceDraft.option_label.trim()) return;

    const normalizedOption = {
      ...referenceDraft,
      list_key: referenceListKey,
      option_code: referenceDraft.option_code.trim(),
      option_label: referenceDraft.option_label.trim()
    };

    try {
      if (editingReferenceId) {
        const saved = await updateReferenceOption(editingReferenceId, normalizedOption);
        setReferenceOptions((current) => current.map((item) => (item.id === editingReferenceId ? saved : item)));
        setEditingReferenceId(null);
        setReferenceDraft(createEmptyReferenceDraft(referenceListKey));
        pushAudit("update_reference_option", `Cập nhật lựa chọn ${saved.option_code} - ${saved.option_label}`);
        await createAuditLog("update_reference_option", `Cập nhật lựa chọn ${saved.option_code} - ${saved.option_label}`, saved.id);
      } else {
        const saved = await createReferenceOption(normalizedOption);
        setReferenceOptions((current) => [...current, saved]);
        setReferenceDraft(createEmptyReferenceDraft(referenceListKey));
        pushAudit("create_reference_option", `Thêm lựa chọn ${saved.option_code} - ${saved.option_label}`);
        await createAuditLog("create_reference_option", `Thêm lựa chọn ${saved.option_code} - ${saved.option_label}`, saved.id);
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không lưu được lựa chọn");
    }
  }

  function startEditReferenceOption(option: ReferenceOption) {
    setEditingReferenceId(option.id);
    setReferenceDraft({
      list_key: option.list_key,
      option_code: option.option_code,
      option_label: option.option_label,
      sort_order: option.sort_order
    });
  }

  function cancelEditReferenceOption() {
    setEditingReferenceId(null);
    setReferenceDraft(createEmptyReferenceDraft(referenceListKey));
  }

  async function removeReferenceOption(id: string) {
    try {
      await deleteReferenceOption(id);
      setReferenceOptions((current) => current.filter((item) => item.id !== id));
      if (editingReferenceId === id) cancelEditReferenceOption();
      pushAudit("delete_reference_option", `Xóa lựa chọn ${id}`);
      await createAuditLog("delete_reference_option", `Xóa lựa chọn ${id}`, id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được lựa chọn");
    }
  }

  function changeReferenceListKey(key: string) {
    setReferenceListKey(key);
    setEditingReferenceId(null);
    setReferenceDraft(createEmptyReferenceDraft(key));
  }

  async function addAppUser() {
    if (!appUserDraft.email.trim()) return;

    const normalizedUser = {
      ...appUserDraft,
      email: appUserDraft.email.trim().toLowerCase(),
      full_name: appUserDraft.full_name?.trim() || null
    };

    try {
      if (editingAppUserId) {
        const saved = await updateAppUser(editingAppUserId, normalizedUser);
        setAppUsers((current) => current.map((item) => (item.id === editingAppUserId ? saved : item)));
        setEditingAppUserId(null);
        setAppUserDraft(createEmptyAppUserDraft());
        pushAudit("update_app_user", `Cập nhật người dùng ${saved.email}`);
        await createAuditLog("update_app_user", `Cập nhật người dùng ${saved.email}`, saved.id);
      } else {
        const saved = await createAppUser(normalizedUser);
        setAppUsers((current) => [...current, saved].sort((a, b) => a.email.localeCompare(b.email)));
        setAppUserDraft(createEmptyAppUserDraft());
        pushAudit("create_app_user", `Thêm người dùng ${saved.email}`);
        await createAuditLog("create_app_user", `Thêm người dùng ${saved.email}`, saved.id);
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không lưu được người dùng");
    }
  }

  function startEditAppUser(user: AppUser) {
    setEditingAppUserId(user.id);
    setAppUserDraft({ email: user.email, full_name: user.full_name, role: user.role });
  }

  function cancelEditAppUser() {
    setEditingAppUserId(null);
    setAppUserDraft(createEmptyAppUserDraft());
  }

  async function removeAppUser(id: string) {
    if (currentUserId === id) {
      setRemoteError("Không thể tự xóa chính tài khoản đang đăng nhập.");
      return;
    }
    try {
      await deleteAppUser(id);
      setAppUsers((current) => current.filter((item) => item.id !== id));
      if (editingAppUserId === id) cancelEditAppUser();
      pushAudit("delete_app_user", `Xóa người dùng ${id}`);
      await createAuditLog("delete_app_user", `Xóa người dùng ${id}`, id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được người dùng");
    }
  }

  async function addWorker() {
    if (!workerDraft.worker_code.trim() || !workerDraft.full_name.trim()) return;

    const normalizedWorker = {
      ...workerDraft,
      worker_code: workerDraft.worker_code.trim().toUpperCase(),
      full_name: workerDraft.full_name.trim(),
      department: workerDraft.department.trim() || "San xuat",
      stages: workerDraft.stages
    };

    try {
      if (editingWorkerId) {
        const savedWorker = await updateWorker(editingWorkerId, normalizedWorker);
        setWorkers((current) =>
          current.map((item) => (item.id === editingWorkerId ? savedWorker : item)).sort((a, b) => a.worker_code.localeCompare(b.worker_code))
        );
        setEditingWorkerId(null);
        setWorkerDraft(createEmptyWorkerDraft());
        pushAudit("update_worker", `Cập nhật thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`);
        await createAuditLog("update_worker", `Cập nhật thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`, savedWorker.id);
      } else {
        const savedWorker = await createWorker(normalizedWorker);
        setWorkers((current) => [...current, savedWorker].sort((a, b) => a.worker_code.localeCompare(b.worker_code)));
        setWorkerDraft(createEmptyWorkerDraft());
        pushAudit("create_worker", `Thêm thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`);
        await createAuditLog("create_worker", `Thêm thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`, savedWorker.id);
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không lưu được thợ");
    }
  }

  function startEditWorker(worker: WorkerMaster) {
    setEditingWorkerId(worker.id);
    setWorkerDraft({
      worker_code: worker.worker_code,
      full_name: worker.full_name,
      department: worker.department,
      stages: worker.stages
    });
  }

  function cancelEditWorker() {
    setEditingWorkerId(null);
    setWorkerDraft(createEmptyWorkerDraft());
  }

  async function removeWorker(id: string) {
    try {
      await deleteWorker(id);
      setWorkers((current) => current.filter((item) => item.id !== id));
      if (editingWorkerId === id) cancelEditWorker();
      pushAudit("delete_worker", `Xóa thợ ${id}`);
      await createAuditLog("delete_worker", `Xóa thợ ${id}`, id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được thợ (có thể đang được dùng trong giao dịch NVL)");
    }
  }

  return {
    materialDraft,
    workerDraft,
    stageDraft,
    referenceDraft,
    appUserDraft,
    referenceListKey,
    setMaterialDraft,
    setWorkerDraft,
    setStageDraft,
    setReferenceDraft,
    setAppUserDraft,
    editingWorkerId,
    editingMaterialId,
    editingStageId,
    editingReferenceId,
    editingAppUserId,
    addMaterial,
    startEditMaterial,
    cancelEditMaterial,
    removeMaterial,
    addStage,
    startEditStage,
    cancelEditStage,
    removeStage,
    addReferenceOption,
    startEditReferenceOption,
    cancelEditReferenceOption,
    removeReferenceOption,
    changeReferenceListKey,
    addAppUser,
    startEditAppUser,
    cancelEditAppUser,
    removeAppUser,
    addWorker,
    startEditWorker,
    cancelEditWorker,
    removeWorker
  };
}
