"use client";

import { useEffect, useMemo } from "react";
import type { ProductionOrder, Status } from "@/lib/domain/production";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";
import {
  buildStageProgress,
  computeMovementTotals,
  selectMovementsForOrder,
  type StageOption,
  type StageProgressItem
} from "@/lib/production-summary";
import { buildSelectedOrderDetail, type SelectedOrderDetail } from "@/lib/production-workflow";
import { isClosedStatus } from "@/lib/production-helpers";
import { createAuditLog, createMaterialMovement, updateProductionOrderStatus } from "@/lib/material-service";
import { isSupabaseConfigured } from "@/lib/supabase";
import { buildSeedMovementFromSummary } from "@/lib/use-cases/material-movement-drafts";

type HeaderDraft = Omit<ProductionOrderHeader, "id" | "createdAt">;

export type UseSelectedProductionOrderDeps = {
  orders: ProductionOrder[];
  setOrders: (updater: (current: ProductionOrder[]) => ProductionOrder[]) => void;
  productionHeaders: ProductionOrderHeader[];
  setProductionHeaders: (updater: (current: ProductionOrderHeader[]) => ProductionOrderHeader[]) => void;
  orderSummaries: OrderSummary[];
  filteredOrderSummaries: OrderSummary[];
  stageOptionsForDropdown: StageOption[];
  selectedOrderCode: string | null;
  setSelectedOrderCode: (code: string | null) => void;
  selectedItemSku: string | null;
  setSelectedItemSku: (sku: string | null) => void;
  isProductionDetailOpen: boolean;
  setIsProductionDetailOpen: (open: boolean) => void;
  editingProductionCode: string | null;
  setEditingProductionCode: (code: string | null) => void;
  setProductionHeaderDraft: (draft: HeaderDraft) => void;
  buildProductionHeaderDraftFromSummary: (summary: OrderSummary) => HeaderDraft;
  setRecentCreatedOrderCode: (code: string | null) => void;
  setQuery: (value: string) => void;
  setStatus: (value: Status | "Tất cả") => void;
  setActiveModule: (label: string) => void;
  reloadOperationalData: () => Promise<unknown>;
  pushAudit: (action: string, detail: string) => void;
  setRemoteError: (message: string | null) => void;
};

// Toan bo derived state + handler xoay quanh "LSX/Ma hang dang duoc chon"
// (mo sidebar chi tiet, dong/mo lai LSX, xem NK NVL cua don do) duoc gom
// vao 1 hook rieng, tach khoi MaterialDashboard. 1 LSX co the co nhieu Ma
// hang (moi Ma hang 1 dong rieng trong bang) nen "dang chon" luon la cap
// (code, itemSku), khong con dung rieng code nhu truoc.
export function useSelectedProductionOrder(deps: UseSelectedProductionOrderDeps) {
  const {
    orders,
    setOrders,
    productionHeaders,
    setProductionHeaders,
    orderSummaries,
    filteredOrderSummaries,
    stageOptionsForDropdown,
    selectedOrderCode,
    setSelectedOrderCode,
    selectedItemSku,
    setSelectedItemSku,
    isProductionDetailOpen,
    setIsProductionDetailOpen,
    editingProductionCode,
    setEditingProductionCode,
    setProductionHeaderDraft,
    buildProductionHeaderDraftFromSummary,
    setRecentCreatedOrderCode,
    setQuery,
    setStatus,
    setActiveModule,
    reloadOperationalData,
    pushAudit,
    setRemoteError
  } = deps;

  const selectedOrderSummary = useMemo(() => {
    if (selectedOrderCode && selectedItemSku) {
      const exact = filteredOrderSummaries.find((item) => item.code === selectedOrderCode && item.sku === selectedItemSku);
      if (exact) return exact;
    }
    return filteredOrderSummaries.find((item) => item.code === selectedOrderCode) ?? filteredOrderSummaries[0] ?? null;
  }, [filteredOrderSummaries, selectedOrderCode, selectedItemSku]);

  useEffect(() => {
    if (!isProductionDetailOpen || !selectedOrderSummary) return;

    if (isClosedStatus(selectedOrderSummary.status)) {
      setEditingProductionCode(null);
      return;
    }

    setEditingProductionCode(selectedOrderSummary.code);
    setProductionHeaderDraft(buildProductionHeaderDraftFromSummary(selectedOrderSummary));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductionDetailOpen, selectedOrderSummary?.code, selectedOrderSummary?.sku, selectedOrderSummary?.status]);

  const selectedOrderMovements = useMemo(
    () => selectMovementsForOrder(orders, selectedOrderSummary?.code, selectedOrderSummary?.sku),
    [orders, selectedOrderSummary]
  );

  // Cac LSX khac duoc tao qua "+ Tao don moi cho khach nay" tu chinh LSX
  // dang xem (con), dung de hien dau hieu "cung khach hang" tren giao dien.
  // orderSummaries co the co nhieu dong cung ma LSX (moi Ma hang 1 dong)
  // nen loc trung theo code truoc khi hien danh sach lien ket.
  const childOrdersOfSelected = useMemo(() => {
    const code = selectedOrderSummary?.code;
    if (!code) return [];
    const seenCodes = new Set<string>();
    return orderSummaries.filter((summary) => {
      if (summary.parentOrderCode !== code) return false;
      if (seenCodes.has(summary.code)) return false;
      seenCodes.add(summary.code);
      return true;
    });
  }, [orderSummaries, selectedOrderSummary]);

  const selectedOrderMovementStats = useMemo(() => computeMovementTotals(selectedOrderMovements), [selectedOrderMovements]);

  const selectedOrderDetail: SelectedOrderDetail | null = useMemo(
    () => buildSelectedOrderDetail(selectedOrderSummary, selectedOrderMovements, productionHeaders),
    [productionHeaders, selectedOrderMovements, selectedOrderSummary]
  );

  const parentOrderOfSelected = useMemo(() => {
    const parentCode = selectedOrderDetail?.parentOrderCode;
    if (!parentCode) return null;
    return orderSummaries.find((summary) => summary.code === parentCode) ?? null;
  }, [orderSummaries, selectedOrderDetail]);

  const isEditingSelectedOrder = Boolean(selectedOrderSummary && editingProductionCode === selectedOrderSummary.code);

  const selectedOrderStageProgress: StageProgressItem[] = useMemo(
    () => buildStageProgress(stageOptionsForDropdown, selectedOrderMovements),
    [stageOptionsForDropdown, selectedOrderMovements]
  );

  function selectProductionOrder(code: string, itemSku?: string) {
    setSelectedOrderCode(code);
    setSelectedItemSku(itemSku ?? null);
    setIsProductionDetailOpen(true);
    setRecentCreatedOrderCode(code);
    setQuery("");
    setActiveModule("Lệnh sản xuất");
  }

  function viewSelectedOrderMovements() {
    if (!selectedOrderSummary) return;
    setQuery(selectedOrderSummary.code);
    setStatus("Tất cả");
    setActiveModule("Nhật ký NVL");
  }

  async function closeSelectedProductionOrder() {
    if (!selectedOrderSummary) return;
    if (isClosedStatus(selectedOrderSummary.status)) {
      const detail = `LSX ${selectedOrderSummary.code} đã được chốt trước đó`;
      pushAudit("blocked_close_production_order", detail);
      setRemoteError(detail);
      return;
    }

    try {
      if (selectedOrderMovements.length === 0) {
        const seedMovement = buildSeedMovementFromSummary(
          selectedOrderSummary,
          productionHeaders.find((header) => header.code === selectedOrderSummary.code)
        );
        const savedSeed = isSupabaseConfigured ? await createMaterialMovement(seedMovement) : seedMovement;
        setOrders((current) => [savedSeed, ...current.filter((item) => item.id !== savedSeed.id)]);
        setSelectedOrderCode(savedSeed.code);
        setSelectedItemSku(savedSeed.itemSku || savedSeed.sku || null);
        setQuery(savedSeed.code);
      }

      setProductionHeaders((current) =>
        current.map((header) => (header.code === selectedOrderSummary.code ? { ...header, status: "Đã chốt" } : header))
      );

      if (isSupabaseConfigured) {
        await updateProductionOrderStatus(selectedOrderSummary.code, "Đã chốt");
        await reloadOperationalData();
      }

      setSelectedOrderCode(selectedOrderSummary.code);
      setSelectedItemSku(selectedOrderSummary.sku || null);
      setQuery(selectedOrderSummary.code);
      setStatus("Tất cả");
      setActiveModule("Nhật ký NVL");
      pushAudit("close_production_order", `Chốt LSX ${selectedOrderSummary.code}`);
      await createAuditLog("close_production_order", `Chốt LSX ${selectedOrderSummary.code}`, selectedOrderMovements[0]?.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không chốt được LSX");
    }
  }

  async function reopenSelectedProductionOrder() {
    if (!selectedOrderSummary) return;
    if (!isClosedStatus(selectedOrderSummary.status)) return;

    try {
      setProductionHeaders((current) =>
        current.map((header) => (header.code === selectedOrderSummary.code ? { ...header, status: "Đang xử lý" } : header))
      );

      if (isSupabaseConfigured) {
        await updateProductionOrderStatus(selectedOrderSummary.code, "Đang xử lý");
        await reloadOperationalData();
      }

      setSelectedOrderCode(selectedOrderSummary.code);
      setSelectedItemSku(selectedOrderSummary.sku || null);
      pushAudit("reopen_production_order", `Mở lại LSX ${selectedOrderSummary.code} để cập nhật phát sinh mới`);
      await createAuditLog("reopen_production_order", `Mở lại LSX ${selectedOrderSummary.code} để cập nhật phát sinh mới`, selectedOrderMovements[0]?.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không mở lại được LSX");
    }
  }

  return {
    selectedOrderSummary,
    selectedOrderMovements,
    childOrdersOfSelected,
    selectedOrderMovementStats,
    selectedOrderDetail,
    parentOrderOfSelected,
    isEditingSelectedOrder,
    selectedOrderStageProgress,
    selectProductionOrder,
    viewSelectedOrderMovements,
    closeSelectedProductionOrder,
    reopenSelectedProductionOrder
  };
}
