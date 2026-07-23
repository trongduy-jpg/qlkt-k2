"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AppUser } from "@/lib/auth-service";
import { productionOrders, type ProductionOrder } from "@/lib/demo-data";
import {
  loadDatabaseHealth,
  loadMaterials,
  loadProductionOrderHeaders,
  loadProductionOrderItems,
  loadProductionOrders,
  loadReferenceOptions,
  loadStages,
  loadWorkers,
  type DatabaseHealth,
  type MaterialMaster,
  type ProductionOrderItem,
  type ReferenceOption,
  type StageMaster,
  type WorkerMaster
} from "@/lib/material-service";
import {
  mapRemoteHeaderToProductionHeader,
  mergeMovementWithContext,
  mergeProductionHeaderWithDraft
} from "@/lib/production-mappers";
import { pickNumber, pickText } from "@/lib/production-helpers";
import type { ProductionOrderHeader } from "@/lib/production-types";
import { isSupabaseConfigured } from "@/lib/supabase";

type MovementDraftCache = Record<string, ProductionOrder>;
type ProductionHeaderDraft = Omit<ProductionOrderHeader, "id" | "createdAt">;
type ProductionHeaderDraftCache = Record<string, ProductionHeaderDraft>;

export type ReloadOperationalDataOptions = {
  movementDraftOverrides?: MovementDraftCache;
  productionHeaderDraftOverrides?: ProductionHeaderDraftCache;
};

type UseOperationalDataParams = {
  movementDraftCache: MovementDraftCache;
  productionHeaderDraftCache: ProductionHeaderDraftCache;
};

type OperationalDataState = {
  orders: ProductionOrder[];
  setOrders: Dispatch<SetStateAction<ProductionOrder[]>>;
  productionHeaders: ProductionOrderHeader[];
  setProductionHeaders: Dispatch<SetStateAction<ProductionOrderHeader[]>>;
  materials: MaterialMaster[];
  setMaterials: Dispatch<SetStateAction<MaterialMaster[]>>;
  workers: WorkerMaster[];
  setWorkers: Dispatch<SetStateAction<WorkerMaster[]>>;
  stages: StageMaster[];
  setStages: Dispatch<SetStateAction<StageMaster[]>>;
  referenceOptions: ReferenceOption[];
  setReferenceOptions: Dispatch<SetStateAction<ReferenceOption[]>>;
  appUsers: AppUser[];
  setAppUsers: Dispatch<SetStateAction<AppUser[]>>;
  databaseHealth: DatabaseHealth | null;
  setDatabaseHealth: Dispatch<SetStateAction<DatabaseHealth | null>>;
  isLoadingRemote: boolean;
  setIsLoadingRemote: Dispatch<SetStateAction<boolean>>;
  remoteError: string | null;
  setRemoteError: Dispatch<SetStateAction<string | null>>;
  reloadOperationalData: (options?: ReloadOperationalDataOptions) => Promise<{
    remoteMaterials: MaterialMaster[];
    remoteWorkers: WorkerMaster[];
  } | void>;
};

export function useOperationalData({
  movementDraftCache,
  productionHeaderDraftCache
}: UseOperationalDataParams): OperationalDataState {
  const [orders, setOrders] = useState<ProductionOrder[]>(productionOrders);
  const [productionHeaders, setProductionHeaders] = useState<ProductionOrderHeader[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [workers, setWorkers] = useState<WorkerMaster[]>([]);
  const [stages, setStages] = useState<StageMaster[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOption[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  async function reloadOperationalData(options?: ReloadOperationalDataOptions) {
    if (!isSupabaseConfigured) return;

    const [
      remoteOrders,
      remoteHeaders,
      remoteItems,
      remoteMaterials,
      remoteWorkers,
      remoteStages,
      remoteReferenceOptions,
      remoteDatabaseHealth
    ] = await Promise.all([
      loadProductionOrders(),
      loadProductionOrderHeaders(),
      loadProductionOrderItems(),
      loadMaterials(),
      loadWorkers(),
      loadStages(),
      loadReferenceOptions(),
      loadDatabaseHealth()
    ]);

    // Gom Ma hang theo Ma LSX de gan vao tung header.
    const itemsByCode = new Map<string, ProductionOrderItem[]>();
    for (const item of remoteItems) {
      const list = itemsByCode.get(item.orderCode) ?? [];
      list.push(item);
      itemsByCode.set(item.orderCode, list);
    }

    const mergedHeaderDrafts = {
      ...productionHeaderDraftCache,
      ...(options?.productionHeaderDraftOverrides ?? {})
    };
    const mappedHeaders = remoteHeaders
      .map(mapRemoteHeaderToProductionHeader)
      .map((header) => ({ ...header, items: itemsByCode.get(header.code) ?? [] }))
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
    if (isSupabaseConfigured) return;

    let isMounted = true;

    void Promise.all([loadMaterials(), loadWorkers()]).then(([localMaterials, localWorkers]) => {
      if (!isMounted) return;

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

    return () => {
      isMounted = false;
    };
  }, []);

  return {
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
    setDatabaseHealth,
    isLoadingRemote,
    setIsLoadingRemote,
    remoteError,
    setRemoteError,
    reloadOperationalData
  };
}
