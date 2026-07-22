"use client";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileWarning,
  History,
  ListChecks,
  Plus,
  Scale,
  Settings2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  DetailGroup,
  DetailInlineList,
  DrawerSection,
  FieldShell,
  InfoMetric,
  SelectControl,
  fieldControlClass
} from "@/components/production-ui";
import {
  deliveryStatusClass,
  formatGram,
  hasMeaningfulText,
  isClosedStatus,
  pickNumber,
  pickText,
  statusClass,
  statusOptions
} from "@/lib/production-helpers";
import type { AuditEvent, OrderSummary, ProductionOrderHeader } from "@/lib/production-types";
import {
  createEmptyOrder,
  createEmptyProductionOrderHeaderDraft,
  mergeMovementWithContext,
} from "@/lib/production-mappers";
import { referenceListKeys } from "@/lib/master-data-drafts";
import {
  buildDraftStageMovements,
  buildLossReportRows,
  buildOrderSummaries,
  buildStageOptionsForDropdown,
  buildStageProgress,
  computeMovementTotals,
  selectMovementsForOrder
} from "@/lib/production-summary";
import {
  ALL_CODE_MONTHS_FILTER,
  ALL_DESTINATIONS_FILTER,
  buildOrderCodeMonthOptions,
  buildProductionOverview,
  buildSelectedOrderDetail,
  filterJournalOrders,
  filterProductionSummaries
} from "@/lib/production-workflow";
import { LossReportView } from "@/components/loss-report-view";
import { StageEntryView } from "@/components/stage-entry-view";
import { AuditLogView } from "@/components/audit-log-view";
import { MasterDataSettingsView } from "@/components/master-data-settings-view";
import { MasterDataProvider } from "@/components/master-data-context";
import { MaterialJournalView } from "@/components/material-journal-view";
import { MaterialMovementDrawer } from "@/components/material-movement-drawer";
import { ProductionOrdersView } from "@/components/production-orders-view";
import { useMasterDataCrud } from "@/components/use-master-data-crud";
import { useMaterialMovements } from "@/components/use-material-movements";
import { useOperationalData } from "@/components/use-operational-data";
import { useProductionOrders } from "@/components/use-production-orders";
import { PriceTableView } from "@/components/price-table-view";
import { WorkerBoxView } from "@/components/worker-box-view";
import { buildWorkerBoxLinesFromMovements } from "@/lib/worker-box-service";
import {
  alerts,
  kpis,
  priceRows,
  productionOrders,
  Status,
  type ProductionOrder
} from "@/lib/demo-data";
import {
  journalStages,
  mainJournalStageCodes,
  movementLossStatusOptions,
  productionOrderDeliveryStatusOptions,
  productionOrderDestinations,
  productionOrderMaterialSpecOptions,
  productionOrderSalesTypeOptions,
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

const storageKey = "qlkt-k2-material-orders";
const productionOrderHeaderKey = "qlkt-k2-production-order-headers";
const auditKey = "qlkt-k2-audit-events";
const movementDraftCacheKey = "qlkt-k2-movement-draft-cache";
const productionHeaderDraftCacheKey = "qlkt-k2-production-header-draft-cache";

function normalizeStageCode(stage: string) {
  return normalizeProductionStageCode(stage);
}

const moduleSlugs: Record<string, string> = {
  "Dashboard": "/",
  "Lệnh sản xuất": "/lenh-san-xuat",
  "Nhật ký NVL": "/nhat-ky-nvl",
  "Ghi nhận công đoạn": "/ghi-nhan-cong-doan",
  "Giá & định mức": "/gia-dinh-muc",
  "Tồn hộp thợ": "/ton-hop-tho",
  "Báo cáo hao hụt": "/bao-cao-hao-hut",
  "Audit log": "/audit-log",
  "Cấu hình": "/cau-hinh"
};

const pathToModule: Record<string, string> = Object.fromEntries(
  Object.entries(moduleSlugs).map(([label, path]) => [path, label])
);

export function MaterialDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const activeModule = pathToModule[pathname] ?? "Dashboard";

  function setActiveModule(label: string) {
    const path = moduleSlugs[label] ?? "/";
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

  const filteredOrders = useMemo(() => filterJournalOrders(orders, { query, status }), [orders, query, status]);

  const orderSummaries = useMemo(() => buildOrderSummaries(orders, productionHeaders), [orders, productionHeaders]);

  // State + handler cua man "Lenh san xuat" (form header LSX) da tach ra hook rieng.
  const {
    productionHeaderDraft,
    setProductionHeaderDraft,
    editingProductionCode,
    setEditingProductionCode,
    updateProductionHeaderDraft,
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
    return filteredOrderSummaries.find((item) => item.code === selectedOrderCode) ?? filteredOrderSummaries[0] ?? null;
  }, [filteredOrderSummaries, selectedOrderCode]);

  useEffect(() => {
    if (!isProductionDetailOpen || !selectedOrderSummary) return;

    if (isClosedStatus(selectedOrderSummary.status)) {
      setEditingProductionCode(null);
      return;
    }

    setEditingProductionCode(selectedOrderSummary.code);
    setProductionHeaderDraft(buildProductionHeaderDraftFromSummary(selectedOrderSummary));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductionDetailOpen, selectedOrderSummary?.code, selectedOrderSummary?.status]);

  const selectedOrderMovements = useMemo(
    () => selectMovementsForOrder(orders, selectedOrderSummary?.code),
    [orders, selectedOrderSummary]
  );

  const selectedOrderMovementStats = useMemo(() => computeMovementTotals(selectedOrderMovements), [selectedOrderMovements]);

  const selectedOrderDetail = useMemo(
    () => buildSelectedOrderDetail(selectedOrderSummary, selectedOrderMovements, productionHeaders),
    [productionHeaders, selectedOrderMovements, selectedOrderSummary]
  );

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
    savedMovementNotice,
    dismissSavedMovementNotice
  } = useMaterialMovements({
    orders,
    workers,
    stageRules,
    movementDraftCache,
    setOrders,
    setMovementDraftCache,
    setSelectedOrderCode,
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

  const draftStageMovements = useMemo(
    () => buildDraftStageMovements(orders, draft.code),
    [orders, draft.code]
  );

  // Tat ca giao dich da ghi nhan cho DUNG (LSX + khau) dang chon trong
  // drawer - dung de hien danh sach tho da them cho khau nhieu tho.
  const currentDrawerStageMovements = useMemo(() => {
    const code = draft.code.trim();
    const stageCode = normalizeProductionStageCode(draft.stage);
    if (!code || !stageCode) return [];
    return orders
      .filter((order) => order.code === code && normalizeProductionStageCode(order.stage) === stageCode)
      .sort((left, right) => String(right.id).localeCompare(String(left.id)));
  }, [orders, draft.code, draft.stage]);

  const selectedOrderStageProgress = useMemo(
    () => buildStageProgress(stageOptionsForDropdown, selectedOrderMovements),
    [stageOptionsForDropdown, selectedOrderMovements]
  );

  const stageEntryFilteredOrders = useMemo(() => {
    const normalizedQuery = stageEntryQuery.trim().toLowerCase();
    if (!normalizedQuery) return orderSummaries.slice(0, 30);
    return orderSummaries
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

  function selectProductionOrder(code: string) {
    setSelectedOrderCode(code);
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
    if (!isProductionFormOpen || editingProductionCode) return null;

    return (
      <div className="fixed inset-0 z-40 bg-ink/35 px-4 py-6 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-7xl items-start justify-center">
          <div className="section-card flex max-h-full w-full flex-col overflow-hidden border-emerald-200 bg-emerald-50/95">
            <div className="flex items-start justify-between gap-4 border-b border-emerald-200 px-5 py-4">
              <div>
                <h4 className="font-bold text-ink">{editingProductionCode ? "Cập nhật lệnh sản xuất" : "Tạo lệnh sản xuất mới"}</h4>
                <p className="mt-1 text-sm text-zinc-700">
                  {editingProductionCode
                    ? "Chỉnh sửa thông tin gốc của LSX. Trạng thái vận hành và tiến độ thực tế sẽ tiếp tục cập nhật trong Nhật ký NVL."
                    : "Tạo thông tin gốc cho LSX tại đây. Sau khi lưu, user sẽ cập nhật xuất, nhập, chuyển và trạng thái trong Nhật ký NVL."}
                </p>
              </div>
              <button className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-zinc-700" type="button" onClick={cancelProductionHeaderEdit} title="Đóng form">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="rounded-md border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-zinc-700">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-ink">Form thông tin gốc của lệnh sản xuất</p>
                    <p className="mt-1">
                      Màn này chỉ nhập thông tin đầu đơn. Phần xuất, nhập, chuyển và trạng thái vận hành sẽ cập nhật trong Nhật ký NVL.
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[productionHeaderDraft.deliveryStatus] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                    Trạng thái LSX: {productionHeaderDraft.deliveryStatus || "-"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-line bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin đầu đơn</p>
                <div className="mt-3 grid grid-cols-12 gap-3">
                  <div className="col-span-12 xl:col-span-3">
                    <FieldShell label="Mã LSX" hint="Mã định danh của lệnh sản xuất.">
                  <input
                    className={fieldControlClass}
                    placeholder="VD: DHAG-260713"
                    value={productionHeaderDraft.code}
                    onChange={(event) => updateProductionHeaderDraft("code", event.target.value)}
                  />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 xl:col-span-3">
                    <FieldShell label="Mã hàng" hint="Mã sản phẩm/chủng loại cần sản xuất.">
                  <input
                    className={fieldControlClass}
                    placeholder="VD: RG750Y"
                    value={productionHeaderDraft.sku}
                    onChange={(event) => updateProductionHeaderDraft("sku", event.target.value)}
                  />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 xl:col-span-3">
                    <FieldShell label="Tên hàng / diễn giải">
                  <input
                    className={fieldControlClass}
                    placeholder="VD: Nhẫn vàng 18K"
                    value={productionHeaderDraft.productName}
                    onChange={(event) => updateProductionHeaderDraft("productName", event.target.value)}
                  />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-2">
                    <FieldShell label="Nơi nhận" hint="Bộ phận hoặc nơi tiếp nhận lệnh.">
                      <SelectControl value={productionHeaderDraft.destination} onChange={(value) => updateProductionHeaderDraft("destination", value)}>
                        {getDynamicOptions("lsx_noi_nhan", productionOrderDestinations).map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-1">
                    <FieldShell label="Số lượng" hint="Số viên/sợi/sản phẩm theo đơn hàng.">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    placeholder="0"
                    value={productionHeaderDraft.qtyPiece || ""}
                    onChange={(event) => updateProductionHeaderDraft("qtyPiece", Number(event.target.value))}
                  />
                    </FieldShell>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-4 xl:col-span-2">
                    <FieldShell label="Tháng">
                  <input
                    className={fieldControlClass}
                    type="month"
                    value={productionHeaderDraft.orderMonth}
                    onChange={(event) => updateProductionHeaderDraft("orderMonth", event.target.value)}
                  />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-4 xl:col-span-2">
                    <FieldShell label="SR/KH">
                      <SelectControl value={productionHeaderDraft.salesType} onChange={(value) => updateProductionHeaderDraft("salesType", value)}>
                        {productionOrderSalesTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-4 xl:col-span-3">
                    <FieldShell label="Khách hàng">
                  <input
                    className={fieldControlClass}
                    placeholder="Tên khách hàng"
                    value={productionHeaderDraft.customerName}
                    onChange={(event) => updateProductionHeaderDraft("customerName", event.target.value)}
                  />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Trạng thái LSX">
                      <SelectControl value={productionHeaderDraft.deliveryStatus} onChange={(value) => updateProductionHeaderDraft("deliveryStatus", value)}>
                        {productionOrderDeliveryStatusOptions.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-2">
                    <FieldShell label="SL đã giao">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    placeholder="0"
                    value={productionHeaderDraft.deliveredQty || ""}
                    onChange={(event) => updateProductionHeaderDraft("deliveredQty", Number(event.target.value))}
                  />
                    </FieldShell>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-line bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin lệnh sản xuất</p>
                <div className="mt-3 grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Ngày đặt hàng">
                    <input
                      className={fieldControlClass}
                      type="date"
                      value={productionHeaderDraft.orderDate}
                      onChange={(event) => updateProductionHeaderDraft("orderDate", event.target.value)}
                    />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Ngày kế hoạch" hint="Ngày dự kiến bắt đầu/ghi nhận LSX.">
                    <input
                      className={fieldControlClass}
                      type="date"
                      value={productionHeaderDraft.plannedDate}
                      onChange={(event) => updateProductionHeaderDraft("plannedDate", event.target.value)}
                    />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="NVL dự kiến">
                      <SelectControl value={productionHeaderDraft.plannedMaterial} onChange={(value) => updateProductionHeaderDraft("plannedMaterial", value)}>
                        {materials.map((material) => (
                          <option key={material.id} value={material.name}>{material.code} - {material.name}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Loại nguyên liệu">
                      <SelectControl value={productionHeaderDraft.materialSpec} onChange={(value) => updateProductionHeaderDraft("materialSpec", value)}>
                        {getDynamicOptions("loai_nguyen_lieu", productionOrderMaterialSpecOptions).map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Deadline đơn hàng">
                    <input
                      className={fieldControlClass}
                      type="date"
                      value={productionHeaderDraft.deadlineDate}
                      onChange={(event) => updateProductionHeaderDraft("deadlineDate", event.target.value)}
                    />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Ngày HT">
                    <input
                      className={fieldControlClass}
                      type="date"
                      value={productionHeaderDraft.completedDate}
                      onChange={(event) => updateProductionHeaderDraft("completedDate", event.target.value)}
                    />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 xl:col-span-4">
                    <FieldShell label="Quy cách (Độ dài/Đường kính)">
                    <input
                      className={fieldControlClass}
                      placeholder="VD: 1.2mm / 16cm"
                      value={productionHeaderDraft.specification}
                      onChange={(event) => updateProductionHeaderDraft("specification", event.target.value)}
                    />
                    </FieldShell>
                  </div>
                  <div className="col-span-12 xl:col-span-2">
                    <FieldShell label="TL hoàn tất (GR)">
                    <input
                      className={fieldControlClass}
                      min="0"
                      type="number"
                      placeholder="0.00"
                      value={productionHeaderDraft.completedWeightGram || ""}
                      onChange={(event) => updateProductionHeaderDraft("completedWeightGram", Number(event.target.value))}
                    />
                    </FieldShell>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
                  <FieldShell label="Diễn giải tiến độ thực">
                    <textarea
                      className={`${fieldControlClass} min-h-20 resize-y`}
                      placeholder="Mô tả tiến độ thực tế, vướng mắc hoặc kết quả giao hàng"
                      value={productionHeaderDraft.actualProgressNote}
                      onChange={(event) => updateProductionHeaderDraft("actualProgressNote", event.target.value)}
                    />
                  </FieldShell>
                  <div className="rounded-md border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm leading-6 text-zinc-600">
                    Sau khi lưu LSX, phần xuất, nhập, chuyển, hao hụt và trạng thái vận hành sẽ được cập nhật trong <strong>Nhật ký NVL</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-emerald-200 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-emerald-900">
                Sau khi tạo LSX, chuyển sang Nhật ký NVL để cập nhật phát sinh và trạng thái vận hành.
              </p>
              <div className="flex gap-2">
                <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink" type="button" onClick={cancelProductionHeaderEdit}>
                  Hủy
                </button>
                <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="button" onClick={saveProductionHeader}>
                  Lưu LSX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderInlineProductionEditForm() {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-zinc-700">
          Trạng thái vận hành và tiến độ thực tế sẽ tiếp tục cập nhật trong Nhật ký NVL.
        </div>

        <div className="rounded-md border border-line bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin đầu đơn</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FieldShell label="Mã LSX">
              <input
                className={fieldControlClass}
                value={productionHeaderDraft.code}
                onChange={(event) => updateProductionHeaderDraft("code", event.target.value)}
              />
            </FieldShell>
            <FieldShell label="Mã hàng">
              <input
                className={fieldControlClass}
                value={productionHeaderDraft.sku}
                onChange={(event) => updateProductionHeaderDraft("sku", event.target.value)}
              />
            </FieldShell>
            <div className="col-span-2">
              <FieldShell label="Tên hàng / diễn giải">
                <input
                  className={fieldControlClass}
                  value={productionHeaderDraft.productName}
                  onChange={(event) => updateProductionHeaderDraft("productName", event.target.value)}
                />
              </FieldShell>
            </div>
            <FieldShell label="Nơi nhận">
              <SelectControl value={productionHeaderDraft.destination} onChange={(value) => updateProductionHeaderDraft("destination", value)}>
                {getDynamicOptions("lsx_noi_nhan", productionOrderDestinations).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <FieldShell label="Số lượng">
              <input
                className={fieldControlClass}
                min="0"
                type="number"
                value={productionHeaderDraft.qtyPiece || ""}
                onChange={(event) => updateProductionHeaderDraft("qtyPiece", Number(event.target.value))}
              />
            </FieldShell>
            <FieldShell label="Khách hàng">
              <input
                className={fieldControlClass}
                value={productionHeaderDraft.customerName}
                onChange={(event) => updateProductionHeaderDraft("customerName", event.target.value)}
              />
            </FieldShell>
            <FieldShell label="SR/KH">
              <SelectControl value={productionHeaderDraft.salesType} onChange={(value) => updateProductionHeaderDraft("salesType", value)}>
                {productionOrderSalesTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <FieldShell label="Trạng thái LSX">
              <SelectControl value={productionHeaderDraft.deliveryStatus} onChange={(value) => updateProductionHeaderDraft("deliveryStatus", value)}>
                {productionOrderDeliveryStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <FieldShell label="SL đã giao">
              <input
                className={fieldControlClass}
                min="0"
                type="number"
                value={productionHeaderDraft.deliveredQty || ""}
                onChange={(event) => updateProductionHeaderDraft("deliveredQty", Number(event.target.value))}
              />
            </FieldShell>
          </div>
        </div>

        <div className="rounded-md border border-line bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Kế hoạch sản xuất</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FieldShell label="Ngày kế hoạch">
              <input
                className={fieldControlClass}
                type="date"
                value={productionHeaderDraft.plannedDate}
                onChange={(event) => updateProductionHeaderDraft("plannedDate", event.target.value)}
              />
            </FieldShell>
            <FieldShell label="Deadline đơn hàng">
              <input
                className={fieldControlClass}
                type="date"
                value={productionHeaderDraft.deadlineDate}
                onChange={(event) => updateProductionHeaderDraft("deadlineDate", event.target.value)}
              />
            </FieldShell>
            <FieldShell label="NVL dự kiến">
              <SelectControl value={productionHeaderDraft.plannedMaterial} onChange={(value) => updateProductionHeaderDraft("plannedMaterial", value)}>
                {materials.map((material) => (
                  <option key={material.id} value={material.name}>{material.code} - {material.name}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <FieldShell label="Loại nguyên liệu">
              <SelectControl value={productionHeaderDraft.materialSpec} onChange={(value) => updateProductionHeaderDraft("materialSpec", value)}>
                {getDynamicOptions("loai_nguyen_lieu", productionOrderMaterialSpecOptions).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <FieldShell label="Ngày HT">
              <input
                className={fieldControlClass}
                type="date"
                value={productionHeaderDraft.completedDate}
                onChange={(event) => updateProductionHeaderDraft("completedDate", event.target.value)}
              />
            </FieldShell>
            <FieldShell label="TL hoàn tất (GR)">
              <input
                className={fieldControlClass}
                min="0"
                type="number"
                value={productionHeaderDraft.completedWeightGram || ""}
                onChange={(event) => updateProductionHeaderDraft("completedWeightGram", Number(event.target.value))}
              />
            </FieldShell>
            <div className="col-span-2">
              <FieldShell label="Quy cách (Độ dài/Đường kính)">
                <input
                  className={fieldControlClass}
                  value={productionHeaderDraft.specification}
                  onChange={(event) => updateProductionHeaderDraft("specification", event.target.value)}
                />
              </FieldShell>
            </div>
          </div>
          <div className="mt-3">
            <FieldShell label="Diễn giải tiến độ thực">
              <textarea
                className={`${fieldControlClass} min-h-20 resize-y`}
                value={productionHeaderDraft.actualProgressNote}
                onChange={(event) => updateProductionHeaderDraft("actualProgressNote", event.target.value)}
              />
            </FieldShell>
          </div>
        </div>
      </div>
    );
  }

  function prepareMovementForSummary(summary: OrderSummary | null, stageOverride?: string) {
    if (!summary) return;
    const cachedDraft = movementDraftCache[summary.code];
    const latestMovement = orders.find((order) => order.code === summary.code);
    const headerFallback = productionHeaders.find((header) => header.code === summary.code);

    setDraft((current) => {
      const baseDraft = mergeMovementWithContext(
        cachedDraft ?? latestMovement ?? current,
        cachedDraft,
        headerFallback
      );

      return {
      ...baseDraft,
      code: summary.code,
      sku: summary.sku,
      productName: pickText(baseDraft.productName, summary.productName),
      destination: pickText(baseDraft.destination, summary.destination),
      documentNo: pickText(baseDraft.documentNo, summary.documentNo),
      documentInNo: pickText(baseDraft.documentInNo, summary.documentInNo),
      documentLineNo: pickText(baseDraft.documentLineNo, summary.documentLineNo),
      movementType: summary.movementType ?? baseDraft.movementType,
      qtyPiece: pickNumber(baseDraft.qtyPiece, summary.qtyPiece),
      occurredDate: pickText(baseDraft.occurredDate, summary.occurredDate, summary.plannedDate),
      stage: stageOverride || pickText(baseDraft.stage, summary.plannedStage),
      stageStatus: baseDraft.stageStatus || "Đang thực hiện",
      worker: stageOverride
        ? pickText(
            selectedOrderMovements.find((movement) => normalizeProductionStageCode(movement.stage) === stageOverride)?.worker,
            baseDraft.worker,
            summary.plannedWorker
          )
        : pickText(baseDraft.worker, summary.plannedWorker),
      material: pickText(baseDraft.material, summary.plannedMaterial, summary.materials[0]),
      issued: pickNumber(baseDraft.issued, summary.issuedDefault),
      returned: pickNumber(baseDraft.returned, summary.returnedDefault),
      powder: pickNumber(baseDraft.powder, summary.powderDefault),
      transferred: pickNumber(baseDraft.transferred, summary.transferred),
      lossPeriod: pickText(baseDraft.lossPeriod, summary.lossPeriod),
      nxtPeriod: pickText(baseDraft.nxtPeriod, summary.nxtPeriod),
      goldAge: pickNumber(baseDraft.goldAge, summary.plannedGoldAge),
      sourceMaterialName: pickText(baseDraft.sourceMaterialName, summary.sourceMaterialName),
      sourceName: pickText(baseDraft.sourceName, summary.sourceName),
      importSource: pickText(baseDraft.importSource, summary.importSource),
      exportSource: pickText(baseDraft.exportSource, summary.exportSource),
      nxtLinkCode: pickText(baseDraft.nxtLinkCode, summary.nxtLinkCode),
      convertedIssueWeight: pickNumber(baseDraft.convertedIssueWeight, summary.convertedIssueWeight),
      convertedReturnWeight: pickNumber(baseDraft.convertedReturnWeight, summary.convertedReturnWeight),
      status: summary.status === "Đã chốt" ? "Treo nợ" : summary.status
    };
    });
    setSelectedOrderCode(summary.code);
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

    const seed = buildSeedMovementFromSummary(stageEntryOrderSummary);
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

  function buildSeedMovementFromSummary(summary: OrderSummary): ProductionOrder {
    const headerFallback = productionHeaders.find((header) => header.code === summary.code);
    const baseDraft = mergeMovementWithContext(createEmptyOrder(), undefined, headerFallback);

    return {
      ...baseDraft,
      code: summary.code,
      sku: summary.sku,
      productName: pickText(summary.productName, headerFallback?.productName),
      destination: pickText(summary.destination, headerFallback?.destination, baseDraft.destination),
      documentNo: pickText(summary.documentNo, headerFallback?.documentNo),
      documentInNo: pickText(summary.documentInNo, headerFallback?.documentInNo),
      documentLineNo: pickText(summary.documentLineNo, headerFallback?.documentLineNo),
      movementType: summary.movementType ?? baseDraft.movementType,
      qtyPiece: pickNumber(summary.qtyPiece, headerFallback?.qtyPiece, baseDraft.qtyPiece),
      occurredDate: pickText(summary.occurredDate, summary.plannedDate, headerFallback?.occurredDate, headerFallback?.plannedDate, baseDraft.occurredDate),
      stage: pickText(summary.plannedStage, headerFallback?.plannedStage, baseDraft.stage),
      stageStatus: "Đang thực hiện",
      worker: pickText(summary.plannedWorker, headerFallback?.plannedWorker, baseDraft.worker),
      material: pickText(summary.plannedMaterial, headerFallback?.plannedMaterial, summary.materials[0], baseDraft.material),
      issued: pickNumber(summary.issuedDefault, headerFallback?.issued, 0),
      returned: pickNumber(summary.returnedDefault, headerFallback?.returned, 0),
      powder: pickNumber(summary.powderDefault, headerFallback?.powder, 0),
      transferred: pickNumber(summary.transferred, headerFallback?.transferred, 0),
      lossPeriod: pickText(summary.lossPeriod, headerFallback?.lossPeriod, baseDraft.lossPeriod),
      nxtPeriod: pickText(summary.nxtPeriod, headerFallback?.nxtPeriod, baseDraft.nxtPeriod),
      goldAge: pickNumber(summary.plannedGoldAge, headerFallback?.plannedGoldAge, baseDraft.goldAge),
      sourceMaterialName: pickText(summary.sourceMaterialName, headerFallback?.sourceMaterialName, baseDraft.sourceMaterialName),
      sourceName: pickText(summary.sourceName, headerFallback?.sourceName, baseDraft.sourceName),
      importSource: pickText(summary.importSource, headerFallback?.importSource, baseDraft.importSource),
      exportSource: pickText(summary.exportSource, headerFallback?.exportSource, baseDraft.exportSource),
      materialType: pickText(summary.plannedMaterialType, headerFallback?.plannedMaterialType, baseDraft.materialType),
      nxtLinkCode: pickText(summary.nxtLinkCode, headerFallback?.nxtLinkCode, baseDraft.nxtLinkCode),
      convertedIssueWeight: pickNumber(summary.convertedIssueWeight, headerFallback?.convertedIssueWeight, 0),
      convertedReturnWeight: pickNumber(summary.convertedReturnWeight, headerFallback?.convertedReturnWeight, 0),
      status: "Đang xử lý"
    };
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
        const seedMovement = buildSeedMovementFromSummary(selectedOrderSummary);
        const savedSeed = isSupabaseConfigured ? await createMaterialMovement(seedMovement) : seedMovement;
        setOrders((current) => [savedSeed, ...current.filter((item) => item.id !== savedSeed.id)]);
        setSelectedOrderCode(savedSeed.code);
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
      code: buildUniqueProductionOrderCode("DHAG", emptyDraft.occurredDate || toIsoDate(), orderSummaries.map((summary) => summary.code)),
      sku: selectedOrderSummary.sku || "",
      productName: selectedOrderSummary.productName || "",
      customerName: selectedOrderSummary.customerName || "",
      salesType: selectedOrderSummary.salesType || ""
    });
    setIsProductionFormOpen(true);
  }


  const navItems = [
    ["Dashboard", ClipboardList],
    ["Lệnh sản xuất", Boxes],
    ["Nhật ký NVL", Scale],
    ["Ghi nhận công đoạn", ListChecks],
    ["Giá & định mức", CircleDollarSign],
    ["Tồn hộp thợ", Boxes],
    ["Báo cáo hao hụt", FileWarning],
    ["Audit log", History],
    ["Cấu hình", Settings2]
  ] as const;

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
  const visibleNavItems = isAdmin ? navItems : navItems.filter(([label]) => label !== "Cấu hình");

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
    <main className="min-h-screen">
      {remoteError ? (
        <div className="fixed right-4 top-4 z-[100] w-full max-w-sm">
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 shadow-lg">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Có lỗi xảy ra</p>
              <p className="mt-1 text-sm text-red-700">{remoteError}</p>
            </div>
            <button
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-red-700 hover:bg-red-100"
              type="button"
              onClick={() => setRemoteError(null)}
              title="Đóng thông báo lỗi"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}
      <div className="shell-grid min-h-screen">
        <aside className="border-r border-line bg-[#ece6de] px-5 py-6">
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide text-ink">ASIANA GOLD</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">QLKT K2</p>
          </div>

          <nav className="mt-8 space-y-0.5">
            {visibleNavItems.map(([label, Icon]) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                  activeModule === label
                    ? "border-ink font-semibold text-ink"
                    : "border-transparent text-zinc-500 hover:border-line hover:text-ink"
                }`}
                type="button"
                onClick={() => setActiveModule(label)}
              >
                <Icon size={16} className={activeModule === label ? "text-ink" : "text-zinc-400"} />
                {label}
              </button>
            ))}
          </nav>

          {isLoadingRemote ? (
            <p className="mt-8 text-xs font-semibold text-brass">Đang tải dữ liệu...</p>
          ) : null}

          {appUser ? (
            <div className="mt-8 border-t border-line pt-4">
              <p className="truncate text-sm font-medium text-ink">{appUser.full_name || appUser.email}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{isAdmin ? "Quản trị viên" : "Nhân viên"}</p>
              <button
                className="mt-2 text-xs font-semibold text-zinc-500 underline hover:text-ink"
                type="button"
                onClick={signOut}
              >
                Đăng xuất
              </button>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 px-5 py-5 md:px-8">
          <div className="content-shell">
          <header className="border-b border-line pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quản trị sản xuất</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
              {activeModule === "Dashboard" ? "Tổng quan" : activeModule}
            </h2>
          </header>

          <div className={`${isDashboard ? "grid" : "hidden"} gap-4 py-5 sm:grid-cols-2 xl:grid-cols-4`}>
            {kpis.map((item) => (
              <article key={item.label} className="rounded-md border border-line bg-white/92 p-4 shadow-sm">
                <p className="text-sm font-medium text-zinc-600">{item.label}</p>
                <div className="mt-3 flex items-end gap-2">
                  <strong className="text-2xl font-bold text-ink">{item.value}</strong>
                  <span className="pb-1 text-sm text-zinc-500">{item.unit}</span>
                </div>
                <p className="mt-3 text-xs font-medium text-brass">{item.trend}</p>
              </article>
            ))}
          </div>

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

          <section className={`${isDashboard ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">Bảng điều hành hôm nay</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Màn này chỉ giữ overview và việc ưu tiên. Các thao tác chi tiết chuyển sang từng phân hệ riêng.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                    type="button"
                    onClick={() => setActiveModule("Lệnh sản xuất")}
                  >
                    Mở màn LSX
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                    type="button"
                    onClick={() => setActiveModule("Nhật ký NVL")}
                  >
                    Mở NK NVL
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-sky-200 bg-sky-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">LSX đang xử lý</p>
                  <p className="mt-2 text-2xl font-bold text-sky-900">{productionOverview.inProgressCount}</p>
                  <p className="mt-2 text-sm text-zinc-700">Các lệnh đang có phát sinh vận hành trong ngày.</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">LSX quá hạn</p>
                  <p className="mt-2 text-2xl font-bold text-rose-900">{productionOverview.overdueCount}</p>
                  <p className="mt-2 text-sm text-zinc-700">Cần rà soát deadline và tiến độ giao hàng.</p>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <div className="rounded-md border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-ink">Giao dịch NVL gần đây</h4>
                      <p className="mt-1 text-xs text-zinc-500">Hiển thị nhanh các dòng vừa phát sinh để theo dõi tiến độ.</p>
                    </div>
                    <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                      {filteredOrders.length} dòng
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {filteredOrders.slice(0, 4).map((order) => (
                      <button
                        key={`dashboard-recent-${order.id ?? order.code ?? `${order.code}-${order.material}`}`}
                        className="flex w-full items-center justify-between rounded-md border border-line bg-white px-3 py-3 text-left hover:border-jade/60 hover:bg-emerald-50/40"
                        type="button"
                        onClick={() => setActiveModule("Nhật ký NVL")}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{order.code}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{order.material || "-"} · {order.worker || "Chưa phân công"}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600 ring-1 ring-line">
                          Xem lịch sử
                        </span>
                      </button>
                    ))}
                    {filteredOrders.length === 0 ? (
                      <div className="rounded-md border border-dashed border-line bg-white px-4 py-6 text-sm text-zinc-500">
                        Chưa có giao dịch NVL nào để hiển thị.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-md border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-ink">LSX cần theo dõi</h4>
                      <p className="mt-1 text-xs text-zinc-500">Giữ ở mức ngắn gọn để Dashboard không biến thành màn thao tác.</p>
                    </div>
                    <button
                      className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
                      type="button"
                      onClick={() => setActiveModule("Lệnh sản xuất")}
                    >
                      Xem toàn bộ
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {filteredOrderSummaries.slice(0, 4).map((summary) => (
                      <button
                        key={`dashboard-summary-${summary.code}`}
                        className="flex w-full items-center justify-between rounded-md border border-line bg-white px-3 py-3 text-left hover:border-jade/60 hover:bg-emerald-50/40"
                        type="button"
                        onClick={() => selectProductionOrder(summary.code)}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{summary.code}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{summary.plannedStage || "-"} · {summary.plannedWorker || "Chưa phân công"}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[summary.status]}`}>
                          {summary.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ProductionOrdersView
            isVisible={isProduction}
            productionOverview={productionOverview}
            filteredOrderSummaries={filteredOrderSummaries}
            selectedOrderCode={selectedOrderCode}
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
                code: buildUniqueProductionOrderCode("DHAG", emptyDraft.occurredDate || toIsoDate(), orderSummaries.map((summary) => summary.code))
              });
              setIsProductionFormOpen((current) => !current);
            }}
            onShowAllOrders={() => {
              setSelectedOrderCode(null);
              setIsProductionDetailOpen(false);
            }}
            onSelectOrder={selectProductionOrder}
          />

          {isProduction ? (
            <>
              {isProductionDetailOpen && !(isProductionFormOpen && !editingProductionCode) && selectedOrderDetail && selectedOrderSummary ? (
                <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm" onClick={() => setIsProductionDetailOpen(false)} />
              ) : null}
              <aside
                className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-white shadow-2xl transition-transform duration-200 ${
                  isProductionDetailOpen && !(isProductionFormOpen && !editingProductionCode) && selectedOrderDetail && selectedOrderSummary
                    ? "translate-x-0"
                    : "pointer-events-none translate-x-full"
                }`}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brass">Chi tiết LSX</p>
                    <h3 className="font-display mt-1 text-2xl font-semibold text-ink">
                      {selectedOrderSummary?.code || "Chi tiết LSX"}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {isEditingSelectedOrder
                        ? "Chỉnh sửa trực tiếp bên dưới, bấm Lưu LSX để lưu thay đổi."
                        : "LSX đã chốt nên chỉ xem, không thể chỉnh sửa thông tin gốc."}
                    </p>
                  </div>
                  <button
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
                    type="button"
                    onClick={() => setIsProductionDetailOpen(false)}
                    title="Đóng"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {selectedOrderDetail && selectedOrderSummary ? (
                    isEditingSelectedOrder ? (
                      renderInlineProductionEditForm()
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-md border border-line bg-paper p-4">
                          <div className="flex flex-col gap-3">
                            <div>
                              <h4 className="text-xl font-bold text-ink">{selectedOrderDetail.code}</h4>
                              <p className="mt-1 text-sm text-zinc-500">{selectedOrderDetail.sku}</p>
                              {selectedOrderDetail.productName ? <p className="mt-2 text-sm text-zinc-700">{selectedOrderDetail.productName}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[selectedOrderDetail.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                                Trạng thái LSX: {selectedOrderDetail.deliveryStatus || "-"}
                              </span>
                              <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[selectedOrderDetail.operationalStatus]}`}>
                                Trạng thái vận hành: {selectedOrderDetail.operationalStatus}
                              </span>
                              <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
                                {selectedOrderDetail.movementCount} giao dịch
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <InfoMetric label="Tổng xuất" value={formatGram(selectedOrderMovementStats.issued)} />
                          <InfoMetric label="Tổng nhập" value={formatGram(selectedOrderMovementStats.returned)} />
                          <InfoMetric label="Bột" value={formatGram(selectedOrderMovementStats.powder)} />
                          <InfoMetric label="Hao hụt" value={formatGram(selectedOrderMovementStats.loss)} />
                        </div>

                        <div className="grid gap-3 xl:grid-cols-2">
                          <DetailGroup
                            title="Tổng quan đơn"
                            items={[
                              ["Khách hàng", selectedOrderDetail.customerName || "-"],
                              ["Mã hàng", selectedOrderDetail.sku || "-"],
                              ["Số lượng", selectedOrderDetail.qtyPiece !== null ? String(selectedOrderDetail.qtyPiece) : "-"],
                              ["SR/KH", selectedOrderDetail.salesType || "-"]
                            ]}
                          />

                          <DetailGroup
                            title="Kế hoạch"
                            items={[
                              ["Ngày kế hoạch", formatDisplayDate(selectedOrderDetail.plannedDate) || "-"],
                              ["Deadline", formatDisplayDate(selectedOrderDetail.deadlineDate) || "-"],
                              ["Ngày HT", formatDisplayDate(selectedOrderDetail.completedDate) || "-"],
                              ["SL đã giao", selectedOrderDetail.deliveredQty !== null ? String(selectedOrderDetail.deliveredQty) : "-"]
                            ]}
                          />
                        </div>

                        <div className="rounded-md border border-line bg-paper p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vận hành hiện tại</p>
                            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                              {selectedOrderDetail.movementCount} giao dịch
                            </span>
                          </div>
                          <div className="mt-3">
                            <DetailInlineList
                              items={[
                                ["Nơi nhận", selectedOrderDetail.destination || "-"],
                                ["Công đoạn", selectedOrderDetail.stage || "-"],
                                ["Thợ", selectedOrderDetail.worker || "Chưa phân công"],
                                ["NVL dự kiến", selectedOrderDetail.plannedMaterial || "-"],
                                ["Loại nguyên liệu", selectedOrderDetail.materialSpec || "-"],
                                ["Tuổi vàng", selectedOrderDetail.goldAgeValue > 0 ? String(selectedOrderDetail.goldAgeValue) : "-"],
                                ["NVL đã phát sinh", selectedOrderDetail.movementMaterials.length ? selectedOrderDetail.movementMaterials.join(", ") : "Chưa có"],
                                ["Thợ đã nhận", selectedOrderDetail.movementWorkers.length ? selectedOrderDetail.movementWorkers.join(", ") : "Chưa có"]
                              ]}
                            />
                          </div>
                        </div>

                        <div className="rounded-md border border-line bg-paper p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến trình công đoạn</p>
                            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                              Đã qua {selectedOrderStageProgress.filter((item) => item.movementCount > 0).length}/{selectedOrderStageProgress.length} khâu
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {selectedOrderStageProgress.map((stage) => (
                              <div
                                key={stage.code}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                                  stage.isCurrent
                                    ? "border-jade bg-jade/10"
                                    : stage.movementCount > 0
                                      ? "border-line bg-white"
                                      : "border-dashed border-line/70 bg-transparent text-zinc-400"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                      stage.isCurrent
                                        ? "bg-jade text-white"
                                        : stage.movementCount > 0
                                          ? "bg-ink text-white"
                                          : "bg-zinc-200 text-zinc-500"
                                    }`}
                                  >
                                    {stage.movementCount > 0 ? "✓" : "•"}
                                  </span>
                                  <span className={`font-semibold ${stage.movementCount > 0 ? "text-ink" : "text-zinc-400"}`}>
                                    {stage.label}
                                  </span>
                                  {stage.isCurrent ? (
                                    <span className="rounded-full bg-jade px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                      Đang ở đây
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  {stage.movementCount > 0 ? (
                                    <div className="flex flex-wrap items-center gap-3 text-zinc-600">
                                      <span>Xuất {formatGram(stage.issued)}</span>
                                      <span>Nhập {formatGram(stage.returned)}</span>
                                      {stage.qtyPiece > 0 ? <span>SL {stage.qtyPiece}</span> : null}
                                      <span>{formatDisplayDate(stage.latestDate) || "-"}</span>
                                    </div>
                                  ) : (
                                    <span>Chưa thực hiện</span>
                                  )}
                                  <button
                                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-paper"
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openMovementForStage(stage.code);
                                    }}
                                  >
                                    + Cập nhật khâu này
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-md border border-line bg-paper p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến độ thực</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-700">
                            {selectedOrderDetail.actualProgressNote || "Chưa cập nhật diễn giải tiến độ."}
                          </p>
                        </div>

                        {isClosedStatus(selectedOrderSummary.status) ? (
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                            LSX đã chốt nên đang khóa thêm/sửa/xóa giao dịch để bảo vệ số liệu kế toán. Nếu có phát sinh mới, bấm "Mở lại LSX" bên dưới để chỉnh sửa, sau đó chốt lại.
                          </div>
                        ) : null}
                      </div>
                    )
                  ) : (
                    <div className="mt-6 rounded-md border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-zinc-500">
                      Chọn một LSX từ danh sách để xem chi tiết.
                    </div>
                  )}
                </div>

                {selectedOrderDetail && selectedOrderSummary ? (
                  <div className="shrink-0 space-y-2 border-t border-line bg-white px-5 py-4">
                    {isEditingSelectedOrder ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={saveProductionHeader}
                        >
                          Lưu LSX
                        </button>
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={viewSelectedOrderMovements}
                        >
                          Mở NK NVL
                        </button>
                        <button
                          className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white sm:col-span-2"
                          type="button"
                          onClick={closeSelectedProductionOrder}
                        >
                          Chốt LSX
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={viewSelectedOrderMovements}
                        >
                          Mở NK NVL
                        </button>
                        <button
                          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
                          type="button"
                          onClick={reopenSelectedProductionOrder}
                          title="Mở lại LSX để chỉnh sửa thông tin gốc khi có phát sinh mới"
                        >
                          Mở lại LSX
                        </button>
                      </div>
                    )}
                    <button
                      className="w-full rounded-md border border-dashed border-line bg-paper px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                      type="button"
                      onClick={startNewOrderForSameCustomer}
                      title="Tạo LSX mới, tự điền sẵn Khách hàng và SR/KH từ đơn đang xem"
                    >
                      + Tạo đơn mới cho khách này
                    </button>
                  </div>
                ) : null}
              </aside>
            </>
          ) : null}

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
          </div>
        </section>
      </div>
    </main>
  );
}
