"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ProductionOrder, Status } from "@/lib/demo-data";
import type { OrderSummary, ProductionOrderHeader } from "@/lib/production-types";
import {
  formatDisplayDateTime,
  getCarryOverLossPeriod,
  toIsoDate,
  toMonthCode
} from "@/lib/production-business-rules";
import { createEmptyProductionOrderHeaderDraft } from "@/lib/production-mappers";
import { createAuditLog, createProductionOrderHeader, updateProductionOrderHeader } from "@/lib/material-service";
import { isSupabaseConfigured } from "@/lib/supabase";

type HeaderDraft = Omit<ProductionOrderHeader, "id" | "createdAt">;
type HeaderDraftCache = Record<string, HeaderDraft>;

// Toan bo state + handler cua man "Lenh san xuat" (form header LSX) duoc
// gom vao 1 hook, tach khoi MaterialDashboard. Cac state van do dashboard
// so huu (productionHeaders/cache/selectedOrderCode dung o nhieu noi) duoc
// truyen vao qua deps; hook chi so huu draft + editing code cua form.

export type ProductionOrdersDeps = {
  orderSummaries: OrderSummary[];
  productionHeaders: ProductionOrderHeader[];
  productionHeaderDraftCache: HeaderDraftCache;
  setProductionHeaderDraftCache: Dispatch<SetStateAction<HeaderDraftCache>>;
  setProductionHeaders: Dispatch<SetStateAction<ProductionOrderHeader[]>>;
  setOrders: Dispatch<SetStateAction<ProductionOrder[]>>;
  setSelectedOrderCode: (code: string | null) => void;
  setRecentCreatedOrderCode: (code: string | null) => void;
  isProductionFormOpen: boolean;
  setIsProductionFormOpen: (open: boolean) => void;
  reloadOperationalData: (options?: {
    productionHeaderDraftOverrides?: HeaderDraftCache;
  }) => Promise<unknown>;
  pushAudit: (action: string, detail: string) => void;
  setRemoteError: (message: string | null) => void;
};

export function useProductionOrders(deps: ProductionOrdersDeps) {
  const {
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
  } = deps;

  const [productionHeaderDraft, setProductionHeaderDraft] = useState<HeaderDraft>(createEmptyProductionOrderHeaderDraft());
  const [editingProductionCode, setEditingProductionCode] = useState<string | null>(null);

  // Luu draft header vao cache moi khi form dang mo va draft thay doi, de
  // giu lai gia tri dang nhap khi reload/chuyen qua lai giua cac LSX.
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
  }, [isProductionFormOpen, productionHeaderDraft, setProductionHeaderDraftCache]);

  function updateProductionHeaderDraft<K extends keyof HeaderDraft>(key: K, value: HeaderDraft[K]) {
    setProductionHeaderDraft((current) => {
      const next = { ...current, [key]: value };
      const occurredDate = key === "occurredDate" || key === "plannedDate" ? String(value || toIsoDate()) : next.occurredDate || next.plannedDate || toIsoDate();
      const issued = key === "issued" ? Number(value) : next.issued;
      const returned = key === "returned" ? Number(value) : next.returned;
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
      status: header.status,
      parentOrderCode: header.parentOrderCode
    };
  }

  function buildProductionHeaderDraftFromSummary(summary: OrderSummary): HeaderDraft {
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
      status: summary.status,
      parentOrderCode: summary.parentOrderCode || ""
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

  return {
    productionHeaderDraft,
    setProductionHeaderDraft,
    editingProductionCode,
    setEditingProductionCode,
    updateProductionHeaderDraft,
    buildProductionHeaderDraftFromSummary,
    createProductionOrderFromHeader,
    cancelProductionHeaderEdit,
    saveProductionHeader,
    updateProductionOrderFromHeader
  };
}
