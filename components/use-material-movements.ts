"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ProductionOrder, Status } from "@/lib/domain/production";
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
import { buildDraftStageMovements, orderLineKey } from "@/lib/production-summary";
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
  setSelectedItemSku: (sku: string | null) => void;
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
  setSelectedItemSku,
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
      const lineKey = orderLineKey(code, draft.itemSku || draft.sku);
      const previous = current[lineKey];
      if (previous && JSON.stringify(previous) === JSON.stringify(draft)) {
        return current;
      }
      return { ...current, [lineKey]: draft };
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

  // Loi chung cho ca luong "luu draft dang soan" (addOrderAsync) va luong
  // "cap nhat truc tiep 1 dong tho da ghi nhan" (updateStageMovementFields) -
  // tach ra de 2 luong dung chung dung 1 bo validate/business-rules/persist,
  // tranh copy-paste va lech logic giua 2 noi.
  async function persistMovement(
    inputOrder: ProductionOrder,
    effectiveEditingIdOverride: string | null
  ): Promise<ProductionOrder | null> {
    const missingFields = validateMovementDraft(inputOrder);
    if (missingFields.length > 0) {
      setRemoteError(`Chưa thể lưu giao dịch. Vui lòng bổ sung: ${missingFields.join(", ")}.`);
      return null;
    }
    const normalizedDraft = applyProductionBusinessRules(inputOrder, orders);

    if (shouldForceDirectCharge(normalizedDraft.stage, normalizedDraft.status, stageRules)) {
      const detail = "Trạng thái Xác định chỉ áp dụng cho công đoạn Cán kéo, Đan dây hoặc Biến.";
      pushAudit("blocked_direct_charge_stage", detail);
      setRemoteError(detail);
      return null;
    }

    if (isLargeWeightMovement(normalizedDraft)) {
      pushAudit("large_weight_warning", `Giao dịch ${normalizedDraft.code} có trọng lượng trên 2000g, cần kiểm tra trước khi chốt.`);
    }

    const normalizedStageCode = normalizeStageCode(normalizedDraft.stage);
    const normalizedItemSku = (normalizedDraft.itemSku || normalizedDraft.sku).trim();
    const existingStageMovement = !effectiveEditingIdOverride && isSingleWorkerStage(normalizedStageCode)
      ? orders.find(
          (order) =>
            order.code === normalizedDraft.code.trim() &&
            (order.itemSku || order.sku) === normalizedItemSku &&
            normalizeStageCode(order.stage) === normalizedStageCode
        )
      : undefined;
    const effectiveEditingId = effectiveEditingIdOverride || existingStageMovement?.id || null;

    const nextOrder = {
      ...normalizedDraft,
      id: effectiveEditingId || normalizedDraft.id || crypto.randomUUID(),
      code: normalizedDraft.code.trim(),
      sku: normalizedDraft.sku.trim(),
      itemSku: normalizedItemSku,
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
      const savedLineKey = orderLineKey(savedOrder.code, savedOrder.itemSku || savedOrder.sku);
      const nextMovementDraftCache = { ...movementDraftCache, [savedLineKey]: savedOrder };
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
      setSelectedItemSku(savedOrder.itemSku || savedOrder.sku || null);
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

      return savedOrder;
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : effectiveEditingId ? "Không cập nhật được giao dịch" : "Không thêm được giao dịch");
      return null;
    }
  }

  function addOrder(resetMode: "close" | "clearStage" | "keepStage" = "close") {
    void addOrderAsync(resetMode);
  }

  async function addOrderAsync(resetMode: "close" | "clearStage" | "keepStage" = "close") {
    const savedOrder = await persistMovement(draft, editingMovementId);
    if (!savedOrder) return;

    if (resetMode === "close") {
      setDraft(createEmptyOrder());
      setEditingMovementId(null);
      setIsMovementFormOpen(false);
      setActiveModule("Nhật ký NVL");
    } else if (resetMode === "keepStage") {
      setEditingMovementId(null);
      // Khoi "Tho moi" cho tho tiep theo phai trong hoan toan - khong chi
      // reset Tho/Xuat/Nhap ma con ca Loai vang/Trang thai tinh hao/Nang
      // cao (NXT/hao hut), neu khong se de lai du lieu cua tho VUA luu,
      // gay nham la mac dinh "dien san" cho tho ke tiep.
      setDraft((current) => {
        const occurredDate = current.occurredDate || toIsoDate();
        return {
          ...current,
          id: "",
          worker: "",
          qtyPiece: 0,
          issued: 0,
          returned: 0,
          transferred: 0,
          loss: 0,
          sourceMaterialName: "",
          materialType: "",
          status: "Treo nợ",
          goldAge: 0.75,
          nxtLinkCode: "",
          importSource: "",
          exportSource: "",
          convertedIssueWeight: 0,
          convertedReturnWeight: 0,
          lossPeriod: getCarryOverLossPeriod(occurredDate, "Treo nợ"),
          nxtPeriod: toMonthCode(occurredDate)
        };
      });
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
  }

  // Cap nhat truc tiep 1 dong tho da ghi nhan (khau nhieu tho) - moi tho
  // giu nguyen 1 khoi nhap lieu day du, sua xong bam "Cap nhat" ngay tren
  // dong do, KHONG anh huong den draft dang soan cho tho moi (khong dung
  // chung 1 state nhu truoc, tranh du lieu "bien mat" khoi khu vuc nhap).
  async function updateStageMovementFields(order: ProductionOrder) {
    await persistMovement(order, order.id);
  }

  function removeOrder(id: string) {
    const targetIndex = orders.findIndex((order) => order.id === id);
    const target = targetIndex >= 0 ? orders[targetIndex] : undefined;
    if (target && isClosedStatus(target.status)) {
      const detail = `Không thể xóa giao dịch ${target.code} vì LSX đã chốt`;
      pushAudit("blocked_delete_movement", detail);
      setRemoteError(detail);
      return;
    }

    setOrders((current) => current.filter((order) => order.id !== id));

    void (async () => {
      try {
        await deleteMaterialMovement(id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Không xóa được giao dịch";
        if (isSupabaseConfigured) {
          try {
            await reloadOperationalData();
          } catch {
            // Keep the original delete failure visible even if the follow-up re-sync fails.
          }
        } else if (target) {
          setOrders((current) => {
            if (current.some((order) => order.id === id)) return current;
            const restoredOrders = [...current];
            restoredOrders.splice(Math.min(Math.max(targetIndex, 0), restoredOrders.length), 0, target);
            return restoredOrders;
          });
        }
        setRemoteError(errorMessage);
        return;
      }

      if (target) {
        pushAudit("delete_movement", `Xóa giao dịch ${target.code} - ${target.worker}`);
        void createAuditLog("delete_movement", `Xóa giao dịch ${target.code} - ${target.worker}`, id);
      }
    })();
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
    const draftStageMovements = buildDraftStageMovements(orders, draft.code, draft.itemSku || draft.sku);
    const existing = draftStageMovements.get(stageCode);

    if (existing && isSingleWorkerStage(stageCode)) {
      attachToExistingMovement(existing);
    } else {
      // Khong tu goi y san 1 tho (truoc day lay tho dau tien co lam khau
      // nay) - de trong de nguoi dung tu chon, tranh dien san du lieu
      // ma khong ai thuc su chon.
      setEditingMovementId(null);
      setDraft((current) => ({
        ...current,
        id: "",
        stage: stageCode,
        stageStatus: existing?.stageStatus ?? "Đang thực hiện",
        worker: "",
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

  // Chon Ma hang dang cap nhat trong LSX (1 LSX co the co nhieu Ma hang,
  // moi Ma hang 1 tien trinh cong doan rieng). Reset lai draft nhu chuyen
  // sang mot LSX/khau moi, vi doi Ma hang = doi hoan toan tien trinh dang xem.
  function selectItemForDraft(item: { sku: string; productName?: string }) {
    setEditingMovementId(null);
    setDraft((current) => ({
      ...current,
      id: "",
      sku: item.sku,
      itemSku: item.sku,
      productName: item.productName ?? current.productName,
      stage: "",
      worker: "",
      qtyPiece: 0,
      issued: 0,
      returned: 0,
      transferred: 0,
      loss: 0,
      sourceMaterialName: "",
      convertedIssueWeight: 0,
      convertedReturnWeight: 0,
      importSource: "",
      exportSource: "",
      nxtLinkCode: ""
    }));
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
    updateStageMovementFields,
    removeOrder,
    openMovementForEdit,
    closeMovementForm,
    openEmptyMovementForm,
    selectStageTab,
    selectItemForDraft,
    savedMovementNotice,
    dismissSavedMovementNotice
  };
}
