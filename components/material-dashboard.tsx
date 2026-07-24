"use client";

import {
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  formatGram,
  hasMeaningfulText,
  isClosedStatus,
  statusOptions
} from "@/lib/production-helpers";
import type { AuditEvent, OrderSummary, ProductionOrderHeader } from "@/lib/production-types";
import {
  createEmptyProductionOrderHeaderDraft,
} from "@/lib/production-mappers";
import { referenceListKeys } from "@/lib/master-data-drafts";
import {
  buildDraftStageMovements,
  buildLossReportRows,
  buildOrderSummaries,
  buildStageOptionsForDropdown,
  buildStageProgress,
  computeMovementTotals,
  orderLineKey,
  selectMovementsForOrder
} from "@/lib/production-summary";
import {
  ALL_CODE_MONTHS_FILTER,
  ALL_DESTINATIONS_FILTER,
  buildOrderCodeMonthOptions,
  buildProductionOverview,
  buildSelectedOrderDetail,
  filterJournalOrders,
  filterProductionSummaries,
  pickCurrentStagePerOrder
} from "@/lib/production-workflow";
import { LossReportView } from "@/components/loss-report-view";
import { StageEntryView } from "@/components/stage-entry-view";
import { AuditLogView } from "@/components/audit-log-view";
import { MasterDataSettingsView } from "@/components/master-data-settings-view";
import { MasterDataProvider } from "@/components/master-data-context";
import { MaterialJournalView } from "@/components/material-journal-view";
import { MaterialMovementDrawer } from "@/components/material-movement-drawer";
import { ProductionOrderDetailDrawer } from "@/components/production-order-detail-drawer";
import { ProductionOrderFormOverlay } from "@/components/production-order-form-overlay";
import { ProductionOrderInlineEditForm } from "@/components/production-order-inline-edit-form";
import { ProductionOrdersView } from "@/components/production-orders-view";
import { useMasterDataCrud } from "@/components/use-master-data-crud";
import { useMaterialMovements } from "@/components/use-material-movements";
import { useOperationalData } from "@/components/use-operational-data";
import { useProductionOrders } from "@/components/use-production-orders";
import { AppShell } from "@/components/app-shell";
import { DashboardOverviewView } from "@/components/dashboard-overview-view";
import { PriceTableView } from "@/components/price-table-view";
import { WorkerBoxView } from "@/components/worker-box-view";
import { buildWorkerBoxLinesFromMovements } from "@/lib/worker-box-service";
import {
  alerts,
  kpis,
  priceRows,
  productionOrders
} from "@/lib/demo-data";
import type { ProductionOrder, Status } from "@/lib/domain/production";
import {
  journalStages,
  mainJournalStageCodes,
  movementLossStatusOptions,
} from "@/lib/production-journal-options";
import {
  applyProductionBusinessRules,
  buildUniqueProductionOrderCode,
  formatDisplayDate,
  formatDisplayDateTime,
  getStageLabel,
  isSingleWorkerStage,
  normalizeStageCode as normalizeProductionStageCode,
  shouldForceDirectCharge,
  toIsoDate,
  type HaoHutRule
} from "@/lib/production-business-rules";
import {
  createAuditLog,
  createMaterialMovement,
  updateProductionOrderStatus,
  type ReferenceOption,
} from "@/lib/material-service";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadAppUsers } from "@/lib/auth-service";
import { getModuleFromPath, getPathForModule } from "@/lib/navigation";
import { buildMovementDraftFromSummary, buildSeedMovementFromSummary } from "@/lib/use-cases/material-movement-drafts";

const storageKey = "qlkt-k2-material-orders";
const productionOrderHeaderKey = "qlkt-k2-production-order-headers";
const auditKey = "qlkt-k2-audit-events";
const movementDraftCacheKey = "qlkt-k2-movement-draft-cache";
const productionHeaderDraftCacheKey = "qlkt-k2-production-header-draft-cache";

function normalizeStageCode(stage: string) {
  return normalizeProductionStageCode(stage);
}

export function MaterialDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const activeModule = getModuleFromPath(pathname);

  function setActiveModule(label: string) {
    const path = getPathForModule(label);
    if (path !== pathname) {
      router.push(path);
    }
  }

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("Tất cả");
  const [productionDeliveryStatus, setProductionDeliveryStatus] = useState("Tất cả trạng thái LSX");
  const [productionSalesType, setProductionSalesType] = useState("Tất cả SR/KH");
  const [productionCustomerQuery, setProductionCustomerQuery] = useState("");
  const [productionDeadlineFilter, setProductionDeadlineFilter] = useState("Tất cả deadline");
  const [productionDestinationFilter, setProductionDestinationFilter] = useState(ALL_DESTINATIONS_FILTER);
  const [productionCodeMonthFilter, setProductionCodeMonthFilter] = useState(ALL_CODE_MONTHS_FILTER);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  // 1 LSX co the co nhieu Ma hang (moi Ma hang la 1 dong rieng trong bang);
  // can them Ma hang de biet dung dong nao dang duoc chon/mo sidebar.
  const [selectedItemSku, setSelectedItemSku] = useState<string | null>(null);
  const [isProductionDetailOpen, setIsProductionDetailOpen] = useState(false);
  const [stageEntryQuery, setStageEntryQuery] = useState("");
  const [stageEntryOrderCode, setStageEntryOrderCode] = useState<string | null>(null);
  const [recentCreatedOrderCode, setRecentCreatedOrderCode] = useState<string | null>(null);
  const [movementDraftCache, setMovementDraftCache] = useState<Record<string, ProductionOrder>>({});
  const [productionHeaderDraftCache, setProductionHeaderDraftCache] = useState<
    Record<string, Omit<ProductionOrderHeader, "id" | "createdAt">>
  >({});
  const {
    orders,
    setOrders,
    productionHeaders,
    setProductionHeaders,
    materials,
    setMaterials,
    workers,
    setWorkers,
    stages,
    setStages,
    referenceOptions,
    setReferenceOptions,
    appUsers,
    setAppUsers,
    databaseHealth,
    isLoadingRemote,
    setIsLoadingRemote,
    remoteError,
    setRemoteError,
    reloadOperationalData
  } = useOperationalData({ movementDraftCache, productionHeaderDraftCache });
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const { appUser, signOut } = useAuth();

  // Toan bo state + handler CRUD danh muc nen (Cau hinh) da tach ra hook rieng.
  const masterData = useMasterDataCrud({
    setMaterials,
    setWorkers,
    setStages,
    setReferenceOptions,
    setAppUsers,
    currentUserId: appUser?.id,
    pushAudit,
    setRemoteError
  });

  useEffect(() => {
    const savedOrders = window.localStorage.getItem(storageKey);
    const savedProductionHeaders = window.localStorage.getItem(productionOrderHeaderKey);
    const savedAudit = window.localStorage.getItem(auditKey);
    const savedMovementDraftCache = window.localStorage.getItem(movementDraftCacheKey);
    const savedProductionHeaderDraftCache = window.localStorage.getItem(productionHeaderDraftCacheKey);

    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders) as ProductionOrder[]);
      } catch {
        setOrders(productionOrders);
      }
    }

    if (savedProductionHeaders) {
      try {
        setProductionHeaders(JSON.parse(savedProductionHeaders) as ProductionOrderHeader[]);
      } catch {
        setProductionHeaders([]);
      }
    }

    if (savedAudit) {
      try {
        setAuditEvents(JSON.parse(savedAudit) as AuditEvent[]);
      } catch {
        setAuditEvents([]);
      }
    }

    if (savedMovementDraftCache) {
      try {
        setMovementDraftCache(JSON.parse(savedMovementDraftCache) as Record<string, ProductionOrder>);
      } catch {
        setMovementDraftCache({});
      }
    }

    if (savedProductionHeaderDraftCache) {
      try {
        setProductionHeaderDraftCache(
          JSON.parse(savedProductionHeaderDraftCache) as Record<string, Omit<ProductionOrderHeader, "id" | "createdAt">>
        );
      } catch {
        setProductionHeaderDraftCache({});
      }
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadRemoteData() {
      setIsLoadingRemote(true);
      setRemoteError(null);

      try {
        const remoteState = await reloadOperationalData();
        setDraft((current) => ({
          ...current,
          material: remoteState?.remoteMaterials[0]?.name ?? current.material,
          worker: remoteState?.remoteWorkers[0]?.full_name ?? current.worker,
          stage: remoteState?.remoteWorkers[0]?.stages[0] ? normalizeStageCode(remoteState.remoteWorkers[0].stages[0]) : current.stage
        }));
      } catch (error) {
        setRemoteError(error instanceof Error ? error.message : "Không tải được dữ liệu Supabase");
      } finally {
        setIsLoadingRemote(false);
        setHasLoadedStorage(true);
      }
    }

    void loadRemoteData();
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(storageKey, JSON.stringify(orders));
  }, [hasLoadedStorage, orders]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(productionOrderHeaderKey, JSON.stringify(productionHeaders));
  }, [hasLoadedStorage, productionHeaders]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(auditKey, JSON.stringify(auditEvents));
  }, [auditEvents, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(movementDraftCacheKey, JSON.stringify(movementDraftCache));
  }, [hasLoadedStorage, movementDraftCache]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(productionHeaderDraftCacheKey, JSON.stringify(productionHeaderDraftCache));
  }, [hasLoadedStorage, productionHeaderDraftCache]);

  // Bang NK NVL chi hien 1 dong/LSX (cong doan hien tai = khau xa nhat da
  // ghi nhan). Xem lich su cac khau truoc thi mo drawer. Gom nhom truoc,
  // roi moi loc theo tu khoa/trang thai tren dong dai dien.
  const filteredOrders = useMemo(() => {
    const currentStageRows = pickCurrentStagePerOrder(orders, mainJournalStageCodes);
    return filterJournalOrders(currentStageRows, { query, status });
  }, [orders, query, status]);

  const orderSummaries = useMemo(() => buildOrderSummaries(orders, productionHeaders), [orders, productionHeaders]);

  // State + handler cua man "Lenh san xuat" (form header LSX) da tach ra hook rieng.
  const {
    productionHeaderDraft,
    setProductionHeaderDraft,
    editingProductionCode,
    setEditingProductionCode,
    updateProductionHeaderDraft,
    updateProductionHeaderItems,
    buildProductionHeaderDraftFromSummary,
    cancelProductionHeaderEdit,
    saveProductionHeader
  } = useProductionOrders({
    orderSummaries,
    productionHeaders,
    productionHeaderDraftCache,
    setProductionHeaderDraftCache,
    setProductionHeaders,
    setOrders,
    setSelectedOrderCode,
    setSelectedItemSku,
    setRecentCreatedOrderCode,
    isProductionFormOpen,
    setIsProductionFormOpen,
    reloadOperationalData,
    pushAudit,
    setRemoteError
  });

  const productionCodeMonthOptions = useMemo(() => buildOrderCodeMonthOptions(orderSummaries), [orderSummaries]);

  const filteredOrderSummaries = useMemo(
    () =>
      filterProductionSummaries(orderSummaries, {
        deliveryStatus: productionDeliveryStatus,
        salesType: productionSalesType,
        deadlineFilter: productionDeadlineFilter,
        destination: productionDestinationFilter,
        codeMonth: productionCodeMonthFilter,
        query: productionCustomerQuery
      }),
    [
      orderSummaries,
      productionCustomerQuery,
      productionDeadlineFilter,
      productionDeliveryStatus,
      productionSalesType,
      productionDestinationFilter,
      productionCodeMonthFilter
    ]
  );

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

  const selectedOrderDetail = useMemo(
    () => buildSelectedOrderDetail(selectedOrderSummary, selectedOrderMovements, productionHeaders),
    [productionHeaders, selectedOrderMovements, selectedOrderSummary]
  );

  const parentOrderOfSelected = useMemo(() => {
    const parentCode = selectedOrderDetail?.parentOrderCode;
    if (!parentCode) return null;
    return orderSummaries.find((summary) => summary.code === parentCode) ?? null;
  }, [orderSummaries, selectedOrderDetail]);

  const isEditingSelectedOrder = Boolean(selectedOrderSummary && editingProductionCode === selectedOrderSummary.code);

  const productionOverview = useMemo(() => buildProductionOverview(filteredOrderSummaries), [filteredOrderSummaries]);

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.issued += order.issued;
        acc.returned += order.returned;
        acc.powder += order.powder;
        acc.loss += order.loss;
        if (order.status === "Treo nợ") acc.pending += order.loss;
        return acc;
      },
      { issued: 0, returned: 0, powder: 0, loss: 0, pending: 0 }
    );
  }, [orders]);

  const computedWorkerBoxLines = useMemo(() => buildWorkerBoxLinesFromMovements(orders, workers), [orders, workers]);

  const lossReportRows = useMemo(() => buildLossReportRows(orders), [orders]);

  const stageRules = useMemo(() => {
    const rules: Record<string, HaoHutRule> = {};
    for (const stage of stages) rules[stage.stage_code] = stage.hao_hut_rule;
    return rules;
  }, [stages]);

  const {
    draft,
    setDraft,
    editingMovementId,
    setEditingMovementId,
    isMovementFormOpen,
    setIsMovementFormOpen,
    setMovementFormTab,
    movementFormTab,
    updateDraft,
    addOrder,
    addOrderAsync,
    removeOrder,
    openMovementForEdit,
    closeMovementForm,
    openEmptyMovementForm,
    selectStageTab,
    switchToMovement,
    selectItemForDraft,
    savedMovementNotice,
    dismissSavedMovementNotice
  } = useMaterialMovements({
    orders,
    workers,
    stageRules,
    movementDraftCache,
    existingOrderCodes: orderSummaries.map((summary) => summary.code),
    setOrders,
    setMovementDraftCache,
    setSelectedOrderCode,
    setSelectedItemSku,
    setActiveModule,
    reloadOperationalData,
    pushAudit,
    setRemoteError
  });

  const workerOptionsForDraft = useMemo(() => {
    const selectedStage = normalizeStageCode(draft.stage);
    const matches = workers.filter((worker) => worker.stages.includes(selectedStage));
    return matches.length > 0 ? matches : workers;
  }, [draft.stage, workers]);

  const stageOptionsForDropdown = useMemo(() => {
    const all = buildStageOptionsForDropdown(stages, journalStages);
    const byCode = new Map(all.map((item) => [item.value, item]));
    // Chi hien thi 12 cong doan chinh, dung dung thu tu quy trinh.
    return mainJournalStageCodes
      .map((code) => byCode.get(code) ?? { value: code, label: code })
      .filter(Boolean);
  }, [stages]);

  // Danh sach Ma hang cua LSX dang mo trong drawer NK NVL (1 LSX co the co
  // nhieu Ma hang, moi Ma hang 1 tien trinh cong doan rieng). Rong neu LSX
  // chua duoc tao chinh thuc (VD user ghi giao dich truoc khi tao LSX) -
  // drawer se fallback ve nhap tay Ma hang nhu truoc.
  const itemsForDraft = useMemo(() => {
    const header = productionHeaders.find((item) => item.code === draft.code.trim());
    return header?.items ?? [];
  }, [productionHeaders, draft.code]);

  const draftItemSku = draft.itemSku || draft.sku;

  const draftStageMovements = useMemo(
    () => buildDraftStageMovements(orders, draft.code, draftItemSku),
    [orders, draft.code, draftItemSku]
  );

  // Tat ca giao dich da ghi nhan cho DUNG (LSX + Ma hang + khau) dang chon
  // trong drawer - dung de hien danh sach tho da them cho khau nhieu tho.
  const currentDrawerStageMovements = useMemo(() => {
    const code = draft.code.trim();
    const stageCode = normalizeProductionStageCode(draft.stage);
    if (!code || !stageCode) return [];
    return orders
      .filter(
        (order) =>
          order.code === code &&
          (order.itemSku || order.sku) === draftItemSku &&
          normalizeProductionStageCode(order.stage) === stageCode
      )
      .sort((left, right) => String(right.id).localeCompare(String(left.id)));
  }, [orders, draft.code, draft.stage, draftItemSku]);

  const selectedOrderStageProgress = useMemo(
    () => buildStageProgress(stageOptionsForDropdown, selectedOrderMovements),
    [stageOptionsForDropdown, selectedOrderMovements]
  );

  const stageEntryFilteredOrders = useMemo(() => {
    // Man "Ghi nhan cong doan" van thao tac theo Ma LSX (chua tach theo Ma
    // hang) nen loc trung ma LSX truoc, tranh hien cung 1 LSX nhieu lan
    // khi no co nhieu Ma hang.
    const seenCodes = new Set<string>();
    const uniqueByCode = orderSummaries.filter((summary) => {
      if (seenCodes.has(summary.code)) return false;
      seenCodes.add(summary.code);
      return true;
    });
    const normalizedQuery = stageEntryQuery.trim().toLowerCase();
    if (!normalizedQuery) return uniqueByCode.slice(0, 30);
    return uniqueByCode
      .filter((summary) =>
        `${summary.code} ${summary.sku} ${summary.productName ?? ""} ${summary.customerName ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 30);
  }, [orderSummaries, stageEntryQuery]);

  const stageEntryOrderSummary = useMemo(
    () => orderSummaries.find((summary) => summary.code === stageEntryOrderCode) ?? null,
    [orderSummaries, stageEntryOrderCode]
  );

  const stageEntryMovements = useMemo(
    () => selectMovementsForOrder(orders, stageEntryOrderSummary?.code),
    [orders, stageEntryOrderSummary]
  );

  const stageEntriesByStage = useMemo(() => {
    const map: Record<string, ProductionOrder[]> = {};
    for (const movement of stageEntryMovements) {
      const code = normalizeProductionStageCode(movement.stage);
      (map[code] ||= []).push(movement);
    }
    return map;
  }, [stageEntryMovements]);

  const referenceOptionsByKey = useMemo(() => {
    const grouped = new Map<string, ReferenceOption[]>();
    for (const option of referenceOptions) {
      const list = grouped.get(option.list_key) ?? [];
      list.push(option);
      grouped.set(option.list_key, list);
    }
    for (const list of grouped.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return grouped;
  }, [referenceOptions]);

  function getDynamicOptions(listKey: string, staticFallback: { value: string; label: string }[]) {
    const dbOptions = referenceOptionsByKey.get(listKey);
    if (!dbOptions || dbOptions.length === 0) return staticFallback;
    return dbOptions.map((item) => ({ value: item.option_code, label: item.option_label }));
  }

  function pushAudit(action: string, detail: string) {
    setAuditEvents((current) => [
      {
        id: crypto.randomUUID(),
        action,
        detail,
        createdAt: formatDisplayDateTime(new Date())
      },
      ...current
    ].slice(0, 20));
  }

  function resetDemoData() {
    setOrders(productionOrders);
    setProductionHeaders([]);
    setAuditEvents([]);
    setMovementDraftCache({});
    setProductionHeaderDraftCache({});
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(productionOrderHeaderKey);
    window.localStorage.removeItem(auditKey);
    window.localStorage.removeItem(movementDraftCacheKey);
    window.localStorage.removeItem(productionHeaderDraftCacheKey);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ productionHeaders, orders, auditEvents }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qlkt-k2-demo-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function selectProductionOrder(code: string, itemSku?: string) {
    setSelectedOrderCode(code);
    setSelectedItemSku(itemSku ?? null);
    setIsProductionDetailOpen(true);
    setRecentCreatedOrderCode(code);
    setQuery("");
    setActiveModule("Lệnh sản xuất");
  }

  function openProductionOrderForEdit(code: string) {
    setSelectedOrderCode(code);
    setIsProductionDetailOpen(true);
    const summary = orderSummaries.find((item) => item.code === code);
    if (!summary) return;

    if (isClosedStatus(summary.status)) {
      setRemoteError(`LSX ${summary.code} đã chốt nên không thể chỉnh sửa thông tin gốc.`);
      return;
    }

    setEditingProductionCode(summary.code);
    setProductionHeaderDraft(buildProductionHeaderDraftFromSummary(summary));
    setIsProductionFormOpen(true);
  }

  function renderProductionFormOverlay() {
    return (
      <ProductionOrderFormOverlay
        isOpen={isProductionFormOpen}
        editingCode={editingProductionCode}
        draft={productionHeaderDraft}
        materials={materials}
        getDynamicOptions={getDynamicOptions}
        onDraftChange={updateProductionHeaderDraft}
        onItemsChange={updateProductionHeaderItems}
        onCancel={cancelProductionHeaderEdit}
        onSave={saveProductionHeader}
      />
    );
  }
  function renderInlineProductionEditForm() {
    return (
      <ProductionOrderInlineEditForm
        draft={productionHeaderDraft}
        materials={materials}
        getDynamicOptions={getDynamicOptions}
        onDraftChange={updateProductionHeaderDraft}
        onItemsChange={updateProductionHeaderItems}
        focusItemSku={selectedItemSku}
      />
    );
  }
  function prepareMovementForSummary(summary: OrderSummary | null, stageOverride?: string) {
    if (!summary) return;
    const lineKey = orderLineKey(summary.code, summary.sku);
    const cachedDraft = movementDraftCache[lineKey] ?? movementDraftCache[summary.code];
    const latestMovement =
      selectedOrderMovements[0] ??
      orders.find((order) => order.code === summary.code && (order.itemSku || order.sku) === summary.sku);
    const headerFallback = productionHeaders.find((header) => header.code === summary.code);

    setDraft((current) => {
      return buildMovementDraftFromSummary({
        summary,
        currentDraft: current,
        cachedDraft,
        latestMovement,
        header: headerFallback,
        stageOverride,
        stageMovements: selectedOrderMovements
      });
    });
    setSelectedOrderCode(summary.code);
    setSelectedItemSku(summary.sku || null);
    setQuery(summary.code);
    setStatus("Tất cả");
    setEditingMovementId(null);
    setMovementFormTab(stageOverride ? "stage" : "info");
    setIsMovementFormOpen(true);
    setActiveModule("Nhật ký NVL");
    setRemoteError(null);
  }

  function prepareMovementForSelectedOrder() {
    prepareMovementForSummary(selectedOrderSummary);
  }

  function openMovementForStage(stageCode: string) {
    prepareMovementForSummary(selectedOrderSummary, stageCode);
  }

  async function recordStageEntry(input: {
    stage: string;
    worker: string;
    issued: number;
    returned: number;
    status: Status;
  }) {
    if (!stageEntryOrderSummary) return;
    if (!input.worker.trim()) {
      setRemoteError("Vui lòng chọn thợ cho khâu này.");
      return;
    }

    const seed = buildSeedMovementFromSummary(
      stageEntryOrderSummary,
      productionHeaders.find((header) => header.code === stageEntryOrderSummary.code)
    );
    const nextOrder = applyProductionBusinessRules(
      {
        ...seed,
        id: crypto.randomUUID(),
        stage: input.stage,
        stageStatus: "Đang thực hiện",
        worker: input.worker.trim(),
        issued: Number(input.issued || 0),
        returned: Number(input.returned || 0),
        powder: 0,
        status: input.status
      },
      orders
    );

    try {
      const saved = isSupabaseConfigured ? await createMaterialMovement(nextOrder) : nextOrder;
      if (isSupabaseConfigured) {
        await reloadOperationalData();
      } else {
        setOrders((current) => [saved, ...current]);
      }
      const label = `Ghi nhận khâu ${getStageLabel(input.stage)} - ${saved.worker} cho LSX ${saved.code}`;
      pushAudit("create_movement", label);
      await createAuditLog("create_movement", label, saved.id);
      setRemoteError(null);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không ghi nhận được khâu này");
    }
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

  function startNewOrderForSameCustomer() {
    if (!selectedOrderSummary) return;

    const emptyDraft = createEmptyProductionOrderHeaderDraft();
    setEditingProductionCode(null);
    setProductionHeaderDraft({
      ...emptyDraft,
      code: buildUniqueProductionOrderCode("DHAG", emptyDraft.occurredDate || toIsoDate(), productionHeaders.map((header) => header.code)),
      sku: selectedOrderSummary.sku || "",
      productName: selectedOrderSummary.productName || "",
      customerName: selectedOrderSummary.customerName || "",
      salesType: selectedOrderSummary.salesType || "",
      parentOrderCode: selectedOrderSummary.code
    });
    setIsProductionFormOpen(true);
  }
  const isDashboard = activeModule === "Dashboard";
  const isProduction = activeModule === "Lệnh sản xuất";
  const isMovement = activeModule === "Nhật ký NVL";
  const isStageEntry = activeModule === "Ghi nhận công đoạn";
  const isPricing = activeModule === "Giá & định mức";
  const isReport = activeModule === "Báo cáo hao hụt";
  const isWorkerBox = activeModule === "Tồn hộp thợ";
  const isAudit = activeModule === "Audit log";
  const isSettings = activeModule === "Cấu hình";
  const draftOrderSummary = orderSummaries.find((summary) => summary.code === draft.code.trim());
  const isDraftForClosedOrder = Boolean(draftOrderSummary && isClosedStatus(draftOrderSummary.status));
  const normalizedDraftStage = normalizeStageCode(draft.stage);
  const isDraftDirectChargeInvalid = shouldForceDirectCharge(normalizedDraftStage, draft.status, stageRules);
  const isAdmin = appUser?.role === "admin";

  useEffect(() => {
    if (isSettings && !isAdmin) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettings, isAdmin]);

  useEffect(() => {
    if (!isSettings || !isAdmin || !isSupabaseConfigured) return;
    loadAppUsers()
      .then(setAppUsers)
      .catch((error) => setRemoteError(error instanceof Error ? error.message : "Không tải được danh sách người dùng"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettings, isAdmin]);

  return (
    <AppShell
      activeModule={activeModule}
      appUser={appUser}
      isAdmin={isAdmin}
      isLoadingRemote={isLoadingRemote}
      remoteError={remoteError}
      onClearRemoteError={() => setRemoteError(null)}
      onSelectModule={setActiveModule}
      onSignOut={signOut}
    >

      <DashboardOverviewView
        isVisible={isDashboard}
        kpis={kpis}
        productionOverview={productionOverview}
        recentOrders={filteredOrders}
        orderSummaries={filteredOrderSummaries}
        onOpenProduction={() => setActiveModule("Lệnh sản xuất")}
        onOpenJournal={() => setActiveModule("Nhật ký NVL")}
        onSelectProductionOrder={selectProductionOrder}
      />

          <div className={`${isReport ? "grid" : "hidden"} mb-5 gap-4 rounded-md border border-line bg-white/94 p-4 shadow-sm md:grid-cols-4`}>
            <div>
              <p className="text-xs uppercase text-zinc-500">Tổng xuất</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatGram(totals.issued)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Tổng nhập</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatGram(totals.returned)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Bột hoàn trả</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatGram(totals.powder)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Hao hụt / treo nợ</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatGram(totals.loss)} / {formatGram(totals.pending)}</p>
            </div>
          </div>

          <LossReportView isVisible={isReport} rows={lossReportRows} onExportJson={exportJson} />

          <WorkerBoxView isVisible={isWorkerBox} useDemoData={!isSupabaseConfigured} lines={computedWorkerBoxLines} />

          <ProductionOrdersView
            isVisible={isProduction}
            productionOverview={productionOverview}
            filteredOrderSummaries={filteredOrderSummaries}
            selectedOrderCode={selectedOrderCode}
            selectedItemSku={selectedItemSku}
            stageOptionsForDropdown={stageOptionsForDropdown}
            productionDeliveryStatus={productionDeliveryStatus}
            productionSalesType={productionSalesType}
            productionDeadlineFilter={productionDeadlineFilter}
            productionDestinationFilter={productionDestinationFilter}
            productionCodeMonthFilter={productionCodeMonthFilter}
            productionCodeMonthOptions={productionCodeMonthOptions}
            productionCustomerQuery={productionCustomerQuery}
            onDeliveryStatusChange={setProductionDeliveryStatus}
            onSalesTypeChange={setProductionSalesType}
            onDeadlineFilterChange={setProductionDeadlineFilter}
            onDestinationFilterChange={setProductionDestinationFilter}
            onCodeMonthFilterChange={setProductionCodeMonthFilter}
            onCustomerQueryChange={setProductionCustomerQuery}
            onCreateOrder={() => {
              setEditingProductionCode(null);
              const emptyDraft = createEmptyProductionOrderHeaderDraft();
              setProductionHeaderDraft({
                ...emptyDraft,
                code: buildUniqueProductionOrderCode("DHAG", emptyDraft.occurredDate || toIsoDate(), productionHeaders.map((header) => header.code))
              });
              setIsProductionFormOpen((current) => !current);
            }}
            onShowAllOrders={() => {
              setSelectedOrderCode(null);
              setSelectedItemSku(null);
              setIsProductionDetailOpen(false);
            }}
            onSelectOrder={selectProductionOrder}
          />

          <ProductionOrderDetailDrawer
            isOpen={isProductionDetailOpen && !isProductionFormOpen}
            isEditing={isEditingSelectedOrder}
            detail={selectedOrderDetail}
            summary={selectedOrderSummary}
            editForm={renderInlineProductionEditForm()}
            movementStats={selectedOrderMovementStats}
            stageProgress={selectedOrderStageProgress}
            parentOrder={parentOrderOfSelected}
            childOrders={childOrdersOfSelected}
            onClose={() => setIsProductionDetailOpen(false)}
            onSelectOrder={selectProductionOrder}
            onOpenMovementForStage={openMovementForStage}
            onViewMovements={viewSelectedOrderMovements}
            onSaveEdit={saveProductionHeader}
            onCloseOrder={closeSelectedProductionOrder}
            onReopenOrder={reopenSelectedProductionOrder}
            onStartNewOrderForSameCustomer={startNewOrderForSameCustomer}
            onEditAllItems={() => {
              if (selectedOrderSummary) openProductionOrderForEdit(selectedOrderSummary.code);
            }}
          />

          <div className={`${isMovement || isMovementFormOpen ? "unified-stack" : "hidden"}`}>
            <MaterialJournalView
              isVisible={isMovement}
              orders={filteredOrders}
              query={query}
              status={status}
              recentCreatedOrderCode={recentCreatedOrderCode}
              recentlySavedMovementId={savedMovementNotice?.id ?? null}
              onAddMovement={openEmptyMovementForm}
              onEditMovement={openMovementForEdit}
              onQueryChange={setQuery}
              onStatusChange={(nextStatus) => setStatus(nextStatus)}
            />

            <MaterialMovementDrawer
              isOpen={isMovementFormOpen}
              draft={draft}
              editingMovementId={editingMovementId}
              movementFormTab={movementFormTab}
              stageOptions={stageOptionsForDropdown}
              draftStageMovements={draftStageMovements}
              currentDrawerStageMovements={currentDrawerStageMovements}
              workerOptionsForDraft={workerOptionsForDraft}
              itemsForDraft={itemsForDraft}
              isDraftForClosedOrder={isDraftForClosedOrder}
              isDraftDirectChargeInvalid={isDraftDirectChargeInvalid}
              remoteError={remoteError}
              getDynamicOptions={getDynamicOptions}
              onClose={closeMovementForm}
              onTabChange={setMovementFormTab}
              onDraftChange={updateDraft}
              onSelectStage={selectStageTab}
              onSave={addOrder}
              onRemoveMovement={removeOrder}
              onEditStageMovement={switchToMovement}
              onSelectItem={selectItemForDraft}
            />

            {savedMovementNotice ? (
              <div className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-lg border border-jade/30 bg-white px-4 py-3 shadow-xl">
                <CheckCircle2 className="mt-0.5 shrink-0 text-jade" size={18} />
                <p className="text-sm leading-5 text-ink">{savedMovementNotice.message}</p>
                <button
                  type="button"
                  className="ml-1 shrink-0 text-zinc-400 hover:text-zinc-600"
                  onClick={dismissSavedMovementNotice}
                  title="Đóng thông báo"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            <section className={`${isMovement ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 text-brass" size={18} />
                  <div>
                    <h3 className="text-base font-bold text-ink">C&#7843;nh b&#225;o v&#7853;n h&#224;nh</h3>
                    <p className="mt-1 text-sm text-zinc-600">{alerts.length} c&#7843;nh b&#225;o c&#7847;n ki&#7875;m tra. M&#7863;c &#273;&#7883;nh thu g&#7885;n &#273;&#7875; kh&#244;ng l&#224;m nhi&#7877;u m&#224;n h&#236;nh nh&#7853;t k&#253;.</p>
                  </div>
                </div>
                <button
                  className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                  type="button"
                  onClick={() => setIsAlertPanelOpen((current) => !current)}
                >
                  {isAlertPanelOpen ? "Thu g\u1ECDn" : "Xem c\u1EA3nh b\u00E1o"}
                </button>
              </div>
              {isAlertPanelOpen ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {alerts.map((alert) => (
                    <div key={alert} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                      {alert}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <StageEntryView
            isVisible={isStageEntry}
            query={stageEntryQuery}
            onQueryChange={setStageEntryQuery}
            filteredOrders={stageEntryFilteredOrders}
            selectedOrderCode={stageEntryOrderCode}
            onSelectOrder={setStageEntryOrderCode}
            selectedSummary={stageEntryOrderSummary}
            stageOptions={stageOptionsForDropdown}
            entriesByStage={stageEntriesByStage}
            workers={workers}
            lossStatusOptions={movementLossStatusOptions}
            onRecord={recordStageEntry}
            onDeleteEntry={removeOrder}
          />

          <AuditLogView isVisible={isAudit} events={auditEvents} />

          <div className={`${isPricing || isSettings ? "unified-stack" : "hidden"} pb-8 pt-5`}>
            <PriceTableView isVisible={isPricing} rows={priceRows} />

            <MasterDataProvider
              value={{
                materials,
                workers,
                stages,
                referenceOptions,
                appUsers,
                referenceListKeys,
                currentUserId: appUser?.id,
                materialDraft: masterData.materialDraft,
                workerDraft: masterData.workerDraft,
                stageDraft: masterData.stageDraft,
                referenceDraft: masterData.referenceDraft,
                appUserDraft: masterData.appUserDraft,
                referenceListKey: masterData.referenceListKey,
                setMaterialDraft: masterData.setMaterialDraft,
                setWorkerDraft: masterData.setWorkerDraft,
                setStageDraft: masterData.setStageDraft,
                setReferenceDraft: masterData.setReferenceDraft,
                setAppUserDraft: masterData.setAppUserDraft,
                onChangeReferenceListKey: masterData.changeReferenceListKey,
                onAddMaterial: masterData.addMaterial,
                onAddWorker: masterData.addWorker,
                onAddStage: masterData.addStage,
                onAddReferenceOption: masterData.addReferenceOption,
                onAddAppUser: masterData.addAppUser,
                editingWorkerId: masterData.editingWorkerId,
                editingMaterialId: masterData.editingMaterialId,
                editingStageId: masterData.editingStageId,
                editingReferenceId: masterData.editingReferenceId,
                editingAppUserId: masterData.editingAppUserId,
                onStartEditWorker: masterData.startEditWorker,
                onCancelEditWorker: masterData.cancelEditWorker,
                onDeleteWorker: masterData.removeWorker,
                onStartEditMaterial: masterData.startEditMaterial,
                onCancelEditMaterial: masterData.cancelEditMaterial,
                onDeleteMaterial: masterData.removeMaterial,
                onStartEditStage: masterData.startEditStage,
                onCancelEditStage: masterData.cancelEditStage,
                onDeleteStage: masterData.removeStage,
                onStartEditReferenceOption: masterData.startEditReferenceOption,
                onCancelEditReferenceOption: masterData.cancelEditReferenceOption,
                onDeleteReferenceOption: masterData.removeReferenceOption,
                onStartEditAppUser: masterData.startEditAppUser,
                onCancelEditAppUser: masterData.cancelEditAppUser,
                onDeleteAppUser: masterData.removeAppUser
              }}
            >
              <MasterDataSettingsView isVisible={isSettings} />
            </MasterDataProvider>
          </div>
      {renderProductionFormOverlay()}
    </AppShell>
  );
}
