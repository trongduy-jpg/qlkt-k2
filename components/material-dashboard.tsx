"use client";

import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileWarning,
  History,
  Plus,
  Scale,
  Settings2,
  Trash2,
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
  getSummaryStatus,
  hasMeaningfulText,
  isClosedStatus,
  pickNumber,
  pickText,
  statusClass,
  statusOptions,
  validateMovementDraft
} from "@/lib/production-helpers";
import type { AuditEvent, OrderSummary, ProductionOrderHeader } from "@/lib/production-types";
import {
  createEmptyOrder,
  createEmptyProductionOrderHeaderDraft,
  mapRemoteHeaderToProductionHeader,
  mergeMovementWithContext,
  mergeProductionHeaderWithDraft
} from "@/lib/production-mappers";
import {
  createEmptyAppUserDraft,
  createEmptyMaterialDraft,
  createEmptyReferenceDraft,
  createEmptyStageDraft,
  createEmptyWorkerDraft,
  referenceListKeys
} from "@/lib/master-data-drafts";
import {
  buildDraftStageMovements,
  buildOrderSummaries,
  buildStageOptionsForDropdown,
  buildStageProgress,
  computeMovementTotals,
  selectMovementsForOrder
} from "@/lib/production-summary";
import { AuditLogView } from "@/components/audit-log-view";
import { MasterDataSettingsView } from "@/components/master-data-settings-view";
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
  journalDestinations,
  journalStages,
  movementExportSourceOptions,
  movementGoldAgeOptions,
  movementImportSourceOptions,
  movementLossStatusOptions,
  movementStageStatusOptions,
  productionOrderDeliveryStatusOptions,
  productionOrderDestinations,
  productionOrderMaterialSpecOptions,
  productionOrderSalesTypeOptions,
  sourceMaterialOptions
} from "@/lib/production-journal-options";
import {
  applyProductionBusinessRules,
  buildProductionOrderCode,
  buildUniqueProductionOrderCode,
  formatDisplayDate,
  formatDisplayDateTime,
  getCarryOverLossPeriod,
  getStageLabel,
  isLargeWeightMovement,
  normalizeStageCode as normalizeProductionStageCode,
  shouldForceDirectCharge,
  toIsoDate,
  toMonthCode,
  type HaoHutRule
} from "@/lib/production-business-rules";
import {
  createAuditLog,
  createMaterial,
  createMaterialMovement,
  createProductionOrderHeader,
  createReferenceOption,
  createStage,
  createWorker,
  deleteMaterial,
  deleteMaterialMovement,
  deleteReferenceOption,
  deleteStage,
  deleteWorker,
  loadDatabaseHealth,
  loadMaterials,
  loadProductionOrderHeaders,
  loadProductionOrders,
  loadReferenceOptions,
  loadStages,
  loadWorkers,
  updateMaterial,
  updateReferenceOption,
  updateStage,
  updateWorker,
  updateProductionOrderStatus,
  updateProductionOrderHeader,
  updateMaterialMovement,
  updateMaterialMovementStatus,
  type DatabaseHealth,
  type MaterialMaster,
  type ReferenceOption,
  type StageMaster,
  type WorkerMaster
} from "@/lib/material-service";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  createAppUser,
  deleteAppUser,
  loadAppUsers,
  updateAppUser,
  type AppUser
} from "@/lib/auth-service";

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
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [isProductionDetailOpen, setIsProductionDetailOpen] = useState(false);
  const [orders, setOrders] = useState<ProductionOrder[]>(productionOrders);
  const [productionHeaders, setProductionHeaders] = useState<ProductionOrderHeader[]>([]);
  const [productionHeaderDraft, setProductionHeaderDraft] = useState<Omit<ProductionOrderHeader, "id" | "createdAt">>(createEmptyProductionOrderHeaderDraft());
  const [editingProductionCode, setEditingProductionCode] = useState<string | null>(null);
  const [recentCreatedOrderCode, setRecentCreatedOrderCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductionOrder>(createEmptyOrder());
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [movementDraftCache, setMovementDraftCache] = useState<Record<string, ProductionOrder>>({});
  const [productionHeaderDraftCache, setProductionHeaderDraftCache] = useState<
    Record<string, Omit<ProductionOrderHeader, "id" | "createdAt">>
  >({});
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [isMovementAdvancedOpen, setIsMovementAdvancedOpen] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [workers, setWorkers] = useState<WorkerMaster[]>([]);
  const [stages, setStages] = useState<StageMaster[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOption[]>([]);
  const [materialDraft, setMaterialDraft] = useState<Omit<MaterialMaster, "id">>(createEmptyMaterialDraft());
  const [workerDraft, setWorkerDraft] = useState<Omit<WorkerMaster, "id">>(createEmptyWorkerDraft());
  const [stageDraft, setStageDraft] = useState<Omit<StageMaster, "id">>(createEmptyStageDraft());
  const [referenceListKey, setReferenceListKey] = useState<string>(referenceListKeys[0].key);
  const [referenceDraft, setReferenceDraft] = useState<Omit<ReferenceOption, "id">>(createEmptyReferenceDraft(referenceListKeys[0].key));
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [appUserDraft, setAppUserDraft] = useState<Omit<AppUser, "id">>(createEmptyAppUserDraft());
  const [editingAppUserId, setEditingAppUserId] = useState<string | null>(null);

  async function reloadOperationalData(options?: {
    movementDraftOverrides?: Record<string, ProductionOrder>;
    productionHeaderDraftOverrides?: Record<string, Omit<ProductionOrderHeader, "id" | "createdAt">>;
  }) {
    if (!isSupabaseConfigured) return;

    const [remoteOrders, remoteHeaders, remoteMaterials, remoteWorkers, remoteStages, remoteReferenceOptions, remoteDatabaseHealth] = await Promise.all([
      loadProductionOrders(),
      loadProductionOrderHeaders(),
      loadMaterials(),
      loadWorkers(),
      loadStages(),
      loadReferenceOptions(),
      loadDatabaseHealth()
    ]);

    const mergedHeaderDrafts = {
      ...productionHeaderDraftCache,
      ...(options?.productionHeaderDraftOverrides ?? {})
    };
    const mappedHeaders = remoteHeaders
      .map(mapRemoteHeaderToProductionHeader)
      .map((header) => mergeProductionHeaderWithDraft(header, mergedHeaderDrafts[header.code]));
    const headerByCode = new Map(mappedHeaders.map((header) => [header.code, header]));
    const headerById = new Map(mappedHeaders.map((header) => [header.id, header]));
    const mergedMovementDrafts = {
      ...movementDraftCache,
      ...(options?.movementDraftOverrides ?? {})
    };
    const mappedOrders = remoteOrders.map((order) => {
      const headerMatch = order.code ? headerByCode.get(order.code) : undefined;
      const headerFromId = !headerMatch && order.orderId ? headerById.get(order.orderId) : undefined;
      const resolvedOrder =
        headerFromId && !order.code
          ? {
              ...order,
              code: headerFromId.code,
              sku: pickText(order.sku, headerFromId.sku),
              productName: pickText(order.productName, headerFromId.productName),
              destination: pickText(order.destination, headerFromId.destination),
              occurredDate: pickText(order.occurredDate, headerFromId.occurredDate, headerFromId.plannedDate),
              documentNo: pickText(order.documentNo, headerFromId.documentNo),
              documentInNo: pickText(order.documentInNo, headerFromId.documentInNo),
              documentLineNo: pickText(order.documentLineNo, headerFromId.documentLineNo),
              qtyPiece: pickNumber(order.qtyPiece, headerFromId.qtyPiece)
            }
          : order;

      const resolvedHeader = headerMatch ?? headerFromId;
      return mergeMovementWithContext(resolvedOrder, mergedMovementDrafts[resolvedOrder.code], resolvedHeader);
    });

    setOrders(mappedOrders);
    setProductionHeaders(mappedHeaders);
    setMaterials(remoteMaterials);
    setWorkers(remoteWorkers);
    setStages(remoteStages);
    setReferenceOptions(remoteReferenceOptions);
    setDatabaseHealth(remoteDatabaseHealth);

    return { remoteMaterials, remoteWorkers };
  }

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
          stage: remoteState?.remoteWorkers[0]?.stage ? normalizeStageCode(remoteState.remoteWorkers[0].stage) : current.stage
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
    if (isSupabaseConfigured) return;

    void Promise.all([loadMaterials(), loadWorkers()]).then(([localMaterials, localWorkers]) => {
      setMaterials(localMaterials);
      setWorkers(localWorkers);
      setDatabaseHealth({
        usingRealSupabase: false,
        counts: {
          productionOrders: 0,
          materialMovements: 0,
          materials: localMaterials.length,
          workers: localWorkers.length,
          auditLogs: 0
        },
        hasOperationalData: false
      });
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(storageKey, JSON.stringify(orders));
  }, [hasLoadedStorage, orders]);

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
  }, [draft, isMovementFormOpen]);

  useEffect(() => {
    if (!isProductionFormOpen) return;
    const code = productionHeaderDraft.code.trim();
    if (!code) return;

    setProductionHeaderDraftCache((current) => {
      const previous = current[code];
      if (previous && JSON.stringify(previous) === JSON.stringify(productionHeaderDraft)) {
        return current;
      }
      return { ...current, [code]: productionHeaderDraft };
    });
  }, [isProductionFormOpen, productionHeaderDraft]);

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

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = status === "Tất cả" || order.status === status;
      const searchable = `${order.code} ${order.sku} ${order.material} ${order.worker} ${order.stage}`.toLowerCase();
      return matchStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [orders, query, status]);

  const orderSummaries = useMemo(() => buildOrderSummaries(orders, productionHeaders), [orders, productionHeaders]);

  const filteredOrderSummaries = useMemo(() => {
    const normalizedCustomer = productionCustomerQuery.trim().toLowerCase();
    const today = toIsoDate();
    const sevenDaysLater = new Date(`${today}T00:00:00`);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDayLimit = sevenDaysLater.toISOString().slice(0, 10);

    return orderSummaries.filter((summary) => {
      const matchDeliveryStatus =
        productionDeliveryStatus === "Tất cả trạng thái LSX" || summary.deliveryStatus === productionDeliveryStatus;
      const matchSalesType =
        productionSalesType === "Tất cả SR/KH" || summary.salesType === productionSalesType;
      const matchCustomer =
        !normalizedCustomer ||
        `${summary.customerName || ""} ${summary.sku || ""} ${summary.productName || ""} ${summary.code || ""}`
          .toLowerCase()
          .includes(normalizedCustomer);

      let matchDeadline = true;
      if (productionDeadlineFilter === "Quá hạn") {
        matchDeadline = Boolean(summary.deadlineDate && summary.deadlineDate < today && summary.deliveryStatus !== "Hoàn tất");
      } else if (productionDeadlineFilter === "Hôm nay") {
        matchDeadline = summary.deadlineDate === today;
      } else if (productionDeadlineFilter === "7 ngày tới") {
        matchDeadline = Boolean(summary.deadlineDate && summary.deadlineDate >= today && summary.deadlineDate <= sevenDayLimit);
      } else if (productionDeadlineFilter === "Chưa có deadline") {
        matchDeadline = !summary.deadlineDate;
      }

      return matchDeliveryStatus && matchSalesType && matchCustomer && matchDeadline;
    });
  }, [orderSummaries, productionCustomerQuery, productionDeadlineFilter, productionDeliveryStatus, productionSalesType]);

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

  const selectedOrderDetail = useMemo(() => {
    if (!selectedOrderSummary) return null;

    const matchingHeader = productionHeaders.find((header) => header.code === selectedOrderSummary.code);
    const latestMovement = selectedOrderMovements[0] ?? null;
    const movementWorkers = Array.from(
      new Set(selectedOrderMovements.map((item) => item.worker).filter((item) => item && item.trim().length > 0))
    );
    const movementMaterials = Array.from(
      new Set(selectedOrderMovements.map((item) => item.material).filter((item) => item && item.trim().length > 0))
    );
    const movementStages = Array.from(
      new Set(selectedOrderMovements.map((item) => item.stage).filter((item) => item && item.trim().length > 0))
    );

    return {
      code: selectedOrderSummary.code,
      sku: pickText(selectedOrderSummary.sku, matchingHeader?.sku),
      productName: pickText(selectedOrderSummary.productName, matchingHeader?.productName),
      deliveryStatus: pickText(selectedOrderSummary.deliveryStatus, matchingHeader?.deliveryStatus),
      operationalStatus: latestMovement?.status || selectedOrderSummary.status,
      customerName: pickText(selectedOrderSummary.customerName, matchingHeader?.customerName),
      qtyPiece:
        pickNumber(latestMovement?.qtyPiece, selectedOrderSummary.qtyPiece, matchingHeader?.qtyPiece) > 0
          ? pickNumber(latestMovement?.qtyPiece, selectedOrderSummary.qtyPiece, matchingHeader?.qtyPiece)
          : null,
      salesType: pickText(selectedOrderSummary.salesType, matchingHeader?.salesType),
      plannedDate: pickText(selectedOrderSummary.plannedDate, matchingHeader?.plannedDate),
      deadlineDate: pickText(selectedOrderSummary.deadlineDate, matchingHeader?.deadlineDate),
      completedDate: pickText(selectedOrderSummary.completedDate, matchingHeader?.completedDate),
      deliveredQty:
        pickNumber(selectedOrderSummary.deliveredQty, matchingHeader?.deliveredQty) > 0
          ? pickNumber(selectedOrderSummary.deliveredQty, matchingHeader?.deliveredQty)
          : null,
      destination: pickText(latestMovement?.destination, selectedOrderSummary.destination, matchingHeader?.destination),
      stage: pickText(latestMovement?.stage, movementStages[0], selectedOrderSummary.plannedStage, matchingHeader?.plannedStage),
      worker: pickText(latestMovement?.worker, movementWorkers[0], selectedOrderSummary.plannedWorker, matchingHeader?.plannedWorker),
      plannedMaterial: pickText(latestMovement?.material, movementMaterials[0], selectedOrderSummary.plannedMaterial, matchingHeader?.plannedMaterial),
      materialSpec: pickText(selectedOrderSummary.materialSpec, matchingHeader?.materialSpec),
      goldAgeValue: pickNumber(latestMovement?.goldAge, selectedOrderSummary.plannedGoldAge, matchingHeader?.plannedGoldAge),
      actualProgressNote: pickText(selectedOrderSummary.actualProgressNote, matchingHeader?.actualProgressNote),
      movementMaterials,
      movementWorkers,
      movementCount: selectedOrderMovements.length
    };
  }, [productionHeaders, selectedOrderMovements, selectedOrderSummary]);

  const isEditingSelectedOrder = Boolean(selectedOrderSummary && editingProductionCode === selectedOrderSummary.code);

  const productionOverview = useMemo(() => {
    const noMovementCount = filteredOrderSummaries.filter((summary) => summary.movementCount === 0).length;
    const overdueCount = filteredOrderSummaries.filter(
      (summary) => Boolean(summary.deadlineDate && summary.deadlineDate < toIsoDate() && summary.deliveryStatus !== "Hoàn tất")
    ).length;
    const inProgressCount = filteredOrderSummaries.filter((summary) => summary.status === "Đang xử lý").length;

    return {
      total: filteredOrderSummaries.length,
      noMovementCount,
      overdueCount,
      inProgressCount
    };
  }, [filteredOrderSummaries]);

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

  const lossReportRows = useMemo(() => {
    return orders
      .map((order) => {
        const purity = Number(order.goldAge || (order.convertedIssueWeight && order.issued ? order.convertedIssueWeight / order.issued : 1));
        const convertedLoss = Number((order.loss * purity).toFixed(4));

        return {
          id: order.id,
          stage: normalizeStageCode(order.stage),
          count: 1,
          material: order.material || "-",
          issued: order.issued,
          returned: order.returned,
          loss: order.loss,
          convertedLoss,
          worker: order.worker || "-",
          lsxCode: order.code || "-",
          sku: order.sku || "-",
          status: order.status
        };
      })
      .sort((a, b) => b.loss - a.loss);
  }, [orders]);

  const workerOptionsForDraft = useMemo(() => {
    const selectedStage = draft.stage.toLowerCase();
    const exactMatches = workers.filter((worker) => normalizeStageCode(worker.stage ?? "").toLowerCase() === selectedStage);
    return exactMatches.length > 0 ? exactMatches : workers;
  }, [draft.stage, workers]);

  const stageRules = useMemo(() => {
    const rules: Record<string, HaoHutRule> = {};
    for (const stage of stages) rules[stage.stage_code] = stage.hao_hut_rule;
    return rules;
  }, [stages]);

  const stageOptionsForDropdown = useMemo(
    () => buildStageOptionsForDropdown(stages, journalStages),
    [stages]
  );

  const draftStageMovements = useMemo(
    () => buildDraftStageMovements(orders, draft.code),
    [orders, draft.code]
  );

  const selectedOrderStageProgress = useMemo(
    () => buildStageProgress(stageOptionsForDropdown, selectedOrderMovements),
    [stageOptionsForDropdown, selectedOrderMovements]
  );

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

  function addOrder(keepOpen = false) {
    void addOrderAsync(keepOpen);
  }

  async function addOrderAsync(keepOpen = false) {
    const missingFields = validateMovementDraft(draft);
    if (missingFields.length > 0) {
      setRemoteError(`Chưa thể lưu giao dịch. Vui lòng bổ sung: ${missingFields.join(", ")}.`);
      return;
    }
    const existingSummary = orderSummaries.find((summary) => summary.code === draft.code.trim());
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

    // Moi (LSX + khau) chi giu 1 dong: neu khau nay cua LSX da co dong roi
    // thi cap nhat de len chinh dong do, khong tao them dong moi.
    const normalizedStageCode = normalizeStageCode(normalizedDraft.stage);
    const existingStageMovement = orders.find(
      (order) =>
        order.code === normalizedDraft.code.trim() &&
        normalizeStageCode(order.stage) === normalizedStageCode
    );
    const effectiveEditingId = editingMovementId || existingStageMovement?.id || null;

    const nextOrder = {
      ...normalizedDraft,
      id: effectiveEditingId || normalizedDraft.id || crypto.randomUUID(),
      code: normalizedDraft.code.trim(),
      sku: normalizedDraft.sku.trim(),
      worker: normalizedDraft.worker.trim()
    };

    try {
      const savedOrder =
        effectiveEditingId
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
          effectiveEditingId ? current.map((item) => (item.id === effectiveEditingId ? savedOrder : item)) : [savedOrder, ...current]
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
      if (keepOpen) {
        // Giu drawer mo de nhap tiep khau khac cua cung LSX, chi xoa cac
        // truong so lieu cua khau vua luu, giu lai thong tin chung.
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
        setDraft(createEmptyOrder());
        setEditingMovementId(null);
        setIsMovementFormOpen(false);
        setActiveModule("Nhật ký NVL");
      }
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : editingMovementId ? "Không cập nhật được giao dịch" : "Không thêm được giao dịch");
    }
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

  function updateProductionHeaderDraft<K extends keyof Omit<ProductionOrderHeader, "id" | "createdAt">>(
    key: K,
    value: Omit<ProductionOrderHeader, "id" | "createdAt">[K]
  ) {
    setProductionHeaderDraft((current) => {
      const next = { ...current, [key]: value };
      const occurredDate = key === "occurredDate" || key === "plannedDate" ? String(value || toIsoDate()) : next.occurredDate || next.plannedDate || toIsoDate();
      const issued = key === "issued" ? Number(value) : next.issued;
      const returned = key === "returned" ? Number(value) : next.returned;
      const transferred = key === "transferred" ? Number(value) : next.transferred;
      const goldAge = key === "plannedGoldAge" ? Number(value) : Number(next.plannedGoldAge || 1);

      next.plannedDate = key === "occurredDate" ? occurredDate : next.plannedDate;
      next.occurredDate = key === "plannedDate" ? occurredDate : next.occurredDate;
      next.nxtPeriod = key === "occurredDate" || key === "plannedDate" ? toMonthCode(occurredDate) : next.nxtPeriod;
      next.lossPeriod = key === "occurredDate" || key === "plannedDate" || key === "status" ? getCarryOverLossPeriod(occurredDate, next.status) : next.lossPeriod;
      next.convertedIssueWeight = Number((Number(issued || 0) * goldAge).toFixed(4));
      next.convertedReturnWeight = Number((Number(returned || 0) * goldAge).toFixed(4));
      return next;
    });
  }

  function normalizeProductionHeaderDraft(createdAt?: string): ProductionOrderHeader {
    const occurredDate = productionHeaderDraft.occurredDate || productionHeaderDraft.plannedDate || toIsoDate();
    const plannedDate = productionHeaderDraft.plannedDate || occurredDate;
    const issued = Number(productionHeaderDraft.issued || 0);
    const returned = Number(productionHeaderDraft.returned || 0);
    const transferred = Number(productionHeaderDraft.transferred || 0);
    const goldAge = Number(productionHeaderDraft.plannedGoldAge || 0.75);

    return {
      ...productionHeaderDraft,
      id: crypto.randomUUID(),
      code: productionHeaderDraft.code.trim(),
      sku: productionHeaderDraft.sku.trim(),
      productName: productionHeaderDraft.productName.trim(),
      destination: productionHeaderDraft.destination || "CH1",
      orderDate: productionHeaderDraft.orderDate || occurredDate,
      occurredDate,
      documentNo: productionHeaderDraft.documentNo.trim(),
      documentInNo: productionHeaderDraft.documentInNo.trim(),
      documentLineNo: productionHeaderDraft.documentLineNo.trim(),
      movementType: productionHeaderDraft.movementType || "issue",
      qtyPiece: Number(productionHeaderDraft.qtyPiece || 0),
      plannedDate,
      plannedStage: productionHeaderDraft.plannedStage || "CKE",
      plannedWorker: productionHeaderDraft.plannedWorker || "",
      plannedMaterial: productionHeaderDraft.plannedMaterial || "Vàng 18K",
      materialSpec: productionHeaderDraft.materialSpec || "18KY",
      plannedGoldAge: goldAge,
      plannedMaterialType: productionHeaderDraft.plannedMaterialType || "NL18K",
      deliveryStatus: productionHeaderDraft.deliveryStatus || "Chưa Hoàn Tất",
      orderMonth: productionHeaderDraft.orderMonth || toMonthCode(plannedDate),
      salesType: productionHeaderDraft.salesType || "SR",
      customerName: productionHeaderDraft.customerName.trim(),
      specification: productionHeaderDraft.specification.trim(),
      deadlineDate: productionHeaderDraft.deadlineDate || "",
      completedDate: productionHeaderDraft.completedDate || "",
      deliveredQty: Number(productionHeaderDraft.deliveredQty || 0),
      actualProgressNote: productionHeaderDraft.actualProgressNote.trim(),
      completedWeightGram: Number(productionHeaderDraft.completedWeightGram || 0),
      issued,
      returned,
      powder: Number(productionHeaderDraft.powder || 0),
      transferred,
      lossPeriod: productionHeaderDraft.lossPeriod || getCarryOverLossPeriod(occurredDate, productionHeaderDraft.status),
      nxtPeriod: productionHeaderDraft.nxtPeriod || toMonthCode(occurredDate),
      sourceMaterialName: productionHeaderDraft.sourceMaterialName || "",
      sourceName: productionHeaderDraft.sourceName || "",
      importSource: productionHeaderDraft.importSource || "",
      exportSource: productionHeaderDraft.exportSource || "",
      nxtLinkCode: productionHeaderDraft.nxtLinkCode || "",
      convertedIssueWeight: Number(productionHeaderDraft.convertedIssueWeight || (issued * goldAge).toFixed(4)),
      convertedReturnWeight: Number(productionHeaderDraft.convertedReturnWeight || (returned * goldAge).toFixed(4)),
      note: productionHeaderDraft.note.trim(),
      createdAt: createdAt ?? formatDisplayDateTime(new Date())
    };
  }

  function toProductionHeaderInput(header: ProductionOrderHeader) {
    return {
      code: header.code,
      sku: header.sku,
      productName: header.productName,
      destination: header.destination,
      orderDate: header.orderDate,
      occurredDate: header.occurredDate,
      documentNo: header.documentNo,
      documentInNo: header.documentInNo,
      documentLineNo: header.documentLineNo,
      movementType: header.movementType,
      qtyPiece: header.qtyPiece,
      plannedDate: header.plannedDate,
      plannedStage: header.plannedStage,
      plannedWorker: header.plannedWorker,
      plannedMaterial: header.plannedMaterial,
      materialSpec: header.materialSpec,
      plannedGoldAge: header.plannedGoldAge,
      plannedMaterialType: header.plannedMaterialType,
      deliveryStatus: header.deliveryStatus,
      orderMonth: header.orderMonth,
      salesType: header.salesType,
      customerName: header.customerName,
      specification: header.specification,
      deadlineDate: header.deadlineDate,
      completedDate: header.completedDate,
      deliveredQty: header.deliveredQty,
      actualProgressNote: header.actualProgressNote,
      completedWeightGram: header.completedWeightGram,
      issued: header.issued,
      returned: header.returned,
      powder: header.powder,
      transferred: header.transferred,
      lossPeriod: header.lossPeriod,
      nxtPeriod: header.nxtPeriod,
      sourceMaterialName: header.sourceMaterialName,
      sourceName: header.sourceName,
      importSource: header.importSource,
      exportSource: header.exportSource,
      nxtLinkCode: header.nxtLinkCode,
      convertedIssueWeight: header.convertedIssueWeight,
      convertedReturnWeight: header.convertedReturnWeight,
      note: header.note,
      status: header.status
    };
  }

  function buildProductionHeaderDraftFromSummary(summary: OrderSummary): Omit<ProductionOrderHeader, "id" | "createdAt"> {
    const cachedDraft = productionHeaderDraftCache[summary.code];
    if (cachedDraft) {
      return {
        ...cachedDraft,
        code: cachedDraft.code || summary.code,
        sku: cachedDraft.sku || summary.sku
      };
    }

    const occurredDate = summary.occurredDate || summary.plannedDate || toIsoDate();
    const plannedDate = summary.plannedDate || occurredDate;

    return {
      code: summary.code,
      sku: summary.sku,
      productName: summary.productName ?? "",
      destination: summary.destination || "CH1",
      orderDate: summary.orderDate || occurredDate,
      occurredDate,
      documentNo: summary.documentNo || "",
      documentInNo: summary.documentInNo || "",
      documentLineNo: summary.documentLineNo || "",
      movementType: summary.movementType || "issue",
      qtyPiece: summary.qtyPiece || 0,
      plannedDate,
      plannedStage: summary.plannedStage || "CKE",
      plannedWorker: summary.plannedWorker || "",
      plannedMaterial: summary.plannedMaterial || "Vàng 18K",
      materialSpec: summary.materialSpec || "18KY",
      plannedGoldAge: summary.plannedGoldAge || 0.75,
      plannedMaterialType: summary.plannedMaterialType || "NL18K",
      deliveryStatus: summary.deliveryStatus || "Chưa Hoàn Tất",
      orderMonth: summary.orderMonth || toMonthCode(plannedDate),
      salesType: summary.salesType || "SR",
      customerName: summary.customerName || "",
      specification: summary.specification || "",
      deadlineDate: summary.deadlineDate || "",
      completedDate: summary.completedDate || "",
      deliveredQty: summary.deliveredQty || 0,
      actualProgressNote: summary.actualProgressNote || "",
      completedWeightGram: summary.completedWeightGram || 0,
      issued: summary.issuedDefault || 0,
      returned: summary.returnedDefault || 0,
      powder: summary.powderDefault || 0,
      transferred: summary.transferred || 0,
      lossPeriod: summary.lossPeriod || getCarryOverLossPeriod(occurredDate, summary.status),
      nxtPeriod: summary.nxtPeriod || toMonthCode(occurredDate),
      sourceMaterialName: summary.sourceMaterialName || "",
      sourceName: summary.sourceName || "",
      importSource: summary.importSource || "",
      exportSource: summary.exportSource || "",
      nxtLinkCode: summary.nxtLinkCode || "",
      convertedIssueWeight: summary.convertedIssueWeight || 0,
      convertedReturnWeight: summary.convertedReturnWeight || 0,
      note: summary.note || "",
      status: summary.status
    };
  }

  async function createProductionOrderFromHeader() {
    const code = productionHeaderDraft.code.trim();
    const sku = productionHeaderDraft.sku.trim();

    if (!code || !sku) {
      setRemoteError("Cần nhập Mã LSX và Mã hàng trước khi tạo lệnh sản xuất.");
      return;
    }

    if (orderSummaries.some((summary) => summary.code === code)) {
      setRemoteError(`LSX ${code} đã tồn tại. Vui lòng kiểm tra lại mã lệnh.`);
      return;
    }

    const nextHeader = normalizeProductionHeaderDraft();

    try {
      const saved = await createProductionOrderHeader(toProductionHeaderInput(nextHeader));
      const nextHeaderDraftCache = { ...productionHeaderDraftCache, [nextHeader.code]: { ...nextHeader } };

      if (isSupabaseConfigured) {
        await reloadOperationalData({
          productionHeaderDraftOverrides: nextHeaderDraftCache
        });
      } else {
        setProductionHeaders((current) => [{ ...nextHeader, id: saved.id }, ...current]);
      }
      setProductionHeaderDraftCache(nextHeaderDraftCache);
      setSelectedOrderCode(nextHeader.code);
      setRecentCreatedOrderCode(nextHeader.code);
      setProductionHeaderDraft(createEmptyProductionOrderHeaderDraft());
      setIsProductionFormOpen(false);
      pushAudit("create_production_order", `Tạo LSX ${nextHeader.code} - ${nextHeader.sku}`);
      await createAuditLog("create_production_order", `Tạo LSX ${nextHeader.code} - ${nextHeader.sku}`, saved.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không tạo được lệnh sản xuất");
    }
  }

  function cancelProductionHeaderEdit() {
    setEditingProductionCode(null);
    setProductionHeaderDraft(createEmptyProductionOrderHeaderDraft());
    setIsProductionFormOpen(false);
  }

  async function saveProductionHeader() {
    if (editingProductionCode) {
      await updateProductionOrderFromHeader();
      return;
    }

    await createProductionOrderFromHeader();
  }

  async function updateProductionOrderFromHeader() {
    if (!editingProductionCode) return;

    const code = productionHeaderDraft.code.trim();
    const sku = productionHeaderDraft.sku.trim();

    if (!code || !sku) {
      setRemoteError("Cần nhập Mã LSX và Mã hàng trước khi cập nhật lệnh sản xuất.");
      return;
    }

    if (code !== editingProductionCode && orderSummaries.some((summary) => summary.code === code)) {
      setRemoteError(`LSX ${code} đã tồn tại. Không thể đổi sang mã lệnh trùng.`);
      return;
    }

    const existingHeader = productionHeaders.find((header) => header.code === editingProductionCode);
    const nextHeader = {
      ...normalizeProductionHeaderDraft(existingHeader?.createdAt),
      id: existingHeader?.id ?? crypto.randomUUID()
    };

    try {
      const saved = await updateProductionOrderHeader(editingProductionCode, toProductionHeaderInput(nextHeader));
      const nextHeaderDraftCache = { ...productionHeaderDraftCache, [nextHeader.code]: { ...nextHeader } };
      if (editingProductionCode !== nextHeader.code) {
        delete nextHeaderDraftCache[editingProductionCode];
      }

      if (isSupabaseConfigured) {
        await reloadOperationalData({
          productionHeaderDraftOverrides: nextHeaderDraftCache
        });
      } else {
        setProductionHeaders((current) => {
          const withoutOld = current.filter((header) => header.code !== editingProductionCode);
          return [{ ...nextHeader, id: saved.id }, ...withoutOld];
        });
        setOrders((current) =>
          current.map((order) =>
            order.code === editingProductionCode
              ? {
                  ...order,
                  code: nextHeader.code,
                  sku: nextHeader.sku,
                  productName: nextHeader.productName,
                  destination: nextHeader.destination,
                  orderDate: nextHeader.orderDate,
                  documentNo: nextHeader.documentNo,
                  documentInNo: nextHeader.documentInNo,
                  documentLineNo: nextHeader.documentLineNo,
                  movementType: nextHeader.movementType,
                  qtyPiece: nextHeader.qtyPiece,
                  occurredDate: nextHeader.occurredDate || nextHeader.plannedDate || order.occurredDate,
                  stage: nextHeader.plannedStage || order.stage,
                  worker: nextHeader.plannedWorker || order.worker,
                  material: nextHeader.plannedMaterial || order.material,
                  issued: nextHeader.issued || order.issued,
                  returned: nextHeader.returned || order.returned,
                  powder: nextHeader.powder,
                  transferred: nextHeader.transferred,
                  goldAge: nextHeader.plannedGoldAge || order.goldAge,
                  lossPeriod: nextHeader.lossPeriod || order.lossPeriod,
                  nxtPeriod: nextHeader.nxtPeriod || order.nxtPeriod,
                  sourceMaterialName: nextHeader.sourceMaterialName || order.sourceMaterialName,
                  sourceName: nextHeader.sourceName || order.sourceName,
                  importSource: nextHeader.importSource || order.importSource,
                  exportSource: nextHeader.exportSource || order.exportSource,
                  nxtLinkCode: nextHeader.nxtLinkCode || order.nxtLinkCode,
                  materialType: nextHeader.plannedMaterialType || order.materialType,
                  convertedIssueWeight: nextHeader.convertedIssueWeight || order.convertedIssueWeight,
                  convertedReturnWeight: nextHeader.convertedReturnWeight || order.convertedReturnWeight,
                  loss: Math.max(0, Number(((nextHeader.issued || order.issued) - (nextHeader.returned || order.returned) - (nextHeader.transferred || 0)).toFixed(4))),
                  status: nextHeader.status
                }
              : order
          )
        );
      }
      setProductionHeaderDraftCache(nextHeaderDraftCache);
      setSelectedOrderCode(nextHeader.code);
      setEditingProductionCode(nextHeader.code);
      pushAudit("update_production_order", `Cập nhật LSX ${editingProductionCode} -> ${nextHeader.code}`);
      await createAuditLog("update_production_order", `Cập nhật LSX ${editingProductionCode} -> ${nextHeader.code}`, saved.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không cập nhật được lệnh sản xuất");
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

  function openMovementForEdit(order: ProductionOrder) {
    setEditingMovementId(order.id);
    setDraft({ ...order });
    setSelectedOrderCode(order.code);
    setIsMovementFormOpen(true);
    setActiveModule("Nhật ký NVL");
  }

  function closeMovementForm() {
    setIsMovementFormOpen(false);
    setEditingMovementId(null);
    setDraft(createEmptyOrder());
    setRemoteError(null);
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

  function selectStageTab(stageCode: string) {
    const existing = draftStageMovements.get(stageCode);
    if (existing) {
      setEditingMovementId(existing.id);
      setDraft((current) => ({ ...current, ...existing }));
    } else {
      const suggestedWorker = workers.find((item) => item.stage && normalizeStageCode(item.stage) === stageCode);
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
        sourceMaterialName: ""
      }));
    }
    setRemoteError(null);
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
    if (appUser?.id === id) {
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
      stage: workerDraft.stage?.trim() || null
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
      stage: worker.stage
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

  const navItems = [
    ["Dashboard", ClipboardList],
    ["Lệnh sản xuất", Boxes],
    ["Nhật ký NVL", Scale],
    ["Giá & định mức", CircleDollarSign],
    ["Tồn hộp thợ", Boxes],
    ["Báo cáo hao hụt", FileWarning],
    ["Audit log", History],
    ["Cấu hình", Settings2]
  ] as const;

  const isDashboard = activeModule === "Dashboard";
  const isProduction = activeModule === "Lệnh sản xuất";
  const isMovement = activeModule === "Nhật ký NVL";
  const isPricing = activeModule === "Giá & định mức";
  const isReport = activeModule === "Báo cáo hao hụt";
  const isWorkerBox = activeModule === "Tồn hộp thợ";
  const isAudit = activeModule === "Audit log";
  const isSettings = activeModule === "Cấu hình";
  const draftOrderSummary = orderSummaries.find((summary) => summary.code === draft.code.trim());
  const isDraftForClosedOrder = Boolean(draftOrderSummary && isClosedStatus(draftOrderSummary.status));
  const normalizedDraftStage = normalizeStageCode(draft.stage);
  const isDraftLargeWeight = isLargeWeightMovement(draft);
  const isDraftDirectChargeInvalid = shouldForceDirectCharge(normalizedDraftStage, draft.status, stageRules);
  const { appUser, signOut } = useAuth();
  // Dang tam tat cong dang nhap de demo: khong co phien dang nhap van duoc xem la Admin.
  const isAdmin = appUser ? appUser.role === "admin" : true;
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

        <section className="px-5 py-5 md:px-8">
          <div className="content-shell">
          <header className="border-b border-line pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quản trị sản xuất</p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-ink">Theo dõi tiến độ NVL và quản trị hao hụt</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Quản lý lệnh sản xuất, xuất/nhập nguyên vật liệu, treo nợ/xác định, quy đổi hao hụt và quyết toán theo kỳ.
            </p>
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

          <section className={`${isReport ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">Báo cáo hao hụt</h3>
              </div>
              <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={exportJson}>
                Xuất dữ liệu báo cáo
              </button>
            </div>

            <div className="mt-4 rounded-md border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-ink">Bảng hao hụt</h4>
                <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
                  {lossReportRows.length} dòng
                </span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[1280px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white text-left text-xs uppercase text-zinc-500">
                      <th className="px-3 py-3">Công đoạn</th>
                      <th className="px-3 py-3 text-right">Dòng phát sinh</th>
                      <th className="px-3 py-3">Loại vàng/NVL</th>
                      <th className="px-3 py-3 text-right">Tổng xuất</th>
                      <th className="px-3 py-3 text-right">Tổng nhập</th>
                      <th className="px-3 py-3 text-right">Hao hụt</th>
                      <th className="px-3 py-3 text-right">Hao hụt quy 24K</th>
                      <th className="px-3 py-3">Tên thợ</th>
                      <th className="px-3 py-3">Số LSX</th>
                      <th className="px-3 py-3">Mã hàng</th>
                      <th className="px-3 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lossReportRows.map((row) => (
                      <tr key={row.id} className="border-b border-line/70 bg-white">
                        <td className="px-3 py-3 font-semibold text-ink">{row.stage}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{row.count}</td>
                        <td className="px-3 py-3 text-zinc-700">{row.material}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{formatGram(row.issued)}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{formatGram(row.returned)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-ink">{formatGram(row.loss)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-brass">{formatGram(row.convertedLoss)}</td>
                        <td className="px-3 py-3 text-zinc-700">{row.worker}</td>
                        <td className="px-3 py-3 font-semibold text-ink">{row.lsxCode}</td>
                        <td className="px-3 py-3 text-zinc-700">{row.sku}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

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

          <section className={`${isProduction ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">Quản lý lệnh sản xuất</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Tạo LSX trước, sau đó mới ghi nhận xuất/nhập nguyên vật liệu trong Nhật ký NVL.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
                    type="button"
                    onClick={() => {
                      setEditingProductionCode(null);
                      const emptyDraft = createEmptyProductionOrderHeaderDraft();
                      setProductionHeaderDraft({
                        ...emptyDraft,
                        code: buildUniqueProductionOrderCode("DHAG", emptyDraft.occurredDate || toIsoDate(), orderSummaries.map((summary) => summary.code))
                      });
                      setIsProductionFormOpen((current) => !current);
                    }}
                  >
                    <Plus size={16} />
                    Tạo LSX
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                    type="button"
                    onClick={() => {
                      setSelectedOrderCode(null);
                      setIsProductionDetailOpen(false);
                    }}
                  >
                    Xem tất cả LSX
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-line bg-paper px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tổng LSX</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{productionOverview.total}</p>
                </div>
                <div className="rounded-md border border-sky-200 bg-sky-50/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Đang xử lý</p>
                  <p className="mt-2 text-2xl font-bold text-sky-900">{productionOverview.inProgressCount}</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Quá hạn deadline</p>
                  <p className="mt-2 text-2xl font-bold text-rose-900">{productionOverview.overdueCount}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-line bg-paper p-3 lg:grid-cols-4">
                <select
                  className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                  value={productionDeliveryStatus}
                  onChange={(event) => setProductionDeliveryStatus(event.target.value)}
                >
                  <option>Tất cả trạng thái LSX</option>
                  {productionOrderDeliveryStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                  value={productionSalesType}
                  onChange={(event) => setProductionSalesType(event.target.value)}
                >
                  <option>Tất cả SR/KH</option>
                  {productionOrderSalesTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                  value={productionDeadlineFilter}
                  onChange={(event) => setProductionDeadlineFilter(event.target.value)}
                >
                  <option>Tất cả deadline</option>
                  <option>Quá hạn</option>
                  <option>Hôm nay</option>
                  <option>7 ngày tới</option>
                  <option>Chưa có deadline</option>
                </select>
                <input
                  className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                  placeholder="Tìm LSX, mã hàng, khách hàng..."
                  value={productionCustomerQuery}
                  onChange={(event) => setProductionCustomerQuery(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-ink">Danh sách lệnh sản xuất</h4>
                      <p className="mt-1 text-xs text-zinc-500">Bấm vào dòng để mở chi tiết.</p>
                    </div>
                    <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                      {filteredOrderSummaries.length} LSX
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-md border border-line bg-white">
                    <table className="w-full min-w-[1360px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line bg-transparent text-left text-[11px] uppercase tracking-wider text-zinc-500">
                          <th className="px-3 py-3">Mã LSX</th>
                          <th className="px-3 py-3">Mã hàng</th>
                          <th className="px-3 py-3">Tên hàng</th>
                          <th className="px-3 py-3">Khách hàng</th>
                          <th className="px-3 py-3">SR/KH</th>
                          <th className="px-3 py-3">Deadline đơn hàng</th>
                          <th className="px-3 py-3 text-right">Số lượng</th>
                          <th className="px-3 py-3 text-right" title="Số dòng đã ghi nhận trong Nhật ký NVL cho LSX này - khác với thông tin trong form LSX.">
                            Số GD NVL
                          </th>
                          <th className="px-3 py-3">Khâu hiện tại</th>
                          <th className="px-3 py-3">Trạng thái LSX</th>
                          <th className="px-3 py-3">Trạng thái vận hành</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrderSummaries.map((summary) => (
                          <tr
                            key={summary.code}
                            className={`cursor-pointer border-b border-line/70 transition hover:bg-emerald-50/40 ${
                              selectedOrderCode === summary.code ? "bg-emerald-50/60" : "bg-white"
                            }`}
                            onClick={() => selectProductionOrder(summary.code)}
                          >
                            <td className="px-3 py-3 align-top">
                              <p className="font-semibold text-ink">{summary.code}</p>
                            </td>
                            <td className="px-3 py-3 align-top text-zinc-700">{summary.sku || "-"}</td>
                            <td className="px-3 py-3 align-top">
                              <p className={`max-w-[240px] truncate font-medium ${hasMeaningfulText(summary.productName) ? "text-zinc-800" : "text-zinc-400"}`}>
                                {summary.productName || "Chưa cập nhật"}
                              </p>
                            </td>
                            <td className={`px-3 py-3 align-top ${hasMeaningfulText(summary.customerName) ? "text-zinc-700" : "text-zinc-400"}`}>
                              {summary.customerName || "Chưa cập nhật"}
                            </td>
                            <td className={`px-3 py-3 align-top ${hasMeaningfulText(summary.salesType) ? "text-zinc-700" : "text-zinc-400"}`}>
                              {summary.salesType || "Chưa cập nhật"}
                            </td>
                            <td className={`px-3 py-3 align-top ${hasMeaningfulText(summary.deadlineDate) ? "text-zinc-700" : "text-zinc-400"}`}>
                              {formatDisplayDate(summary.deadlineDate) || "Chưa cập nhật"}
                            </td>
                            <td className="px-3 py-3 text-right align-top text-zinc-700">
                              {summary.qtyPiece && summary.qtyPiece > 0 ? summary.qtyPiece : "Chưa cập nhật"}
                            </td>
                            <td
                              className={`px-3 py-3 text-right align-top ${summary.movementCount > 0 ? "text-zinc-700" : "text-zinc-400"}`}
                              title={
                                summary.movementCount > 0
                                  ? `${summary.movementCount} dòng đã ghi trong Nhật ký NVL`
                                  : "Chưa có giao dịch nào trong Nhật ký NVL cho LSX này"
                              }
                            >
                              {summary.movementCount}
                            </td>
                            <td className="px-3 py-3 align-top">
                              {(() => {
                                const stageCode = summary.plannedStage ? normalizeProductionStageCode(summary.plannedStage) : "";
                                const stageIndex = stageCode ? stageOptionsForDropdown.findIndex((item) => item.value === stageCode) : -1;
                                if (stageIndex < 0) {
                                  return <span className="text-xs text-zinc-400">Chưa bắt đầu</span>;
                                }
                                return (
                                  <span className="inline-flex flex-col text-xs">
                                    <span className="font-semibold text-ink">
                                      Khâu {stageIndex + 1}/{stageOptionsForDropdown.length}
                                    </span>
                                    <span className="text-zinc-500">{getStageLabel(stageCode)}</span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3 align-top">
                              <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${deliveryStatusClass[summary.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                                {summary.deliveryStatus || "Chưa cập nhật"}
                              </span>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[summary.status]}`}>
                                {summary.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            </div>
          </section>

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
            <section className={`${isMovement ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">Nhật ký xuất/nhập NVL</h3>
                  <p className="mt-1 text-sm text-zinc-600">Màn này chỉ dùng để tiếp nhận LSX mới và ghi nhận giao dịch NVL phát sinh.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold uppercase tracking-wide text-white"
                    type="button"
                    onClick={() => {
                      setEditingMovementId(null);
                      setDraft(createEmptyOrder());
                      setRemoteError(null);
                      setIsMovementFormOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    Thêm giao dịch
                  </button>
                  <input
                    className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                    placeholder="Tìm LSX, mã hàng, thợ..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <select
                    className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as typeof status)}
                  >
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-ink">Lịch sử giao dịch NVL</h4>
                    <p className="mt-1 text-xs text-zinc-500">Bấm "Sửa NVL" để chỉnh sửa một dòng đã ghi nhận.</p>
                  </div>
                  {filteredOrders.length > 0 ? (
                    <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                      {filteredOrders.length} dòng
                    </span>
                  ) : null}
                </div>
                {filteredOrders.length > 0 ? (
                  <table className="w-full min-w-[1320px] border-collapse text-sm">
                    <thead>
                    <tr className="border-b border-line bg-transparent text-left text-[11px] uppercase tracking-wider text-zinc-500">
                        <th className="px-3 py-3">Số CT</th>
                        <th className="px-3 py-3">Mã hàng</th>
                        <th className="px-3 py-3">Tên hàng</th>
                        <th className="px-3 py-3">Mã LSX</th>
                        <th className="px-3 py-3">Loại NVL</th>
                        <th className="px-3 py-3">NVL</th>
                        <th className="px-3 py-3">Thợ / công đoạn</th>
                        <th className="px-3 py-3 text-right">SL</th>
                        <th className="px-3 py-3 text-right">Xuất</th>
                        <th className="px-3 py-3 text-right">Nhập</th>
                        <th className="px-3 py-3 text-right">Hao hụt</th>
                        <th className="px-3 py-3">Hao/NXT</th>
                        <th className="px-3 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-b ${isClosedStatus(order.status) ? "" : "cursor-pointer hover:bg-paper"} ${recentCreatedOrderCode === order.code ? "border-emerald-200 bg-emerald-50/40" : "border-line/70"}`}
                          onClick={() => {
                            if (isClosedStatus(order.status)) return;
                            openMovementForEdit(order);
                          }}
                          title={isClosedStatus(order.status) ? "Giao dịch đã chốt, không thể sửa" : "Bấm để sửa giao dịch này"}
                        >
                          <td className="px-3 py-3">
                            <div className="font-semibold text-ink">{order.documentNo || order.documentInNo || "-"}</div>
                            <div className="text-xs text-zinc-500">{formatDisplayDate(order.occurredDate) || "-"}</div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-ink">{order.sku}</td>
                          <td className="px-3 py-3 text-zinc-700">{order.productName || "-"}</td>
                          <td className="px-3 py-3 font-semibold text-ink">{order.code}</td>
                          <td className="px-3 py-3 text-zinc-700">{order.materialType || "-"}</td>
                          <td className="px-3 py-3 text-zinc-700">{order.material}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-zinc-800">{order.worker}</div>
                            <div className="text-xs text-zinc-500">{order.stage ? getStageLabel(order.stage) : "-"}</div>
                          </td>
                          <td className="px-3 py-3 text-right text-zinc-700">{order.qtyPiece ?? "-"}</td>
                          <td className={`px-3 py-3 text-right ${order.issued > 0 ? "text-zinc-700" : "text-zinc-400"}`}>{formatGram(order.issued)}</td>
                          <td className={`px-3 py-3 text-right ${order.returned > 0 ? "text-zinc-700" : "text-zinc-400"}`}>{formatGram(order.returned)}</td>
                          <td className={`px-3 py-3 text-right font-semibold ${order.loss > 0 ? "text-ink" : "text-zinc-400"}`}>{formatGram(order.loss)}</td>
                          <td className="px-3 py-3 text-xs text-zinc-600">
                            <div>{order.lossPeriod || "-"}</div>
                            <div>{order.nxtPeriod || "-"}</div>
                          </td>
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            <select
                              className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 outline-none disabled:cursor-not-allowed disabled:opacity-70 ${statusClass[order.status]}`}
                              value={order.status}
                              onChange={(event) => changeOrderStatus(order.id, event.target.value as Status)}
                              disabled={isClosedStatus(order.status)}
                            >
                              {statusOptions.filter((item) => item !== "Tất cả").map((item) => (
                                <option key={item}>{item}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="rounded-md border border-dashed border-line bg-white px-4 py-8 text-sm text-zinc-500">
                    Chưa có giao dịch NVL phát sinh theo bộ lọc hiện tại.
                  </div>
                )}
              </div>
            </section>

            <div className={`${isMovementFormOpen ? "block" : "hidden"}`}>
              {isMovementFormOpen ? (
                <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={closeMovementForm} />
              ) : null}
              <section
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-line bg-white p-5 shadow-2xl transition-transform duration-200 ${
                  isMovementFormOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
                aria-hidden={!isMovementFormOpen}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brass">
                      {editingMovementId ? "Sửa giao dịch NVL" : "Thêm giao dịch NVL"}
                    </p>
                    <h3 className="font-display mt-1 text-2xl font-semibold text-ink">
                      {editingMovementId ? draft.code || "Giao dịch NVL" : "Giao dịch mới"}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {editingMovementId ? "Chỉnh sửa trực tiếp bên dưới, bấm Cập nhật NVL để lưu." : "Nhập thông tin theo mẫu Nhật ký sản xuất tháng."}
                    </p>
                  </div>
                  <button
                    className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
                    type="button"
                    onClick={closeMovementForm}
                    title="Đóng form"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {editingMovementId ? "Đang sửa giao dịch" : "Giao dịch mới"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-line">
                        Mã hàng: {draft.sku || "Chưa chọn"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-line">
                        Công đoạn: {draft.stage ? getStageLabel(draft.stage) : "Chưa chọn"}
                      </span>
                    </div>
                    {editingMovementId ? (
                      <p className="mt-1.5 text-xs leading-5 text-zinc-600">
                        Thông tin gốc của LSX đã khoá, sửa tại màn Lệnh sản xuất nếu cần.
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs leading-5 text-zinc-600">
                        Ưu tiên nhập theo thứ tự từ trên xuống để tránh ghi nhầm giao dịch.
                      </p>
                    )}
                  </div>

                  {!editingMovementId ? (
                    <DrawerSection title="Thông tin LSX" note="Nhóm nhận diện đơn và sản phẩm đang thao tác.">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FieldShell label="Mã LSX" required>
                          <input
                            className={fieldControlClass}
                            placeholder="VD: DHAG-260713"
                            value={draft.code}
                            onChange={(e) => updateDraft("code", e.target.value)}
                          />
                        </FieldShell>
                        <FieldShell label="Mã hàng" required>
                          <input
                            className={fieldControlClass}
                            placeholder="VD: RG750Y"
                            value={draft.sku}
                            onChange={(e) => updateDraft("sku", e.target.value)}
                          />
                        </FieldShell>
                      </div>
                      <div className="mt-3">
                        <FieldShell label="Tên hàng / diễn giải">
                          <input
                            className={fieldControlClass}
                            placeholder="Tên sản phẩm hoặc ghi chú nhận diện"
                            value={draft.productName ?? ""}
                            onChange={(e) => updateDraft("productName", e.target.value)}
                          />
                        </FieldShell>
                      </div>
                    </DrawerSection>
                  ) : null}

                  <DrawerSection title="Thông tin chứng từ" note="Phục vụ đối chiếu ngày nghiệp vụ và số chứng từ nhập/xuất.">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Ngày nghiệp vụ" hint="Ngày phát sinh xuất/nhập NVL." required>
                        <input className={fieldControlClass} type="date" value={draft.occurredDate ?? ""} onChange={(e) => updateDraft("occurredDate", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="Nơi nhận" required>
                        <SelectControl value={draft.destination ?? ""} onChange={(value) => updateDraft("destination", value)}>
                          <option value="">Chọn nơi nhận</option>
                          {getDynamicOptions("nk_nvl_noi_nhan", journalDestinations).map((item) => (
                            <option key={item.value} value={item.value} title={item.label}>{item.label}</option>
                          ))}
                        </SelectControl>
                      </FieldShell>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Số CT xuất">
                        <input className={fieldControlClass} placeholder="Tự sinh nếu bỏ trống" value={draft.documentNo ?? ""} onChange={(e) => updateDraft("documentNo", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="Số CT nhập">
                        <input className={fieldControlClass} placeholder="Nếu có" value={draft.documentInNo ?? ""} onChange={(e) => updateDraft("documentInNo", e.target.value)} />
                      </FieldShell>
                    </div>
                  </DrawerSection>

                  <DrawerSection title="Công đoạn xử lý" note="Bấm vào từng khâu để nhập xuất/nhập; khâu có dấu ✓ là đã ghi nhận, khâu ○ chưa nhập thì có thể bỏ qua.">
                    <FieldShell label="Chọn khâu để cập nhật" hint={draft.code ? "Mỗi khâu lưu thành một dòng riêng trong Nhật ký NVL." : "Nhập Mã LSX ở trên trước rồi mới chọn khâu."} required>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {stageOptionsForDropdown.map((item) => {
                          const done = draftStageMovements.has(item.value);
                          const active = normalizeStageCode(draft.stage) === item.value;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              disabled={!draft.code.trim()}
                              onClick={() => selectStageTab(item.value)}
                              className={`flex items-center justify-between gap-1 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                active
                                  ? "border-ink bg-ink text-white"
                                  : done
                                    ? "border-line bg-white text-ink hover:border-ink/50"
                                    : "border-dashed border-line/70 text-zinc-400 hover:border-line"
                              }`}
                              title={item.label}
                            >
                              <span className="truncate">{item.value}</span>
                              <span className={active ? "text-white" : done ? "text-ink" : "text-zinc-400"}>{done ? "✓" : "○"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </FieldShell>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Khâu đang nhập">
                        <input className={`${fieldControlClass} bg-paper`} value={draft.stage ? getStageLabel(draft.stage) : "Chưa chọn khâu"} readOnly />
                      </FieldShell>
                      <FieldShell label="Trạng thái công đoạn" required>
                        <SelectControl value={draft.stageStatus ?? "Đang thực hiện"} onChange={(value) => updateDraft("stageStatus", value)}>
                          {movementStageStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </SelectControl>
                      </FieldShell>
                    </div>
                    <div className="mt-3">
                      <FieldShell label="Thợ phụ trách" hint="Danh sách thợ được lọc theo công đoạn nếu có dữ liệu." required>
                        <SelectControl
                          value={draft.worker}
                          onChange={(value) => {
                            const worker = workers.find((item) => item.full_name === value);
                            updateDraft("worker", value);
                            if (worker?.stage) updateDraft("stage", normalizeStageCode(worker.stage));
                          }}
                        >
                          <option value="">Chọn thợ</option>
                          {workerOptionsForDraft.map((worker) => (
                            <option key={worker.id} value={worker.full_name}>{worker.worker_code} - {worker.full_name}</option>
                          ))}
                        </SelectControl>
                      </FieldShell>
                    </div>
                  </DrawerSection>

                  <DrawerSection title="Số lượng & trọng lượng" note="Đây là nhóm ảnh hưởng trực tiếp đến tổng xuất, tổng nhập và hao hụt.">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <FieldShell label="Số lượng viên/sợi">
                        <input className={fieldControlClass} min="0" type="number" placeholder="0" value={draft.qtyPiece || ""} onChange={(e) => updateDraft("qtyPiece", Number(e.target.value))} />
                      </FieldShell>
                      <FieldShell label="Xuất gram">
                        <input className={fieldControlClass} min="0" type="number" placeholder="0.00" value={draft.issued || ""} onChange={(e) => updateDraft("issued", Number(e.target.value))} />
                      </FieldShell>
                      <FieldShell label="Nhập gram">
                        <input className={fieldControlClass} min="0" type="number" placeholder="0.00" value={draft.returned || ""} onChange={(e) => updateDraft("returned", Number(e.target.value))} />
                      </FieldShell>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Trạng thái tính hao" required>
                        <SelectControl value={draft.status} onChange={(value) => updateDraft("status", value as Status)}>
                          {movementLossStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </SelectControl>
                      </FieldShell>
                    </div>
                    <div className="mt-3">
                      <FieldShell label="Diễn giải giao dịch">
                        <input
                          className={fieldControlClass}
                          placeholder="Nhập diễn giải giao dịch (VD: Xuất cán kéo)"
                          value={draft.sourceMaterialName ?? ""}
                          onChange={(e) => updateDraft("sourceMaterialName", e.target.value)}
                        />
                      </FieldShell>
                    </div>
                  </DrawerSection>

                  <DrawerSection title="Thông tin NXT / tính hao" note="Nhóm phục vụ báo cáo nhập xuất tồn và quy đổi hao hụt theo tuổi vàng.">
                    <div className="rounded-md border border-dashed border-line bg-paper/70 px-3 py-3">
                      <button
                        className="flex w-full items-center justify-between gap-3 text-left"
                        type="button"
                        onClick={() => setIsMovementAdvancedOpen((current) => !current)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">Trường nâng cao</p>
                          <p className="mt-1 text-xs text-zinc-500">Chỉ mở khi cần nhập NXT, quy đổi KCP hoặc nguồn nhập/xuất.</p>
                        </div>
                        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                          {isMovementAdvancedOpen ? "Thu gọn" : "Mở rộng"}
                        </span>
                      </button>
                    </div>
                    <div className={`${isMovementAdvancedOpen ? "grid" : "hidden"} gap-3`}>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="Tháng tính hao" hint="Kỳ dùng để quyết toán hao hụt.">
                          <input className={fieldControlClass} type="month" value={draft.lossPeriod ?? ""} onChange={(e) => updateDraft("lossPeriod", e.target.value)} />
                        </FieldShell>
                        <FieldShell label="Tháng NXT" hint="Kỳ dùng cho báo cáo nhập xuất tồn.">
                          <input className={fieldControlClass} type="month" value={draft.nxtPeriod ?? ""} onChange={(e) => updateDraft("nxtPeriod", e.target.value)} />
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FieldShell label="Tuổi vàng" required>
                          <SelectControl value={String(draft.goldAge ?? "")} onChange={(value) => updateDraft("goldAge", Number(value))}>
                            <option value="">Chọn tuổi vàng</option>
                            {getDynamicOptions("tuoi_vang", movementGoldAgeOptions).map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </SelectControl>
                        </FieldShell>
                        <FieldShell label="Mã nối NXT">
                          <SelectControl value={draft.nxtLinkCode ?? ""} onChange={(value) => updateDraft("nxtLinkCode", value)}>
                            <option value="">Chọn mã nối</option>
                            {getDynamicOptions("nguon_nvl", sourceMaterialOptions).map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </SelectControl>
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="Nguồn nhập">
                          <SelectControl value={draft.importSource ?? ""} onChange={(value) => updateDraft("importSource", value)}>
                            <option value="">Chọn nguồn nhập</option>
                            {getDynamicOptions("nguon_nhap", movementImportSourceOptions).map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </SelectControl>
                        </FieldShell>
                        <FieldShell label="Nguồn xuất">
                          <SelectControl value={draft.exportSource ?? ""} onChange={(value) => updateDraft("exportSource", value)}>
                            <option value="">Chọn nguồn xuất</option>
                            {getDynamicOptions("nguon_xuat", movementExportSourceOptions).map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </SelectControl>
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="TL quy KCP xuất" hint="Trọng lượng xuất đã quy đổi theo tuổi vàng.">
                          <input className={fieldControlClass} type="number" step="0.0001" placeholder="0.0000" value={draft.convertedIssueWeight || ""} onChange={(e) => updateDraft("convertedIssueWeight", Number(e.target.value))} />
                        </FieldShell>
                        <FieldShell label="TL quy KCP nhập" hint="Trọng lượng nhập đã quy đổi theo tuổi vàng.">
                          <input className={fieldControlClass} type="number" step="0.0001" placeholder="0.0000" value={draft.convertedReturnWeight || ""} onChange={(e) => updateDraft("convertedReturnWeight", Number(e.target.value))} />
                        </FieldShell>
                      </div>
                    </div>
                  </DrawerSection>
                  <p className="text-xs leading-5 text-zinc-500">
                    Trường có dấu <span className="font-semibold text-rose-500">*</span> là bắt buộc. Nên hoàn thành nhóm trên trước rồi mới mở phần nâng cao.
                  </p>
                  {isDraftForClosedOrder ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                      LSX này đã chốt. Bạn vẫn có thể cập nhật NK NVL theo luồng xử lý thực tế.
                    </div>
                  ) : null}
                  {remoteError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {remoteError}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                      type="button"
                      onClick={() => addOrder(false)}
                      disabled={isDraftDirectChargeInvalid}
                    >
                      <Plus size={16} />
                      {editingMovementId ? "Cập nhật NVL" : "Thêm vào bảng"}
                    </button>
                    {draft.code.trim() ? (
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-ink bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                        type="button"
                        onClick={() => addOrder(true)}
                        disabled={isDraftDirectChargeInvalid}
                        title="Lưu khâu này và tiếp tục nhập khâu khác của cùng LSX"
                      >
                        Lưu & tiếp khâu khác
                      </button>
                    ) : null}
                    {editingMovementId ? (
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                        type="button"
                        onClick={() => {
                          removeOrder(editingMovementId);
                          closeMovementForm();
                        }}
                        disabled={isClosedStatus(draft.status)}
                        title="Xóa giao dịch"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

            </div>

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

          <AuditLogView isVisible={isAudit} events={auditEvents} />

          <div className={`${isPricing || isSettings ? "unified-stack" : "hidden"} pb-8 pt-5`}>
            <PriceTableView isVisible={isPricing} rows={priceRows} />

            <MasterDataSettingsView
              isVisible={isSettings}
              materials={materials}
              workers={workers}
              stages={stages}
              materialDraft={materialDraft}
              workerDraft={workerDraft}
              stageDraft={stageDraft}
              setMaterialDraft={setMaterialDraft}
              setWorkerDraft={setWorkerDraft}
              setStageDraft={setStageDraft}
              onAddMaterial={addMaterial}
              onAddWorker={addWorker}
              onAddStage={addStage}
              editingWorkerId={editingWorkerId}
              onStartEditWorker={startEditWorker}
              onCancelEditWorker={cancelEditWorker}
              onDeleteWorker={removeWorker}
              editingMaterialId={editingMaterialId}
              onStartEditMaterial={startEditMaterial}
              onCancelEditMaterial={cancelEditMaterial}
              onDeleteMaterial={removeMaterial}
              editingStageId={editingStageId}
              onStartEditStage={startEditStage}
              onCancelEditStage={cancelEditStage}
              onDeleteStage={removeStage}
              referenceOptions={referenceOptions}
              referenceListKeys={referenceListKeys}
              referenceListKey={referenceListKey}
              onChangeReferenceListKey={changeReferenceListKey}
              referenceDraft={referenceDraft}
              setReferenceDraft={setReferenceDraft}
              onAddReferenceOption={addReferenceOption}
              editingReferenceId={editingReferenceId}
              onStartEditReferenceOption={startEditReferenceOption}
              onCancelEditReferenceOption={cancelEditReferenceOption}
              onDeleteReferenceOption={removeReferenceOption}
              appUsers={appUsers}
              currentUserId={appUser?.id}
              appUserDraft={appUserDraft}
              setAppUserDraft={setAppUserDraft}
              onAddAppUser={addAppUser}
              editingAppUserId={editingAppUserId}
              onStartEditAppUser={startEditAppUser}
              onCancelEditAppUser={cancelEditAppUser}
              onDeleteAppUser={removeAppUser}
            />
          </div>
          {renderProductionFormOverlay()}
          </div>
        </section>
      </div>
    </main>
  );
}




