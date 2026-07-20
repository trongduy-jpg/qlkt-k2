"use client";

import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { MaterialMaster, ReferenceOption, StageMaster, WorkerMaster } from "@/lib/material-service";
import type { AppUser } from "@/lib/auth-service";

// Gom toan bo state + handler CRUD cua man "Danh muc nen" (Cau hinh) vao
// 1 Context, thay vi truyen ~40 props rieng le tu MaterialDashboard xuong
// MasterDataSettingsView. State/logic van nam trong MaterialDashboard,
// Context chi la kenh truyen du lieu gon hon.

export type MasterDataContextValue = {
  materials: MaterialMaster[];
  workers: WorkerMaster[];
  stages: StageMaster[];
  referenceOptions: ReferenceOption[];
  referenceListKeys: Array<{ key: string; label: string }>;
  referenceListKey: string;
  onChangeReferenceListKey: (key: string) => void;
  appUsers: AppUser[];
  currentUserId?: string;
  materialDraft: Omit<MaterialMaster, "id">;
  workerDraft: Omit<WorkerMaster, "id">;
  stageDraft: Omit<StageMaster, "id">;
  referenceDraft: Omit<ReferenceOption, "id">;
  appUserDraft: Omit<AppUser, "id">;
  setMaterialDraft: Dispatch<SetStateAction<Omit<MaterialMaster, "id">>>;
  setWorkerDraft: Dispatch<SetStateAction<Omit<WorkerMaster, "id">>>;
  setStageDraft: Dispatch<SetStateAction<Omit<StageMaster, "id">>>;
  setReferenceDraft: Dispatch<SetStateAction<Omit<ReferenceOption, "id">>>;
  setAppUserDraft: Dispatch<SetStateAction<Omit<AppUser, "id">>>;
  onAddMaterial: () => void;
  onAddWorker: () => void;
  onAddStage: () => void;
  onAddReferenceOption: () => void;
  onAddAppUser: () => void;
  editingWorkerId: string | null;
  onStartEditWorker: (worker: WorkerMaster) => void;
  onCancelEditWorker: () => void;
  onDeleteWorker: (id: string) => void;
  editingMaterialId: string | null;
  onStartEditMaterial: (material: MaterialMaster) => void;
  onCancelEditMaterial: () => void;
  onDeleteMaterial: (id: string) => void;
  editingStageId: string | null;
  onStartEditStage: (stage: StageMaster) => void;
  onCancelEditStage: () => void;
  onDeleteStage: (id: string) => void;
  editingReferenceId: string | null;
  onStartEditReferenceOption: (option: ReferenceOption) => void;
  onCancelEditReferenceOption: () => void;
  onDeleteReferenceOption: (id: string) => void;
  editingAppUserId: string | null;
  onStartEditAppUser: (user: AppUser) => void;
  onCancelEditAppUser: () => void;
  onDeleteAppUser: (id: string) => void;
};

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

export function MasterDataProvider({ value, children }: { value: MasterDataContextValue; children: ReactNode }) {
  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error("useMasterData must be used within MasterDataProvider");
  return ctx;
}
