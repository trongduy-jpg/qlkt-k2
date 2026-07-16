"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  ChevronDown,
  Database,
  Download,
  FileWarning,
  Gem,
  History,
  Plus,
  Scale,
  Search,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuditLogView } from "@/components/audit-log-view";
import { GoogleSheetFlowView } from "@/components/google-sheet-flow-view";
import { MasterDataSettingsView } from "@/components/master-data-settings-view";
import { PriceTableView } from "@/components/price-table-view";
import { WorkerBoxView } from "@/components/worker-box-view";
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
  journalMovementReasons,
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
  getCarryOverLossPeriod,
  isLargeWeightMovement,
  normalizeStageCode as normalizeProductionStageCode,
  shouldForceDirectCharge,
  toIsoDate,
  toMonthCode
} from "@/lib/production-business-rules";
import {
  createAuditLog,
  createMaterial,
  createMaterialMovement,
  createProductionOrderHeader,
  createWorker,
  deleteMaterialMovement,
  loadDatabaseHealth,
  loadMaterials,
  loadProductionOrderHeaders,
  loadProductionOrders,
  loadWorkers,
  updateProductionOrderStatus,
  updateProductionOrderHeader,
  updateMaterialMovementStatus,
  type DatabaseHealth,
  type MaterialMaster,
  type WorkerMaster
} from "@/lib/material-service";
import { isSupabaseConfigured } from "@/lib/supabase";

const statusOptions: Array<Status | "Tất cả"> = ["Tất cả", "Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"];
const storageKey = "qlkt-k2-material-orders";
const productionOrderHeaderKey = "qlkt-k2-production-order-headers";
const auditKey = "qlkt-k2-audit-events";

const statusClass: Record<Status, string> = {
  "Đang xử lý": "bg-sky-50 text-sky-700 ring-sky-200",
  "Treo nợ": "bg-amber-50 text-amber-800 ring-amber-200",
  "Xác định": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đã chốt": "bg-zinc-100 text-zinc-700 ring-zinc-300"
};

const deliveryStatusClass: Record<string, string> = {
  "Hoàn tất": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Chưa Hoàn Tất": "bg-sky-50 text-sky-700 ring-sky-200",
  "Chưa giao đủ": "bg-amber-50 text-amber-800 ring-amber-200",
  "Ngưng Sản Xuất": "bg-rose-50 text-rose-700 ring-rose-200"
};

function formatGram(value: number) {
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g`;
}

function FieldShell({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function SelectControl({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        className={`${fieldControlClass} appearance-none pr-10`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function DetailGroup({
  title,
  items
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={`${title}-${label}`} className="rounded-md bg-paper px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const fieldControlClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jade/30";

function createEmptyOrder(): ProductionOrder {
  const today = toIsoDate();
  return {
    id: "",
    code: buildProductionOrderCode("DHAG", today),
    sku: "",
    productName: "",
    material: "Vàng 18K",
    worker: "",
    stage: "CKE",
    stageStatus: "Đang thực hiện",
    destination: "KCP",
    occurredDate: today,
    documentNo: "",
    documentInNo: "",
    documentLineNo: "",
    movementType: "issue",
    qtyPiece: 0,
    issued: 0,
    returned: 0,
    powder: 0,
    transferred: 0,
    lossPeriod: toMonthCode(today),
    nxtPeriod: toMonthCode(today),
    goldAge: 0.75,
    sourceMaterialName: "",
    nxtLinkCode: "",
    importSource: "",
    exportSource: "",
    convertedIssueWeight: 0,
    convertedReturnWeight: 0,
    loss: 0,
    status: "Treo nợ"
  };
}

function createEmptyMaterialDraft(): Omit<MaterialMaster, "id"> {
  return {
    code: "",
    name: "",
    category: "gold",
    purity: 0.75,
    unit: "gram"
  };
}

function createEmptyWorkerDraft(): Omit<WorkerMaster, "id"> {
  return {
    worker_code: "",
    full_name: "",
    department: "San xuat",
    stage: "CKE"
  };
}

type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};

type OrderSummary = {
  code: string;
  sku: string;
  productName?: string;
  destination?: string;
  orderDate?: string;
  occurredDate?: string;
  documentNo?: string;
  documentInNo?: string;
  documentLineNo?: string;
  movementType?: ProductionOrder["movementType"];
  qtyPiece?: number;
  plannedDate?: string;
  plannedStage?: string;
  plannedWorker?: string;
  plannedMaterial?: string;
  materialSpec?: string;
  plannedGoldAge?: number;
  plannedMaterialType?: string;
  deliveryStatus?: string;
  orderMonth?: string;
  salesType?: string;
  customerName?: string;
  specification?: string;
  deadlineDate?: string;
  completedDate?: string;
  deliveredQty?: number;
  actualProgressNote?: string;
  completedWeightGram?: number;
  issuedDefault?: number;
  returnedDefault?: number;
  powderDefault?: number;
  transferred?: number;
  lossPeriod?: string;
  nxtPeriod?: string;
  sourceMaterialName?: string;
  sourceName?: string;
  importSource?: string;
  exportSource?: string;
  nxtLinkCode?: string;
  convertedIssueWeight?: number;
  convertedReturnWeight?: number;
  note?: string;
  createdAt?: string;
  movementCount: number;
  issued: number;
  returned: number;
  powder: number;
  loss: number;
  status: Status;
  workers: string[];
  materials: string[];
};

type ProductionOrderHeader = {
  id: string;
  code: string;
  sku: string;
  productName: string;
  destination: string;
  orderDate: string;
  occurredDate: string;
  documentNo: string;
  documentInNo: string;
  documentLineNo: string;
  movementType: ProductionOrder["movementType"];
  qtyPiece: number;
  plannedDate: string;
  plannedStage: string;
  plannedWorker: string;
  plannedMaterial: string;
  materialSpec: string;
  plannedGoldAge: number;
  plannedMaterialType: string;
  deliveryStatus: string;
  orderMonth: string;
  salesType: string;
  customerName: string;
  specification: string;
  deadlineDate: string;
  completedDate: string;
  deliveredQty: number;
  actualProgressNote: string;
  completedWeightGram: number;
  issued: number;
  returned: number;
  powder: number;
  transferred: number;
  lossPeriod: string;
  nxtPeriod: string;
  sourceMaterialName: string;
  sourceName: string;
  importSource: string;
  exportSource: string;
  nxtLinkCode: string;
  convertedIssueWeight: number;
  convertedReturnWeight: number;
  note: string;
  status: Status;
  createdAt: string;
};

function createEmptyProductionOrderHeaderDraft(): Omit<ProductionOrderHeader, "id" | "createdAt"> {
  const today = toIsoDate();
  return {
    code: buildProductionOrderCode("DHAG", today),
    sku: "",
    productName: "",
    destination: "CH1",
    orderDate: today,
    occurredDate: today,
    documentNo: "",
    documentInNo: "",
    documentLineNo: "",
    movementType: "issue",
    qtyPiece: 0,
    plannedDate: today,
    plannedStage: "CKE",
    plannedWorker: "",
    plannedMaterial: "Vàng 18K",
    materialSpec: "18KY",
    plannedGoldAge: 0.75,
    plannedMaterialType: "NL18K",
    deliveryStatus: "Chưa Hoàn Tất",
    orderMonth: toMonthCode(today),
    salesType: "SR",
    customerName: "",
    specification: "",
    deadlineDate: "",
    completedDate: "",
    deliveredQty: 0,
    actualProgressNote: "",
    completedWeightGram: 0,
    issued: 0,
    returned: 0,
    powder: 0,
    transferred: 0,
    lossPeriod: toMonthCode(today),
    nxtPeriod: toMonthCode(today),
    sourceMaterialName: "",
    sourceName: "",
    importSource: "",
    exportSource: "",
    nxtLinkCode: "",
    convertedIssueWeight: 0,
    convertedReturnWeight: 0,
    note: "",
    status: "Đang xử lý"
  };
}

function getSummaryStatus(statuses: Status[]): Status {
  if (statuses.includes("Treo nợ")) return "Treo nợ";
  if (statuses.includes("Đang xử lý")) return "Đang xử lý";
  if (statuses.every((item) => item === "Đã chốt")) return "Đã chốt";
  return "Xác định";
}

function isClosedStatus(status: Status) {
  return status === "Đã chốt";
}

function normalizeStageCode(stage: string) {
  return normalizeProductionStageCode(stage);
}

export function MaterialDashboard() {
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("Tất cả");
  const [productionDeliveryStatus, setProductionDeliveryStatus] = useState("Tất cả trạng thái LSX");
  const [productionSalesType, setProductionSalesType] = useState("Tất cả SR/KH");
  const [productionCustomerQuery, setProductionCustomerQuery] = useState("");
  const [productionDeadlineFilter, setProductionDeadlineFilter] = useState("Tất cả deadline");
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>(productionOrders);
  const [productionHeaders, setProductionHeaders] = useState<ProductionOrderHeader[]>([]);
  const [productionHeaderDraft, setProductionHeaderDraft] = useState<Omit<ProductionOrderHeader, "id" | "createdAt">>(createEmptyProductionOrderHeaderDraft());
  const [editingProductionCode, setEditingProductionCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductionOrder>(createEmptyOrder());
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [workers, setWorkers] = useState<WorkerMaster[]>([]);
  const [materialDraft, setMaterialDraft] = useState<Omit<MaterialMaster, "id">>(createEmptyMaterialDraft());
  const [workerDraft, setWorkerDraft] = useState<Omit<WorkerMaster, "id">>(createEmptyWorkerDraft());

  useEffect(() => {
    const savedOrders = window.localStorage.getItem(storageKey);
    const savedProductionHeaders = window.localStorage.getItem(productionOrderHeaderKey);
    const savedAudit = window.localStorage.getItem(auditKey);

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

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadRemoteData() {
      setIsLoadingRemote(true);
      setRemoteError(null);

      try {
        const [remoteOrders, remoteHeaders, remoteMaterials, remoteWorkers, remoteDatabaseHealth] = await Promise.all([
          loadProductionOrders(),
          loadProductionOrderHeaders(),
          loadMaterials(),
          loadWorkers(),
          loadDatabaseHealth()
        ]);
        setOrders(remoteOrders);
        setProductionHeaders(remoteHeaders.map((header) => ({
          id: header.id,
          code: header.code,
          sku: header.sku,
          productName: header.productName ?? "",
          destination: header.destination ?? "",
          orderDate: header.orderDate ?? "",
          occurredDate: header.occurredDate ?? header.plannedDate ?? "",
          documentNo: header.documentNo ?? "",
          documentInNo: header.documentInNo ?? "",
          documentLineNo: header.documentLineNo ?? "",
          movementType: header.movementType ?? "issue",
          qtyPiece: header.qtyPiece ?? 0,
          plannedDate: header.plannedDate ?? "",
          plannedStage: header.plannedStage ?? "CKE",
          plannedWorker: header.plannedWorker ?? "",
          plannedMaterial: header.plannedMaterial ?? "Vàng 18K",
          materialSpec: header.materialSpec ?? "18KY",
          plannedGoldAge: header.plannedGoldAge ?? 0.75,
          plannedMaterialType: header.plannedMaterialType ?? "NL18K",
          deliveryStatus: header.deliveryStatus ?? "Chưa Hoàn Tất",
          orderMonth: header.orderMonth ?? toMonthCode(header.plannedDate ?? header.occurredDate ?? toIsoDate()),
          salesType: header.salesType ?? "SR",
          customerName: header.customerName ?? "",
          specification: header.specification ?? "",
          deadlineDate: header.deadlineDate ?? "",
          completedDate: header.completedDate ?? "",
          deliveredQty: header.deliveredQty ?? 0,
          actualProgressNote: header.actualProgressNote ?? "",
          completedWeightGram: header.completedWeightGram ?? 0,
          issued: header.issued ?? 0,
          returned: header.returned ?? 0,
          powder: header.powder ?? 0,
          transferred: header.transferred ?? 0,
          lossPeriod: header.lossPeriod ?? "",
          nxtPeriod: header.nxtPeriod ?? "",
          sourceMaterialName: header.sourceMaterialName ?? "",
          sourceName: header.sourceName ?? "",
          importSource: header.importSource ?? "",
          exportSource: header.exportSource ?? "",
          nxtLinkCode: header.nxtLinkCode ?? "",
          convertedIssueWeight: header.convertedIssueWeight ?? 0,
          convertedReturnWeight: header.convertedReturnWeight ?? 0,
          note: header.note ?? "",
          status: header.status,
          createdAt: header.createdAt
        })));
        setMaterials(remoteMaterials);
        setWorkers(remoteWorkers);
        setDatabaseHealth(remoteDatabaseHealth);
        setDraft((current) => ({
          ...current,
          material: remoteMaterials[0]?.name ?? current.material,
          worker: remoteWorkers[0]?.full_name ?? current.worker,
          stage: remoteWorkers[0]?.stage ? normalizeStageCode(remoteWorkers[0].stage) : current.stage
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
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(productionOrderHeaderKey, JSON.stringify(productionHeaders));
  }, [hasLoadedStorage, productionHeaders]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(auditKey, JSON.stringify(auditEvents));
  }, [auditEvents, hasLoadedStorage]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = status === "Tất cả" || order.status === status;
      const matchSelectedOrder = !selectedOrderCode || order.code === selectedOrderCode;
      const searchable = `${order.code} ${order.sku} ${order.material} ${order.worker} ${order.stage}`.toLowerCase();
      return matchSelectedOrder && matchStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [orders, query, selectedOrderCode, status]);

  const orderSummaries = useMemo(() => {
    const map = new Map<string, OrderSummary & { statuses: Status[] }>();

    for (const header of productionHeaders) {
      map.set(header.code, {
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
        issuedDefault: header.issued,
        returnedDefault: header.returned,
        powderDefault: header.powder,
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
        createdAt: header.createdAt,
        movementCount: 0,
        issued: 0,
        returned: 0,
        powder: 0,
        loss: 0,
        status: header.status,
        workers: [],
        materials: [],
        statuses: [header.status]
      });
    }

    for (const order of orders) {
      const current = map.get(order.code) ?? {
        code: order.code,
        sku: order.sku,
        productName: order.productName,
        destination: order.destination,
        orderDate: order.occurredDate,
        occurredDate: order.occurredDate,
        documentNo: order.documentNo,
        documentInNo: order.documentInNo,
        documentLineNo: order.documentLineNo,
        movementType: order.movementType,
        qtyPiece: order.qtyPiece,
        plannedDate: order.occurredDate,
        plannedStage: order.stage,
        plannedWorker: order.worker,
        plannedMaterial: order.material,
        materialSpec: "",
        plannedGoldAge: order.goldAge,
        plannedMaterialType: order.materialType,
        deliveryStatus: "",
        orderMonth: order.nxtPeriod,
        salesType: "",
        customerName: "",
        specification: "",
        deadlineDate: "",
        completedDate: "",
        deliveredQty: 0,
        actualProgressNote: "",
        completedWeightGram: 0,
        issuedDefault: order.issued,
        returnedDefault: order.returned,
        powderDefault: order.powder,
        transferred: order.transferred,
        lossPeriod: order.lossPeriod,
        nxtPeriod: order.nxtPeriod,
        sourceMaterialName: order.sourceMaterialName,
        sourceName: order.sourceName,
        importSource: order.importSource,
        exportSource: order.exportSource,
        nxtLinkCode: order.nxtLinkCode,
        convertedIssueWeight: order.convertedIssueWeight,
        convertedReturnWeight: order.convertedReturnWeight,
        note: "",
        movementCount: 0,
        issued: 0,
        returned: 0,
        powder: 0,
        loss: 0,
        status: order.status,
        workers: [],
        materials: [],
        statuses: []
      };

      current.movementCount += 1;
      current.productName = current.productName || order.productName;
      current.destination = current.destination || order.destination;
      current.orderDate = current.orderDate || order.occurredDate;
      current.occurredDate = current.occurredDate || order.occurredDate;
      current.documentNo = current.documentNo || order.documentNo;
      current.documentInNo = current.documentInNo || order.documentInNo;
      current.documentLineNo = current.documentLineNo || order.documentLineNo;
      current.movementType = current.movementType || order.movementType;
      current.qtyPiece = current.qtyPiece || order.qtyPiece;
      current.plannedDate = current.plannedDate || order.occurredDate;
      current.plannedStage = current.plannedStage || order.stage;
      current.plannedWorker = current.plannedWorker || order.worker;
      current.plannedMaterial = current.plannedMaterial || order.material;
      current.plannedGoldAge = current.plannedGoldAge || order.goldAge;
      current.plannedMaterialType = current.plannedMaterialType || order.materialType;
      current.issuedDefault = current.issuedDefault || order.issued;
      current.returnedDefault = current.returnedDefault || order.returned;
      current.powderDefault = current.powderDefault || order.powder;
      current.transferred = current.transferred || order.transferred;
      current.lossPeriod = current.lossPeriod || order.lossPeriod;
      current.nxtPeriod = current.nxtPeriod || order.nxtPeriod;
      current.sourceMaterialName = current.sourceMaterialName || order.sourceMaterialName;
      current.sourceName = current.sourceName || order.sourceName;
      current.importSource = current.importSource || order.importSource;
      current.exportSource = current.exportSource || order.exportSource;
      current.nxtLinkCode = current.nxtLinkCode || order.nxtLinkCode;
      current.convertedIssueWeight = current.convertedIssueWeight || order.convertedIssueWeight;
      current.convertedReturnWeight = current.convertedReturnWeight || order.convertedReturnWeight;
      current.issued += order.issued;
      current.returned += order.returned;
      current.powder += order.powder;
      current.loss += order.loss;
      current.statuses.push(order.status);
      if (!current.workers.includes(order.worker)) current.workers.push(order.worker);
      if (!current.materials.includes(order.material)) current.materials.push(order.material);
      current.status = getSummaryStatus(current.statuses);
      map.set(order.code, current);
    }

    return Array.from(map.values()).map(({ statuses: _statuses, ...summary }) => summary);
  }, [orders, productionHeaders]);

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

  const selectedOrderMovements = useMemo(() => {
    if (!selectedOrderSummary) return [];
    return orders.filter((order) => order.code === selectedOrderSummary.code);
  }, [orders, selectedOrderSummary]);

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
  }

  function addOrder() {
    void addOrderAsync();
  }

  async function addOrderAsync() {
    if (!draft.code.trim() || !draft.sku.trim() || !draft.worker.trim()) return;
    const existingSummary = orderSummaries.find((summary) => summary.code === draft.code.trim());
    const normalizedDraft = applyProductionBusinessRules(draft, orders);

    if (existingSummary && isClosedStatus(existingSummary.status)) {
      const detail = `Không thể thêm giao dịch vào LSX ${existingSummary.code} vì lệnh đã chốt`;
      pushAudit("blocked_create_movement", detail);
      setRemoteError(detail);
      return;
    }

    if (shouldForceDirectCharge(normalizedDraft.stage, normalizedDraft.status)) {
      const detail = "Trạng thái Xác định chỉ áp dụng cho công đoạn Cán kéo, Đan dây hoặc Biến.";
      pushAudit("blocked_direct_charge_stage", detail);
      setRemoteError(detail);
      return;
    }

    if (isLargeWeightMovement(normalizedDraft)) {
      pushAudit("large_weight_warning", `Giao dịch ${normalizedDraft.code} có trọng lượng trên 2000g, cần kiểm tra trước khi chốt.`);
    }

    const nextOrder = {
      ...normalizedDraft,
      id: crypto.randomUUID(),
      code: normalizedDraft.code.trim(),
      sku: normalizedDraft.sku.trim(),
      worker: normalizedDraft.worker.trim()
    };

    try {
      const savedOrder = isSupabaseConfigured ? await createMaterialMovement(nextOrder) : nextOrder;
      setOrders((current) => [savedOrder, ...current]);
      pushAudit("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`);
      await createAuditLog("create_movement", `Thêm giao dịch ${savedOrder.code} cho ${savedOrder.worker}`, savedOrder.id);
      setDraft(createEmptyOrder());
      setIsMovementFormOpen(false);
      setActiveModule("Lệnh sản xuất");
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không thêm được giao dịch");
    }
  }

  function pushAudit(action: string, detail: string) {
    setAuditEvents((current) => [
      {
        id: crypto.randomUUID(),
        action,
        detail,
        createdAt: new Date().toLocaleString("vi-VN")
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
      createdAt: createdAt ?? new Date().toLocaleString("vi-VN")
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

      setProductionHeaders((current) => [{ ...nextHeader, id: saved.id }, ...current]);
      setSelectedOrderCode(nextHeader.code);
      setProductionHeaderDraft(createEmptyProductionOrderHeaderDraft());
      setIsProductionFormOpen(false);
      pushAudit("create_production_order", `Tạo LSX ${nextHeader.code} - ${nextHeader.sku}`);
      await createAuditLog("create_production_order", `Tạo LSX ${nextHeader.code} - ${nextHeader.sku}`, saved.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không tạo được lệnh sản xuất");
    }
  }

  function startEditProductionOrder() {
    if (!selectedOrderSummary) return;

    if (isClosedStatus(selectedOrderSummary.status)) {
      setRemoteError(`LSX ${selectedOrderSummary.code} đã chốt nên không thể chỉnh sửa thông tin gốc.`);
      return;
    }

    setEditingProductionCode(selectedOrderSummary.code);
    setProductionHeaderDraft(buildProductionHeaderDraftFromSummary(selectedOrderSummary));
    setIsProductionFormOpen(true);
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
      setSelectedOrderCode(nextHeader.code);
      setEditingProductionCode(null);
      setProductionHeaderDraft(createEmptyProductionOrderHeaderDraft());
      setIsProductionFormOpen(false);
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
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(productionOrderHeaderKey);
    window.localStorage.removeItem(auditKey);
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
    setQuery("");
    setActiveModule("Lệnh sản xuất");
  }

  function openProductionOrderForEdit(code: string) {
    setSelectedOrderCode(code);
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
    if (!isProductionFormOpen) return null;

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
                        {productionOrderDestinations.map((item) => (
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
                          <option key={material.id} value={material.name}>{material.name}</option>
                        ))}
                      </SelectControl>
                    </FieldShell>
                  </div>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <FieldShell label="Loại nguyên liệu">
                      <SelectControl value={productionHeaderDraft.materialSpec} onChange={(value) => updateProductionHeaderDraft("materialSpec", value)}>
                        {productionOrderMaterialSpecOptions.map((item) => (
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
                {editingProductionCode ? `Đang sửa LSX ${editingProductionCode}.` : "Sau khi tạo LSX, chuyển sang Nhật ký NVL để cập nhật phát sinh và trạng thái vận hành."}
              </p>
              <div className="flex gap-2">
                {editingProductionCode ? (
                  <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink" type="button" onClick={cancelProductionHeaderEdit}>
                    Hủy
                  </button>
                ) : null}
                <button className="rounded-md bg-jade px-4 py-2 text-sm font-semibold text-white" type="button" onClick={saveProductionHeader}>
                  {editingProductionCode ? "Cập nhật LSX" : "Lưu LSX"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function prepareMovementForSelectedOrder() {
    if (!selectedOrderSummary) return;
    if (isClosedStatus(selectedOrderSummary.status)) {
      const detail = `Không thể thêm giao dịch vào LSX ${selectedOrderSummary.code} vì lệnh đã chốt`;
      pushAudit("blocked_create_movement", detail);
      setRemoteError(detail);
      return;
    }

    setDraft((current) => ({
      ...current,
      code: selectedOrderSummary.code,
      sku: selectedOrderSummary.sku,
      productName: selectedOrderSummary.productName ?? current.productName,
      destination: selectedOrderSummary.destination ?? current.destination,
      documentNo: selectedOrderSummary.documentNo ?? current.documentNo,
      documentInNo: selectedOrderSummary.documentInNo ?? current.documentInNo,
      documentLineNo: selectedOrderSummary.documentLineNo ?? current.documentLineNo,
      movementType: selectedOrderSummary.movementType ?? current.movementType,
      qtyPiece: selectedOrderSummary.qtyPiece ?? current.qtyPiece,
      occurredDate: selectedOrderSummary.occurredDate ?? selectedOrderSummary.plannedDate ?? current.occurredDate,
      stage: selectedOrderSummary.plannedStage ?? current.stage,
      stageStatus: current.stageStatus || "Đang thực hiện",
      worker: selectedOrderSummary.plannedWorker ?? current.worker,
      material: selectedOrderSummary.plannedMaterial ?? selectedOrderSummary.materials[0] ?? current.material,
      issued: selectedOrderSummary.issuedDefault ?? current.issued,
      returned: selectedOrderSummary.returnedDefault ?? current.returned,
      powder: selectedOrderSummary.powderDefault ?? current.powder,
      transferred: selectedOrderSummary.transferred ?? current.transferred,
      lossPeriod: selectedOrderSummary.lossPeriod ?? current.lossPeriod,
      nxtPeriod: selectedOrderSummary.nxtPeriod ?? current.nxtPeriod,
      goldAge: selectedOrderSummary.plannedGoldAge ?? current.goldAge,
      sourceMaterialName: selectedOrderSummary.sourceMaterialName ?? current.sourceMaterialName,
      importSource: selectedOrderSummary.importSource ?? current.importSource,
      exportSource: selectedOrderSummary.exportSource ?? current.exportSource,
      nxtLinkCode: selectedOrderSummary.nxtLinkCode ?? current.nxtLinkCode,
      convertedIssueWeight: selectedOrderSummary.convertedIssueWeight ?? current.convertedIssueWeight,
      convertedReturnWeight: selectedOrderSummary.convertedReturnWeight ?? current.convertedReturnWeight,
      status: selectedOrderSummary.status === "Đã chốt" ? "Treo nợ" : selectedOrderSummary.status
    }));
    setIsMovementFormOpen(true);
    setActiveModule("Nhật ký NVL");
  }

  function viewSelectedOrderMovements() {
    if (!selectedOrderSummary) return;
    setQuery(selectedOrderSummary.code);
    setStatus("Tất cả");
    setActiveModule("Nhật ký NVL");
  }

  function closeSelectedProductionOrder() {
    if (!selectedOrderSummary) return;
    if (isClosedStatus(selectedOrderSummary.status)) {
      const detail = `LSX ${selectedOrderSummary.code} đã được chốt trước đó`;
      pushAudit("blocked_close_production_order", detail);
      setRemoteError(detail);
      return;
    }

    for (const movement of selectedOrderMovements) {
      changeOrderStatus(movement.id, "Đã chốt");
    }
    setProductionHeaders((current) =>
      current.map((header) => (header.code === selectedOrderSummary.code ? { ...header, status: "Đã chốt" } : header))
    );
    pushAudit("close_production_order", `Chốt LSX ${selectedOrderSummary.code}`);
    void updateProductionOrderStatus(selectedOrderSummary.code, "Đã chốt").catch((error) => {
      setRemoteError(error instanceof Error ? error.message : "Không chốt được LSX");
    });
    void createAuditLog("close_production_order", `Chốt LSX ${selectedOrderSummary.code}`, selectedOrderMovements[0]?.id);
  }

  async function addMaterial() {
    if (!materialDraft.code.trim() || !materialDraft.name.trim()) return;

    try {
      const savedMaterial = await createMaterial({
        ...materialDraft,
        code: materialDraft.code.trim().toUpperCase(),
        name: materialDraft.name.trim(),
        category: materialDraft.category.trim() || "gold",
        unit: materialDraft.unit.trim() || "gram",
        purity: Number(materialDraft.purity)
      });
      setMaterials((current) => [...current, savedMaterial].sort((a, b) => a.code.localeCompare(b.code)));
      setMaterialDraft(createEmptyMaterialDraft());
      pushAudit("create_material", `Thêm NVL ${savedMaterial.code} - ${savedMaterial.name}`);
      await createAuditLog("create_material", `Thêm NVL ${savedMaterial.code} - ${savedMaterial.name}`, savedMaterial.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không thêm được NVL");
    }
  }

  async function addWorker() {
    if (!workerDraft.worker_code.trim() || !workerDraft.full_name.trim()) return;

    try {
      const savedWorker = await createWorker({
        ...workerDraft,
        worker_code: workerDraft.worker_code.trim().toUpperCase(),
        full_name: workerDraft.full_name.trim(),
        department: workerDraft.department.trim() || "San xuat",
        stage: workerDraft.stage?.trim() || null
      });
      setWorkers((current) => [...current, savedWorker].sort((a, b) => a.worker_code.localeCompare(b.worker_code)));
      setWorkerDraft(createEmptyWorkerDraft());
      pushAudit("create_worker", `Thêm thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`);
      await createAuditLog("create_worker", `Thêm thợ ${savedWorker.worker_code} - ${savedWorker.full_name}`, savedWorker.id);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Không thêm được thợ");
    }
  }

  const navItems = [
    ["Dashboard", ClipboardList],
    ["Lệnh sản xuất", Boxes],
    ["Nhật ký NVL", Scale],
    ["Giá & định mức", CircleDollarSign],
    ["Tồn hộp thợ", Boxes],
    ["Báo cáo hao hụt", FileWarning],
    ["Quy trình Google Sheet", Database],
    ["Audit log", History],
    ["Cấu hình", Settings2]
  ] as const;

  const isDashboard = activeModule === "Dashboard";
  const isProduction = activeModule === "Lệnh sản xuất";
  const isMovement = activeModule === "Nhật ký NVL";
  const isPricing = activeModule === "Giá & định mức";
  const isReport = activeModule === "Báo cáo hao hụt";
  const isWorkerBox = activeModule === "Tồn hộp thợ";
  const isGoogleSheetFlow = activeModule === "Quy trình Google Sheet";
  const isAudit = activeModule === "Audit log";
  const isSettings = activeModule === "Cấu hình";
  const draftOrderSummary = orderSummaries.find((summary) => summary.code === draft.code.trim());
  const isDraftForClosedOrder = Boolean(draftOrderSummary && isClosedStatus(draftOrderSummary.status));
  const normalizedDraftStage = normalizeStageCode(draft.stage);
  const isDraftLargeWeight = isLargeWeightMovement(draft);
  const isDraftDirectChargeInvalid = shouldForceDirectCharge(normalizedDraftStage, draft.status);

  return (
    <main className="min-h-screen">
      <div className="shell-grid min-h-screen">
        <aside className="border-r border-line bg-white/88 px-5 py-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-ink text-white">
              <Gem size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-jade">ASIANA GOLD</p>
              <h1 className="text-lg font-bold text-ink">QLKT K2</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(([label, Icon]) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${
                  activeModule === label ? "bg-ink text-white" : "text-zinc-700 hover:bg-paper hover:text-ink"
                }`}
                type="button"
                onClick={() => setActiveModule(label)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-md border border-line bg-paper p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Database size={16} />
              Supabase
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {isSupabaseConfigured
                ? "Đã cấu hình Supabase. Dữ liệu đang đọc/ghi database thật."
                : "Chưa cấu hình env. Demo đang dùng dữ liệu mẫu trong source."}
            </p>
            {isLoadingRemote ? <p className="mt-2 text-xs font-semibold text-jade">Đang tải dữ liệu...</p> : null}
            {remoteError ? <p className="mt-2 text-xs font-semibold text-red-700">{remoteError}</p> : null}
            {databaseHealth ? (
              <div className="mt-3 rounded-md border border-line/80 bg-white px-3 py-3 text-xs text-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">Kiểm tra dữ liệu</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      databaseHealth.usingRealSupabase ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {databaseHealth.usingRealSupabase ? "Supabase thật" : "Demo local"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-paper px-2 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">LSX</p>
                    <p className="mt-1 font-semibold text-ink">{databaseHealth.counts.productionOrders}</p>
                  </div>
                  <div className="rounded-md bg-paper px-2 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">NK NVL</p>
                    <p className="mt-1 font-semibold text-ink">{databaseHealth.counts.materialMovements}</p>
                  </div>
                  <div className="rounded-md bg-paper px-2 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">NVL</p>
                    <p className="mt-1 font-semibold text-ink">{databaseHealth.counts.materials}</p>
                  </div>
                  <div className="rounded-md bg-paper px-2 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Thợ</p>
                    <p className="mt-1 font-semibold text-ink">{databaseHealth.counts.workers}</p>
                  </div>
                </div>

                <p className={`mt-3 font-semibold ${databaseHealth.hasOperationalData ? "text-emerald-700" : "text-amber-700"}`}>
                  {databaseHealth.hasOperationalData
                    ? "Đã có dữ liệu vận hành để test gần thực tế."
                    : "Đã nối Supabase nhưng bảng nghiệp vụ chính còn ít hoặc chưa có dữ liệu test."}
                </p>
                {databaseHealth.errorMessage ? <p className="mt-2 text-[11px] text-red-700">{databaseHealth.errorMessage}</p> : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="px-5 py-5 md:px-8">
          <div className="content-shell">
          <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brass">Bản demo MVP</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Theo dõi tiến độ NVL và quản trị hao hụt</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Luồng thử nghiệm: LSX, xuất/nhập nguyên vật liệu, treo nợ/xác định, quy đổi hao hụt, quyết toán.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm"
                type="button"
                onClick={() => setActiveModule("Lệnh sản xuất")}
              >
                <Search size={16} />
                Tra cứu LSX
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white shadow-sm"
                type="button"
                onClick={() => setStatus("Treo nợ")}
              >
                <BadgeCheck size={16} />
                Xem treo nợ
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm"
                type="button"
                onClick={exportJson}
              >
                <Download size={16} />
                Xuất JSON
              </button>
            </div>
          </header>

          <div className={`${isDashboard || isReport ? "grid" : "hidden"} gap-4 py-5 sm:grid-cols-2 xl:grid-cols-4`}>
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

          <div className={`${isDashboard || isReport ? "grid" : "hidden"} mb-5 gap-4 rounded-md border border-line bg-white/94 p-4 shadow-sm md:grid-cols-4`}>
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
                <p className="mt-1 text-sm text-zinc-600">Chỉ giữ đúng các trường anh yêu cầu trong báo cáo hao hụt.</p>
              </div>
              <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={exportJson}>
                Xuất dữ liệu báo cáo
              </button>
            </div>

            <div className="mt-4 rounded-md border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-ink">Bảng hao hụt</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Các cột đang hiển thị: công đoạn, dòng phát sinh, loại vàng/NVL, tổng xuất, tổng nhập, hao hụt, hao hụt quy 24K, tên thợ, số LSX, mã hàng, trạng thái.
                  </p>
                </div>
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

          <WorkerBoxView isVisible={isWorkerBox} />

          <section className={`${isDashboard || isProduction ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
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
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white"
                    type="button"
                    onClick={() => setIsProductionFormOpen((current) => !current)}
                  >
                    <Plus size={16} />
                    Tạo LSX
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                    type="button"
                    onClick={() => setSelectedOrderCode(null)}
                  >
                    Xem tất cả LSX
                  </button>
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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {filteredOrderSummaries.map((summary) => (
                    <button
                      key={summary.code}
                      className={`rounded-md border p-4 text-left transition ${
                        selectedOrderCode === summary.code
                          ? "border-jade bg-emerald-50 shadow-sm"
                          : "border-line bg-white hover:border-jade/60 hover:bg-paper"
                      }`}
                      type="button"
                      onClick={() => selectProductionOrder(summary.code)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-ink">{summary.code}</p>
                          <p className="mt-1 truncate text-sm text-zinc-500">{summary.sku}</p>
                          {summary.productName ? <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{summary.productName}</p> : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[summary.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                            {summary.deliveryStatus || "Chưa cập nhật"}
                          </span>
                          <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[summary.status]}`}>
                            {summary.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Công đoạn</p>
                          <p className="mt-1 font-semibold text-ink">{summary.plannedStage || "-"}</p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Thợ</p>
                          <p className="mt-1 font-semibold text-ink">{summary.plannedWorker || "Chưa phân công"}</p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Deadline</p>
                          <p className="mt-1 font-semibold text-ink">{summary.deadlineDate || "-"}</p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Số lượng</p>
                          <p className="mt-1 font-semibold text-ink">{summary.qtyPiece || "-"}</p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Giao dịch</p>
                          <p className="mt-1 font-semibold text-ink">{summary.movementCount}</p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs uppercase text-zinc-500">Hao hụt</p>
                          <p className="mt-1 font-semibold text-ink">{formatGram(summary.loss)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <aside className="rounded-md border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brass">Chi tiết LSX đang chọn</p>
                  {selectedOrderSummary ? (
                    <div className="mt-3 space-y-4">
                      <div className="rounded-md border border-line bg-paper p-4">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="text-xl font-bold text-ink">{selectedOrderSummary.code}</h4>
                            <p className="mt-1 text-sm text-zinc-500">{selectedOrderSummary.sku}</p>
                            {selectedOrderSummary.productName ? <p className="mt-2 text-sm text-zinc-700">{selectedOrderSummary.productName}</p> : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[selectedOrderSummary.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                              Trạng thái LSX: {selectedOrderSummary.deliveryStatus || "-"}
                            </span>
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[selectedOrderSummary.status]}`}>
                              Trạng thái vận hành: {selectedOrderSummary.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <InfoMetric label="Tổng xuất" value={formatGram(selectedOrderSummary.issued)} />
                        <InfoMetric label="Tổng nhập" value={formatGram(selectedOrderSummary.returned)} />
                        <InfoMetric label="Bột" value={formatGram(selectedOrderSummary.powder)} />
                        <InfoMetric label="Hao hụt" value={formatGram(selectedOrderSummary.loss)} />
                      </div>

                      <DetailGroup
                        title="Tổng quan đơn"
                        items={[
                          ["Khách hàng", selectedOrderSummary.customerName || "-"],
                          ["Mã hàng", selectedOrderSummary.sku || "-"],
                          ["Tên hàng", selectedOrderSummary.productName || "-"],
                          ["Số lượng", String(selectedOrderSummary.qtyPiece || "-")],
                          ["SR/KH", selectedOrderSummary.salesType || "-"],
                          ["Quy cách", selectedOrderSummary.specification || "-"]
                        ]}
                      />

                      <DetailGroup
                        title="Kế hoạch & giao hàng"
                        items={[
                          ["Ngày đặt hàng", selectedOrderSummary.orderDate || "-"],
                          ["Ngày kế hoạch", selectedOrderSummary.plannedDate || "-"],
                          ["Deadline đơn hàng", selectedOrderSummary.deadlineDate || "-"],
                          ["Ngày HT", selectedOrderSummary.completedDate || "-"],
                          ["SL đã giao", String(selectedOrderSummary.deliveredQty || "-")],
                          ["TL hoàn tất (GR)", selectedOrderSummary.completedWeightGram ? formatGram(selectedOrderSummary.completedWeightGram) : "-"]
                        ]}
                      />

                      <DetailGroup
                        title="Nhân sự & công đoạn"
                        items={[
                          ["Nơi nhận", selectedOrderSummary.destination || "-"],
                          ["Công đoạn dự kiến", selectedOrderSummary.plannedStage || "-"],
                          ["Thợ dự kiến", selectedOrderSummary.plannedWorker || "Chưa phân công"],
                          ["NVL dự kiến", selectedOrderSummary.plannedMaterial || "-"],
                          ["Loại nguyên liệu", selectedOrderSummary.materialSpec || "-"],
                          ["Tuổi vàng", selectedOrderSummary.plannedGoldAge ? String(selectedOrderSummary.plannedGoldAge) : "-"]
                        ]}
                      />

                      <DetailGroup
                        title="Tiến độ thực"
                        items={[
                          ["Diễn giải tiến độ", selectedOrderSummary.actualProgressNote || "Chưa cập nhật"],
                          ["NVL đã phát sinh", selectedOrderSummary.materials.length ? selectedOrderSummary.materials.join(", ") : "Chưa có"],
                          ["Thợ đã nhận", selectedOrderSummary.workers.length ? selectedOrderSummary.workers.join(", ") : "Chưa có"]
                        ]}
                      />

                      {isClosedStatus(selectedOrderSummary.status) ? (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                          LSX đã chốt. Hệ thống đang khóa thêm, sửa trạng thái và xóa giao dịch để bảo vệ số liệu kế toán.
                        </div>
                      ) : null}

                      <div className="rounded-md border border-line bg-white px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-zinc-600">Giao dịch trong LSX</span>
                          <strong className="text-ink">{selectedOrderSummary.movementCount}</strong>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Xem chi tiết xuất, nhập và hao hụt tại màn Nhật ký NVL.
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                          type="button"
                          onClick={startEditProductionOrder}
                          disabled={isClosedStatus(selectedOrderSummary.status)}
                        >
                          Sửa LSX
                        </button>
                        <button
                          className="rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                          type="button"
                          onClick={prepareMovementForSelectedOrder}
                          disabled={isClosedStatus(selectedOrderSummary.status)}
                        >
                          Thêm giao dịch
                        </button>
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={viewSelectedOrderMovements}
                        >
                          Xem nhật ký
                        </button>
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                          type="button"
                          onClick={closeSelectedProductionOrder}
                          disabled={isClosedStatus(selectedOrderSummary.status)}
                        >
                          Chốt LSX
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-zinc-500">
                      Chưa có LSX phù hợp với bộ lọc hiện tại.
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </section>

          <div className={`${isMovement || isMovementFormOpen ? "unified-stack" : "hidden"}`}>
            <section className={`${isMovement ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">{activeModule === "Nhật ký NVL" ? "Nhật ký xuất/nhập NVL" : "Lệnh sản xuất & nhật ký NVL"}</h3>
                  <p className="mt-1 text-sm text-zinc-600">Lọc, kiểm tra trạng thái và thêm giao dịch demo theo LSX.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-jade px-3 text-sm font-semibold text-white shadow-sm"
                    type="button"
                    onClick={() => setIsMovementFormOpen(true)}
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
                <table className="w-full min-w-[1080px] border-collapse text-sm">
                  <thead>
                  <tr className="border-b border-line bg-paper text-left text-xs uppercase text-zinc-500">
                      <th className="px-3 py-3">Số CT</th>
                      <th className="px-3 py-3">Mã hàng</th>
                      <th className="px-3 py-3">Mã LSX</th>
                      <th className="px-3 py-3">NVL</th>
                      <th className="px-3 py-3">Thợ / công đoạn</th>
                      <th className="px-3 py-3 text-right">SL</th>
                      <th className="px-3 py-3 text-right">Xuất</th>
                      <th className="px-3 py-3 text-right">Nhập</th>
                      <th className="px-3 py-3 text-right">Chuyển</th>
                      <th className="px-3 py-3 text-right">Hao hụt</th>
                      <th className="px-3 py-3">Hao/NXT</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-line/70">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-ink">{order.documentNo || order.documentInNo || "-"}</div>
                          <div className="text-xs text-zinc-500">{order.occurredDate || "-"}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-ink">{order.sku}</div>
                          {order.productName ? <div className="text-xs text-zinc-500">{order.productName}</div> : null}
                        </td>
                        <td className="px-3 py-3 font-semibold text-ink">{order.code}</td>
                        <td className="px-3 py-3 text-zinc-700">{order.material}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-zinc-800">{order.worker}</div>
                          <div className="text-xs text-zinc-500">{order.stage}</div>
                        </td>
                        <td className="px-3 py-3 text-right text-zinc-700">{order.qtyPiece ?? "-"}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{formatGram(order.issued)}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{formatGram(order.returned)}</td>
                        <td className="px-3 py-3 text-right text-zinc-700">{formatGram(order.transferred ?? 0)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-ink">{formatGram(order.loss)}</td>
                        <td className="px-3 py-3 text-xs text-zinc-600">
                          <div>{order.lossPeriod || "-"}</div>
                          <div>{order.nxtPeriod || "-"}</div>
                        </td>
                        <td className="px-3 py-3">
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
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                              type="button"
                              onClick={() => openProductionOrderForEdit(order.code)}
                              disabled={isClosedStatus(order.status)}
                              title="Sửa thông tin LSX"
                            >
                              Sửa LSX
                            </button>
                            <button
                              className="inline-flex size-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                              type="button"
                              onClick={() => removeOrder(order.id)}
                              disabled={isClosedStatus(order.status)}
                              title="Xóa giao dịch"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className={`${isMovementFormOpen ? "block" : "hidden"}`}>
              {isMovementFormOpen ? (
                <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={() => setIsMovementFormOpen(false)} />
              ) : null}
              <section
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-line bg-white p-5 shadow-2xl transition-transform duration-200 ${
                  isMovementFormOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
                aria-hidden={!isMovementFormOpen}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Plus className="text-jade" size={18} />
                    <div>
                      <h3 className="text-base font-bold text-ink">Thêm giao dịch NVL</h3>
                      <p className="mt-1 text-sm text-zinc-600">Nhập thông tin theo mẫu Nhật ký sản xuất tháng.</p>
                    </div>
                  </div>
                  <button
                    className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
                    type="button"
                    onClick={() => setIsMovementFormOpen(false)}
                    title="Đóng form"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin LSX</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Mã LSX">
                        <input className={fieldControlClass} placeholder="VD: DHAG-260713" value={draft.code} onChange={(e) => updateDraft("code", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="Mã hàng">
                        <input className={fieldControlClass} placeholder="VD: RG750Y" value={draft.sku} onChange={(e) => updateDraft("sku", e.target.value)} />
                      </FieldShell>
                    </div>
                    <div className="mt-3">
                      <FieldShell label="Tên hàng / diễn giải">
                        <input className={fieldControlClass} placeholder="Tên sản phẩm hoặc ghi chú nhận diện" value={draft.productName ?? ""} onChange={(e) => updateDraft("productName", e.target.value)} />
                      </FieldShell>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin chứng từ</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Ngày nghiệp vụ" hint="Ngày phát sinh xuất/nhập NVL.">
                        <input className={fieldControlClass} type="date" value={draft.occurredDate ?? ""} onChange={(e) => updateDraft("occurredDate", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="Nơi nhận">
                        <select className={fieldControlClass} value={draft.destination ?? ""} onChange={(e) => updateDraft("destination", e.target.value)}>
                          <option value="">Chọn nơi nhận</option>
                          {journalDestinations.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </FieldShell>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <FieldShell label="Số CT xuất">
                        <input className={fieldControlClass} placeholder="Tự sinh nếu bỏ trống" value={draft.documentNo ?? ""} onChange={(e) => updateDraft("documentNo", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="Số CT nhập">
                        <input className={fieldControlClass} placeholder="Nếu có" value={draft.documentInNo ?? ""} onChange={(e) => updateDraft("documentInNo", e.target.value)} />
                      </FieldShell>
                      <FieldShell label="STT dòng">
                        <input className={fieldControlClass} placeholder="VD: 1" value={draft.documentLineNo ?? ""} onChange={(e) => updateDraft("documentLineNo", e.target.value)} />
                      </FieldShell>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Công đoạn xử lý</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FieldShell label="Công đoạn">
                        <select className={fieldControlClass} value={draft.stage} onChange={(e) => updateDraft("stage", e.target.value)}>
                          {journalStages.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </FieldShell>
                      <FieldShell label="Trạng thái công đoạn">
                        <select className={fieldControlClass} value={draft.stageStatus ?? "Đang thực hiện"} onChange={(e) => updateDraft("stageStatus", e.target.value)}>
                          {movementStageStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </FieldShell>
                    </div>
                    <div className="mt-3">
                      <FieldShell label="Thợ phụ trách" hint="Danh sách thợ được lọc theo công đoạn nếu có dữ liệu.">
                        <select
                          className={fieldControlClass}
                          value={draft.worker}
                          onChange={(e) => {
                            const worker = workers.find((item) => item.full_name === e.target.value);
                            updateDraft("worker", e.target.value);
                            if (worker?.stage) updateDraft("stage", normalizeStageCode(worker.stage));
                          }}
                        >
                          <option value="">Chọn thợ</option>
                          {workerOptionsForDraft.map((worker) => (
                            <option key={worker.id} value={worker.full_name}>{worker.worker_code} - {worker.full_name}</option>
                          ))}
                        </select>
                      </FieldShell>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Số lượng & trọng lượng</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                      <FieldShell label="Trạng thái tính hao">
                        <select className={fieldControlClass} value={draft.status} onChange={(e) => updateDraft("status", e.target.value as Status)}>
                          {movementLossStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </FieldShell>
                    </div>
                    <div className="mt-3">
                      <FieldShell label="Diễn giải giao dịch">
                        <select className={fieldControlClass} value={draft.sourceMaterialName ?? ""} onChange={(e) => updateDraft("sourceMaterialName", e.target.value)}>
                          <option value="">Chọn diễn giải giao dịch</option>
                          {journalMovementReasons.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </FieldShell>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-zinc-500">Thông tin NXT / tính hao</p>
                    <div className="mt-3 grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="Tháng tính hao" hint="Kỳ dùng để quyết toán hao hụt.">
                          <input className={fieldControlClass} type="month" value={draft.lossPeriod ?? ""} onChange={(e) => updateDraft("lossPeriod", e.target.value)} />
                        </FieldShell>
                        <FieldShell label="Tháng NXT" hint="Kỳ dùng cho báo cáo nhập xuất tồn.">
                          <input className={fieldControlClass} type="month" value={draft.nxtPeriod ?? ""} onChange={(e) => updateDraft("nxtPeriod", e.target.value)} />
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FieldShell label="Tuổi vàng">
                          <select className={fieldControlClass} value={String(draft.goldAge ?? "")} onChange={(e) => updateDraft("goldAge", Number(e.target.value))}>
                            <option value="">Chọn tuổi vàng</option>
                            {movementGoldAgeOptions.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        </FieldShell>
                        <FieldShell label="Mã nối NXT">
                          <select className={fieldControlClass} value={draft.nxtLinkCode ?? ""} onChange={(e) => updateDraft("nxtLinkCode", e.target.value)}>
                            <option value="">Chọn mã nối</option>
                            {sourceMaterialOptions.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="Nguồn nhập">
                          <select className={fieldControlClass} value={draft.importSource ?? ""} onChange={(e) => updateDraft("importSource", e.target.value)}>
                            <option value="">Chọn nguồn nhập</option>
                            {movementImportSourceOptions.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        </FieldShell>
                        <FieldShell label="Nguồn xuất">
                          <select className={fieldControlClass} value={draft.exportSource ?? ""} onChange={(e) => updateDraft("exportSource", e.target.value)}>
                            <option value="">Chọn nguồn xuất</option>
                            {movementExportSourceOptions.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
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
                  </div>
                  {isDraftForClosedOrder ? (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                      LSX này đã chốt. Muốn nhập thêm cần mở lại lệnh trước.
                    </div>
                  ) : null}
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                    type="button"
                    onClick={addOrder}
                    disabled={isDraftForClosedOrder || isDraftDirectChargeInvalid}
                  >
                    <Plus size={16} />
                    Thêm vào bảng
                  </button>
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

          <GoogleSheetFlowView isVisible={isGoogleSheetFlow} />

          <AuditLogView isVisible={isAudit} events={auditEvents} />

          <div className={`${isPricing || isSettings ? "unified-stack" : "hidden"} pb-8 pt-5`}>
            <PriceTableView isVisible={isPricing} rows={priceRows} />

            <MasterDataSettingsView
              isVisible={isSettings}
              materials={materials}
              workers={workers}
              materialDraft={materialDraft}
              workerDraft={workerDraft}
              setMaterialDraft={setMaterialDraft}
              setWorkerDraft={setWorkerDraft}
              onAddMaterial={addMaterial}
              onAddWorker={addWorker}
            />
          </div>
          {renderProductionFormOverlay()}
          </div>
        </section>
      </div>
    </main>
  );
}




