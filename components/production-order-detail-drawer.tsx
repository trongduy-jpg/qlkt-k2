"use client";

import type { ReactNode } from "react";
import { Link2, X } from "lucide-react";
import {
  DrawerHeaderMeta,
  DetailGroup,
  DetailInlineList
} from "@/components/production-ui";
import { formatDisplayDate } from "@/lib/production-business-rules";
import {
  deliveryStatusClass,
  isClosedStatus,
  statusClass
} from "@/lib/production-helpers";
import {
  formatGoldAgeLabel,
  formatMaterialTypeLabel,
  productionOrderDeliveryStatusOptions
} from "@/lib/production-journal-options";
import type { OrderSummary } from "@/lib/production-types";
import type { SelectedOrderDetail } from "@/lib/production-workflow";

type ProductionOrderDetailDrawerProps = {
  isOpen: boolean;
  isEditing: boolean;
  detail: SelectedOrderDetail | null;
  summary: OrderSummary | null;
  editForm: ReactNode;
  parentOrder: OrderSummary | null;
  childOrders: OrderSummary[];
  onClose: () => void;
  onSelectOrder: (code: string, itemSku?: string) => void;
  onViewMovements: () => void;
  onSaveEdit: () => void;
  onCloseOrder: () => void;
  onReopenOrder: () => void;
  onQuickDeliveryStatusChange: (status: string) => void;
};

export function ProductionOrderDetailDrawer({
  isOpen,
  isEditing,
  detail,
  summary,
  editForm,
  parentOrder,
  childOrders,
  onClose,
  onSelectOrder,
  onViewMovements,
  onSaveEdit,
  onCloseOrder,
  onReopenOrder,
  onQuickDeliveryStatusChange
}: ProductionOrderDetailDrawerProps) {
  if (!detail || !summary) return null;

  const isClosedSelected = isClosedStatus(summary.status);

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm" onClick={onClose} /> : null}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-white shadow-2xl transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">Chi tiết LSX</p>
            <h3 className="font-display mt-1 truncate text-2xl font-semibold text-ink">{summary.code}</h3>
            <p className="mt-1 text-sm leading-5 text-zinc-600">
              {isEditing
                ? isClosedSelected
                  ? "LSX đã chốt, các trường bên dưới đang bị khoá để bảo vệ số liệu."
                  : "Chỉnh sửa thông tin gốc của LSX, sau đó lưu để đồng bộ lại danh sách."
                : detail.productName || "Chọn thao tác tiếp theo cho LSX đang xem."}
            </p>
            <DrawerHeaderMeta
              items={[
                { label: "Mã hàng", value: detail.sku || "Chưa cập nhật" },
                { label: "Công đoạn", value: detail.stage || "Chưa có công đoạn", tone: detail.stage ? "sky" : "amber" },
                { label: "Thợ", value: detail.worker || "Chưa phân công", tone: detail.worker ? "default" : "amber" },
                { label: "Giao dịch", value: `${detail.movementCount} dòng`, tone: detail.movementCount > 0 ? "jade" : "default" }
              ]}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[detail.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                LSX: {detail.deliveryStatus || "-"}
              </span>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[detail.operationalStatus]}`}>
                Vận hành: {detail.operationalStatus}
              </span>
            </div>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
            type="button"
            onClick={onClose}
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        {isEditing ? (
          <fieldset disabled={isClosedSelected} className="m-0 min-w-0 shrink-0 border-b border-line bg-paper px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Trạng thái LSX</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {productionOrderDeliveryStatusOptions.map((option) => {
                const isActive = summary.deliveryStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive
                        ? (deliveryStatusClass[option.value] ?? "bg-ink text-white ring-ink")
                        : "bg-white text-zinc-600 ring-line hover:bg-paper"
                    }`}
                    disabled={isActive}
                    onClick={() => onQuickDeliveryStatusChange(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEditing ? (
            <fieldset disabled={isClosedSelected} className="m-0 min-w-0 border-0 p-0">{editForm}</fieldset>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-xl font-bold text-ink">{detail.code}</h4>
                    <p className="mt-1 text-sm text-zinc-500">{detail.sku}</p>
                    {detail.productName && detail.productName !== detail.sku ? (
                      <p className="mt-2 text-sm text-zinc-700">{detail.productName}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[detail.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                      Trạng thái LSX: {detail.deliveryStatus || "-"}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[detail.operationalStatus]}`}>
                      Trạng thái vận hành: {detail.operationalStatus}
                    </span>
                    <span className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-zinc-600">
                      {detail.movementCount} giao dịch
                    </span>
                  </div>

                  {parentOrder || childOrders.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-jade/40 bg-jade/5 px-3 py-2 text-xs">
                      <Link2 size={14} className="shrink-0 text-jade" />
                      {parentOrder ? (
                        <span className="text-zinc-600">
                          Phát sinh từ LSX{" "}
                          <button
                            type="button"
                            className="font-semibold text-jade underline hover:text-jade/80"
                            onClick={() => onSelectOrder(parentOrder.code, parentOrder.sku)}
                          >
                            {parentOrder.code}
                          </button>
                          {" "}(cùng khách hàng{parentOrder.customerName ? `: ${parentOrder.customerName}` : ""})
                        </span>
                      ) : null}
                      {childOrders.length > 0 ? (
                        <span className="text-zinc-600">
                          {parentOrder ? " · " : ""}
                          Đã tạo {childOrders.length} đơn khác cho khách hàng này:{" "}
                          {childOrders.map((child, index) => (
                            <span key={child.code}>
                              {index > 0 ? ", " : ""}
                              <button
                                type="button"
                                className="font-semibold text-jade underline hover:text-jade/80"
                                onClick={() => onSelectOrder(child.code, child.sku)}
                              >
                                {child.code}
                              </button>
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <DetailGroup
                  title="Tổng quan đơn"
                  items={[
                    ["Khách hàng", detail.customerName || "-"],
                    ["Mã hàng", detail.sku || "-"],
                    ["Số lượng", detail.qtyPiece !== null ? String(detail.qtyPiece) : "-"],
                    ["Phân loại KH", detail.salesType || "-"]
                  ]}
                />

                <DetailGroup
                  title="Kế hoạch"
                  items={[
                    ["Ngày kế hoạch", formatDisplayDate(detail.plannedDate) || "-"],
                    ["Deadline", formatDisplayDate(detail.deadlineDate) || "-"],
                    ["Ngày HT", formatDisplayDate(detail.completedDate) || "-"],
                    ["SL đã giao", detail.deliveredQty !== null ? String(detail.deliveredQty) : "-"]
                  ]}
                />
              </div>

              <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vận hành hiện tại</p>
                <div className="mt-3">
                  <DetailInlineList
                    items={[
                      ["Nơi nhận", detail.destination || "-"],
                      ["Công đoạn", detail.stage || "-"],
                      ["Thợ", detail.worker || "Chưa phân công"],
                      ["NVL dự kiến", detail.plannedMaterial || "-"],
                      ["Loại nguyên liệu", formatMaterialTypeLabel(detail.plannedMaterialType)],
                      ["Tuổi vàng", formatGoldAgeLabel(detail.goldAgeValue)],
                      ["NVL đã phát sinh", detail.movementMaterials.length ? detail.movementMaterials.join(", ") : "Chưa có"],
                      ["Thợ đã nhận", detail.movementWorkers.length ? detail.movementWorkers.join(", ") : "Chưa có"]
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến độ thực</p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {detail.actualProgressNote || "Chưa cập nhật diễn giải tiến độ."}
                </p>
              </div>

              {isClosedStatus(summary.status) ? (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                  LSX đã chốt nên đang khóa thêm/sửa/xóa giao dịch để bảo vệ số liệu kế toán. Nếu có phát sinh mới, bấm "Mở lại LSX" để chỉnh sửa, sau đó chốt lại.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-line bg-white px-5 py-4">
          {isEditing && isClosedSelected ? (
            <button
              className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
              type="button"
              onClick={onReopenOrder}
              title="Mở lại LSX để chỉnh sửa thông tin gốc khi có phát sinh mới"
            >
              Mở lại LSX
            </button>
          ) : isEditing ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onSaveEdit}
              >
                Lưu
              </button>
              <button
                className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={onCloseOrder}
              >
                Chốt LSX
              </button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onViewMovements}
              >
                Mở NK NVL
              </button>
              <button
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
                type="button"
                onClick={onReopenOrder}
                title="Mở lại LSX để chỉnh sửa thông tin gốc khi có phát sinh mới"
              >
                Mở lại LSX
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
