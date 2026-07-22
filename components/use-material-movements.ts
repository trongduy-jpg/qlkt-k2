"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ProductionOrder, Status } from "@/lib/demo-data";
import {
  applyProductionBusinessRules,
  buildProductionOrderCode,
  getCarryOverLossPeriod,
  isLargeWeightMovement,
  isSingleWorkerStage,
  normalizeStageCode,
  shouldForceDirectCharge,
  toIsoDate,
  toMonthCode,
  type HaoHutRule
} from "@/lib/production-business-rules";
import {
  createAuditLog,
  createMaterialMovement,
  deleteMaterialMovement,
  updateMaterialMovement,
  updateMaterialMovementStatus,
  updateProductionOrderStatus
} from "@/lib/material-service";
import { createEmptyOrder } from "@/lib/production-mappers";
import { getSummaryStatus, isClosedStatus, validateMovementDraft } from "@/lib/production-helpers";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ReloadOperationalDataOptions } from "@/components/use-operational-data";

type MovementDraftCache = Record<string, ProductionOrder>;

type UseMaterialMovementsParams = {
  orders: ProductionOrder[];
  stageRules: Record<string, HaoHutRule>;
  movementDraftCache: MovementDraftCache;
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
  stageRules,
  movementDraftCache,
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
  const [movementFormTab, setMovementFormTab] = useState<"info" | "stage" | "advanced">("info");

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
      next.code = key === "occurredDate" && (!current.code || current.code.startsWith("DHAG-")) ? buildProductionOrderCode("DHAG", occurredDate) : next.code;
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
      if (effectiveEditingId) {
        pushAudit("update_movement", `Cập nhật giao dịch NVL ${savedOrder.code} cho ${savedOrder.worker}`);
        await createAuditLog("update_movement", `Cập nhật giao dịch NVL ${savedOrder.code} cho ${savedOrder.worker}`, savedOrder.id);
      } else {
        pushAudit("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`);
        await createAuditLog("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`, savedOrder.id);
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

  function changeOrderStatus(id: string, nextStatus: Status) {
    const target = orders.find((order) => order.id === id);
    if (!target) return;

    if (isClosedStatus(target.status) && !isClosedStatus(nextStatus)) {
      const detail = `Không thể đổi trạng thái giao dịch ${target.code} vì LSX đã chốt`;
      pushAudit("blocked_update_status", detail);
      setRemoteError(detail);
      return;
    }

    const nextOrdersSnapshot = orders.map((order) => (order.id === id ? { ...order, status: nextStatus } : order));

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order;
        if (order.status !== nextStatus) {
          pushAudit("update_status", `${order.code}: ${order.status} -> ${nextStatus}`);
        }
        return { ...order, status: nextStatus };
      })
    );

    const nextOrderStatus = getSummaryStatus(
      nextOrdersSnapshot.filter((order) => order.code === target.code).map((order) => order.status)
    );

    void updateMaterialMovementStatus(id, nextStatus).catch((error) => {
      setRemoteError(error instanceof Error ? error.message : "Không cập nhật được trạng thái");
    });
    void updateProductionOrderStatus(target.code, nextOrderStatus).catch((error) => {
      setRemoteError(error instanceof Error ? error.message : "Không đồng bộ được trạng thái LSX");
    });
    void createAuditLog("update_status", `${target.code}: ${target.status} -> ${nextStatus}`, id);
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

  function openMovementForEdit(order: ProductionOrder) {
    setEditingMovementId(order.id);
    setDraft({ ...order });
    setSelectedOrderCode(order.code);
    setMovementFormTab("info");
    setIsMovementFormOpen(true);
    setActiveModule("Nhật ký NVL");
  }

  function closeMovementForm() {
    setIsMovementFormOpen(false);
    setEditingMovementId(null);
    setDraft(createEmptyOrder());
    setRemoteError(null);
  }

  function openEmptyMovementForm() {
    setEditingMovementId(null);
    setDraft(createEmptyOrder());
    setRemoteError(null);
    setMovementFormTab("info");
    setIsMovementFormOpen(true);
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
    changeOrderStatus,
    removeOrder,
    openMovementForEdit,
    closeMovementForm,
    openEmptyMovementForm
  };
}
