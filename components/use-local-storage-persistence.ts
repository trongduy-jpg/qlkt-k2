"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ProductionOrder } from "@/lib/domain/production";
import type { AuditEvent, ProductionOrderHeader } from "@/lib/production-types";
import { productionOrders } from "@/lib/demo-data";

export const storageKey = "qlkt-k2-material-orders";
export const productionOrderHeaderKey = "qlkt-k2-production-order-headers";
export const auditKey = "qlkt-k2-audit-events";
export const movementDraftCacheKey = "qlkt-k2-movement-draft-cache";
export const productionHeaderDraftCacheKey = "qlkt-k2-production-header-draft-cache";

type HeaderDraft = Omit<ProductionOrderHeader, "id" | "createdAt">;

export type UseLocalStoragePersistenceDeps = {
  orders: ProductionOrder[];
  setOrders: Dispatch<SetStateAction<ProductionOrder[]>>;
  productionHeaders: ProductionOrderHeader[];
  setProductionHeaders: Dispatch<SetStateAction<ProductionOrderHeader[]>>;
  auditEvents: AuditEvent[];
  setAuditEvents: Dispatch<SetStateAction<AuditEvent[]>>;
  movementDraftCache: Record<string, ProductionOrder>;
  setMovementDraftCache: Dispatch<SetStateAction<Record<string, ProductionOrder>>>;
  productionHeaderDraftCache: Record<string, HeaderDraft>;
  setProductionHeaderDraftCache: Dispatch<SetStateAction<Record<string, HeaderDraft>>>;
};

// Toan bo doc/ghi localStorage (du lieu demo khi chua co Supabase + cache
// draft giua cac lan reload) duoc gom vao 1 hook rieng, tach khoi
// MaterialDashboard. hasLoadedStorage duoc doc mount 1 lan, cac effect
// persist chi chay SAU khi da doc xong (tranh ghi de du lieu that bang gia
// tri rong luc component moi mount).
export function useLocalStoragePersistence(deps: UseLocalStoragePersistenceDeps) {
  const {
    orders,
    setOrders,
    productionHeaders,
    setProductionHeaders,
    auditEvents,
    setAuditEvents,
    movementDraftCache,
    setMovementDraftCache,
    productionHeaderDraftCache,
    setProductionHeaderDraftCache
  } = deps;

  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

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
        const parsedHeaders = JSON.parse(savedProductionHeaders) as ProductionOrderHeader[];
        // Chuan hoa lai "items" cho tung LSX phuc hoi tu cache - cache co
        // the duoc luu tu TRUOC KHI tinh nang "nhieu Ma hang/LSX" ra doi
        // (truoc khi truong items ton tai), khien header.items la undefined
        // va lam vo toan bo trang khi buildOrderSummaries doc
        // header.items.length (xem production-summary.ts).
        setProductionHeaders(
          Array.isArray(parsedHeaders)
            ? parsedHeaders.map((header) => ({ ...header, items: Array.isArray(header.items) ? header.items : [] }))
            : []
        );
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
          JSON.parse(savedProductionHeaderDraftCache) as Record<string, HeaderDraft>
        );
      } catch {
        setProductionHeaderDraftCache({});
      }
    }

    setHasLoadedStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { hasLoadedStorage, setHasLoadedStorage };
}
