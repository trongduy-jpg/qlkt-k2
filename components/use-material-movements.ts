"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ProductionOrder, Status } from "@/lib/demo-data";
import type { WorkerMaster } from "@/lib/material-service";
import {
  applyProductionBusinessRules,
  buildUniqueProductionOrderCode,
  getCarryOverLossPeriod,
  getStageLabel,
  isLargeWeightMovement,
  isSingleWorkerStage,
  normalizeStageCode,
  shouldForceDirectCharge,
  toIsoDate,
  toMonthCode,
  type HaoHutRule
} from "@/lib/production-business-rules";
import { buildDraftStageMovements } from "@/lib/production-summary";
import { createAuditLog, createMaterialMovement, deleteMaterialMovement, updateMaterialMovement } from "@/lib/material-service";
import { createEmptyOrder } from "@/lib/production-mappers";
import { isClosedStatus, validateMovementDraft } from "@/lib/production-helpers";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ReloadOperationalDataOptions } from "@/components/use-operational-data";

type MovementDraftCache = Record<string, ProductionOrder>;

export type SavedMovementNotice = { id: string; message: string };

const SAVED_NOTICE_DURATION_MS = 4500;

type UseMaterialMovementsParams = {
  orders: ProductionOrder[];
  workers: WorkerMaster[];
  stageRules: Record<string, HaoHutRule>;
  movementDraftCache: MovementDraftCache;
  // Toan bo ma LSX da co (ca giao dich lan header chua co giao dich), dung
  // de goi y so LSX tiep theo cho dung du user tao moi tu Nhat ky NVL hay
  // tu Lenh san xuat - tranh de xuat lai STT1 moi lan mo form trong.
  existingOrderCodes: string[];
  setOrders: Dispatch<SetStateAction<ProductionOrder[]>>;
  setMovementDraftCache: Dispatch<SetStateAction<MovementDraftCache>>;
  setSelectedOrderCode: (code: string | null) => void;
  setActiveModule: (label: string) => void;
  reloadOperationalData: (options?: ReloadOperationalDataOptions) => Promise<unknown>;
  pushAudit: (action: string, detail: string) => void;
  setRemoteError: (message: string | null) => void;
};

export function useMaterialMovements({
  orders,
  workers,
  stageRules,
  movementDraftCache,
  existingOrderCodes,
  setOrders,
  setMovementDraftCache,
  setSelectedOrderCode,
  setActiveModule,
  reloadOperationalData,
  pushAudit,
  setRemoteError
}: UseMaterialMovementsParams) {
  const [draft, setDraft] = useState<ProductionOrder>(createEmptyOrder());
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [movementFormTab, setMovementFormTab] = useState<"info" | "stage">("info");
  const [savedMovementNotice, setSavedMovementNotice] = useState<SavedMovementNotice | null>(null);

  function attachToExistingMovement(order: ProductionOrder) {
    setEditingMovementId(order.id);
    setDraft((current) => ({ ...current, ...order }));
  }

  function dismissSavedMovementNotice() {
    setSavedMovementNotice(null);
  }

  useEffect(() => {
    if (!isMovementFormOpen) return;
    const code = draft.code.trim();
    if (!code) return;

    setMovementDraftCache((current) => {
      const previous = current[code];
      if (previous && JSON.stringify(previous) === JSON.stringify(draft)) {
        return current;
      }
      return { ...current, [code]: draft };
    });
  }, [draft, isMovementFormOpen, setMovementDraftCache]);

  useEffect(() => {
    if (!savedMovementNotice) return;
    const timer = setTimeout(() => setSavedMovementNotice(null), SAVED_NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [savedMovementNotice]);

  function updateDraft<K extends keyof ProductionOrder>(key: K, value: ProductionOrder[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      const occurredDate = key === "occurredDate" ? String(value || toIsoDate()) : next.occurredDate || toIsoDate();
      const statusValue = key === "status" ? (value as Status) : next.status;
      const issued = key === "issued" ? Number(value) : next.issued;
      const returned = key === "returned" ? Number(value) : next.returned;
      const transferred = key === "transferred" ? Number(value) : (next.transferred ?? 0);
      const goldAge = key === "goldAge" ? Number(value) : Number(next.goldAge || 1);

      next.loss = Math.max(0, Number((issued - returned - transferred).toFixed(4)));
      next.powder = 0;
      next.nxtPeriod = key === "occurredDate" ? toMonthCode(occurredDate) : next.nxtPeriod;
      next.lossPeriod = key === "occurredDate" || key === "status" ? getCarryOverLossPeriod(occurredDate, statusValue) : next.lossPeriod;
      next.code =
        key === "occurredDate" && (!current.code || current.code.startsWith("DHAG-"))
          ? buildUniqueProductionOrderCode("DHAG", occurredDate, existingOrderCodes)
          : next.code;
      next.convertedIssueWeight = Number((issued * goldAge).toFixed(4));
      next.convertedReturnWeight = Number((returned * goldAge).toFixed(4));
      return next;
    });
    setRemoteError(null);
  }

  function addOrder(resetMode: "close" | "clearStage" | "keepStage" = "close") {
    void addOrderAsync(resetMode);
  }

  async function addOrderAsync(resetMode: "close" | "clearStage" | "keepStage" = "close") {
    const missingFields = validateMovementDraft(draft);
    if (missingFields.length > 0) {
      setRemoteError(`Chưa thể lưu giao dịch. Vui lòng bổ sung: ${missingFields.join(", ")}.`);
      return;
    }
    const normalizedDraft = applyProductionBusinessRules(draft, orders);

    if (shouldForceDirectCharge(normalizedDraft.stage, normalizedDraft.status, stageRules)) {
      const detail = "Trạng thái Xác định chỉ áp dụng cho công đoạn Cán kéo, Đan dây hoặc Biến.";
      pushAudit("blocked_direct_charge_stage", detail);
      setRemoteError(detail);
      return;
    }

    if (isLargeWeightMovement(normalizedDraft)) {
      pushAudit("large_weight_warning", `Giao dịch ${normalizedDraft.code} có trọng lượng trên 2000g, cần kiểm tra trước khi chốt.`);
    }

    const normalizedStageCode = normalizeStageCode(normalizedDraft.stage);
    const existingStageMovement = isSingleWorkerStage(normalizedStageCode)
      ? orders.find((order) => order.code === normalizedDraft.code.trim() && normalizeStageCode(order.stage) === normalizedStageCode)
      : undefined;
    const effectiveEditingId = editingMovementId || existingStageMovement?.id || null;

    const nextOrder = {
      ...normalizedDraft,
      id: effectiveEditingId || normalizedDraft.id || crypto.randomUUID(),
      code: normalizedDraft.code.trim(),
      sku: normalizedDraft.sku.trim(),
      worker: normalizedDraft.worker.trim()
    };

    try {
      const savedOrder = effectiveEditingId
        ? isSupabaseConfigured
          ? await updateMaterialMovement(nextOrder)
          : nextOrder
        : isSupabaseConfigured
          ? await createMaterialMovement(nextOrder)
          : nextOrder;
      const nextMovementDraftCache = { ...movementDraftCache, [savedOrder.code]: savedOrder };
      setMovementDraftCache(nextMovementDraftCache);

      if (isSupabaseConfigured) {
        await reloadOperationalData({
          movementDraftOverrides: nextMovementDraftCache
        });
      } else {
        setOrders((current) =>
          effectiveEditingId
            ? current.map((item) => (item.id === effectiveEditingId ? savedOrder : item))
            : [savedOrder, ...current]
        );
      }

      setSelectedOrderCode(savedOrder.code);
      const stageLabel = getStageLabel(savedOrder.stage);
      const workerLabel = savedOrder.worker || "(chưa có thợ)";
      if (effectiveEditingId) {
        pushAudit("update_movement", `Cập nhật giao dịch NVL ${savedOrder.code} cho ${savedOrder.worker}`);
        await createAuditLog("update_movement", `Cập nhật giao dịch NVL ${savedOrder.code} cho ${savedOrder.worker}`, savedOrder.id);
        setSavedMovementNotice({
          id: savedOrder.id,
          message: `Đã cập nhật: ${savedOrder.code} · Khâu ${stageLabel} · Thợ ${workerLabel}`
        });
      } else {
        pushAudit("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`);
        await createAuditLog("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`, savedOrder.id);
        setSavedMovementNotice({
          id: savedOrder.id,
          message: `Đã thêm: ${savedOrder.code} · Khâu ${stageLabel} · Thợ ${workerLabel}`
        });
      }

      if (resetMode === "close") {
        setDraft(createEmptyOrder());
        setEditingMovementId(null);
        setIsMovementFormOpen(false);
        setActiveModule("Nhật ký NVL");
      } else if (resetMode === "keepStage") {
        setEditingMovementId(null);
        setDraft((current) => ({
          ...current,
          id: "",
          worker: "",
          qtyPiece: 0,
          issued: 0,
          returned: 0,
          transferred: 0,
          loss: 0,
          sourceMaterialName: ""
        }));
      } else {
        setEditingMovementId(null);
        setDraft((current) => ({
          ...current,
          id: "",
          stage: "",
          worker: "",
          qtyPiece: 0,
          issued: 0,
          returned: 0,
          transferred: 0,
          loss: 0,
          sourceMaterialName: ""
        }));
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : editingMovementId ? "Không cập nhật được giao dịch" : "Không thêm được giao dịch");
    }
  }

  function removeOrder(id: string) {
    const target = orders.find((order) => order.id === id);
    if (target && isClosedStatus(target.status)) {
      const detail = `Không thể xóa giao dịch ${target.code} vì LSX đã chốt`;
      pushAudit("blocked_delete_movement", detail);
      setRemoteError(detail);
      return;
    }

    setOrders((current) => current.filter((order) => order.id !== id));
    if (target) pushAudit("delete_movement", `Xóa giao dịch ${target.code} - ${target.worker}`);

    void deleteMaterialMovement(id).catch((error) => {
      setRemoteError(error instanceof Error ? error.message : "Không xóa được giao dịch");
    });
    if (target) void createAuditLog("delete_movement", `Xóa giao dịch ${target.code} - ${target.worker}`, id);
  }

  // Mo 1 dong da co san de sua (bam tu bang NK NVL hoac tu danh sach tho
  // trong khau nhieu tho) - luon mo thang vao tab "Cong doan" de user thay
  // ngay khau/tho dang sua, tranh nham lan voi tao moi.
  function openMovementForEdit(order: ProductionOrder) {
    attachToExistingMovement(order);
    setSelectedOrderCode(order.code);
    setMovementFormTab("stage");
    setIsMovementFormOpen(true);
    setActiveModule("Nhật ký NVL");
    setRemoteError(null);
  }

  function closeMovementForm() {
    setIsMovementFormOpen(false);
    setEditingMovementId(null);
    setDraft(createEmptyOrder());
    setRemoteError(null);
  }

  function openEmptyMovementForm() {
    setEditingMovementId(null);
    const emptyOrder = createEmptyOrder();
    setDraft({
      ...emptyOrder,
      code: buildUniqueProductionOrderCode("DHAG", emptyOrder.occurredDate || toIsoDate(), existingOrderCodes)
    });
    setRemoteError(null);
    setMovementFormTab("info");
    setIsMovementFormOpen(true);
  }

  // Chuyen tab khau trong drawer. Khau 1 tho da co dong: gan lai dung dong
  // do de sua (khong tao dong moi). Khau chua co dong hoac khau nhieu tho:
  // bat dau 1 draft moi cho khau ay.
  function selectStageTab(stageCode: string) {
    const draftStageMovements = buildDraftStageMovements(orders, draft.code);
    const existing = draftStageMovements.get(stageCode);

    if (existing && isSingleWorkerStage(stageCode)) {
      attachToExistingMovement(existing);
    } else {
      const suggestedWorker = workers.find((item) => item.stages.includes(stageCode));
      setEditingMovementId(null);
      setDraft((current) => ({
        ...current,
        id: "",
        stage: stageCode,
        worker: suggestedWorker?.full_name ?? "",
        qtyPiece: 0,
        issued: 0,
        returned: 0,
        transferred: 0,
        loss: 0,
        sourceMaterialName: "",
        // Reset nhom Nang cao (NXT/hao hut) ve trang thai rong cho khau moi,
        // tranh ro ri quy doi KCP / nguon / ma noi tu khau truoc sang. Tuoi
        // vang giu lai lam mac dinh; quy doi = 0 vi Xuat/Nhap vua reset ve 0.
        convertedIssueWeight: 0,
        convertedReturnWeight: 0,
        importSource: "",
        exportSource: "",
        nxtLinkCode: ""
      }));
    }
    setRemoteError(null);
  }

  // Sua 1 dong cu the trong danh sach "Tho da ghi nhan cho khau nay" (khau
  // nhieu tho) - thay vi luon tao dong moi khi bam lai tab khau, cho phep
  // gan dung vao dong da chon de cap nhat, dam bao khong tao trung dong.
  function switchToMovement(order: ProductionOrder) {
    attachToExistingMovement(order);
    setRemoteError(null);
  }

  return {
    draft,
    setDraft,
    editingMovementId,
    setEditingMovementId,
    isMovementFormOpen,
    setIsMovementFormOpen,
    movementFormTab,
    setMovementFormTab,
    updateDraft,
    addOrder,
    addOrderAsync,
    removeOrder,
    openMovementForEdit,
    closeMovementForm,
    openEmptyMovementForm,
    selectStageTab,
    switchToMovement,
    savedMovementNotice,
    dismissSavedMovementNotice
  };
}
