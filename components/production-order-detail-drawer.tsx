"use client";

import type { ReactNode } from "react";
import { Link2, X } from "lucide-react";
import {
  DetailGroup,
  DetailInlineList,
  InfoMetric
} from "@/components/production-ui";
import { formatDisplayDate } from "@/lib/production-business-rules";
import {
  deliveryStatusClass,
  formatGram,
  isClosedStatus,
  statusClass
} from "@/lib/production-helpers";
import type { OrderSummary } from "@/lib/production-types";
import type { SelectedOrderDetail } from "@/lib/production-workflow";
import type { StageProgressItem } from "@/lib/production-summary";

type MovementStats = {
  issued: number;
  returned: number;
  powder: number;
  loss: number;
};

type ProductionOrderDetailDrawerProps = {
  isOpen: boolean;
  isEditing: boolean;
  detail: SelectedOrderDetail | null;
  summary: OrderSummary | null;
  editForm: ReactNode;
  movementStats: MovementStats;
  stageProgress: StageProgressItem[];
  parentOrder: OrderSummary | null;
  childOrders: OrderSummary[];
  onClose: () => void;
  onSelectOrder: (code: string) => void;
  onOpenMovementForStage: (stageCode: string) => void;
  onViewMovements: () => void;
  onSaveEdit: () => void;
  onCloseOrder: () => void;
  onReopenOrder: () => void;
  onStartNewOrderForSameCustomer: () => void;
};

export function ProductionOrderDetailDrawer({
  isOpen,
  isEditing,
  detail,
  summary,
  editForm,
  movementStats,
  stageProgress,
  parentOrder,
  childOrders,
  onClose,
  onSelectOrder,
  onOpenMovementForStage,
  onViewMovements,
  onSaveEdit,
  onCloseOrder,
  onReopenOrder,
  onStartNewOrderForSameCustomer
}: ProductionOrderDetailDrawerProps) {
  if (!detail || !summary) return null;

  const completedStageCount = stageProgress.filter((item) => item.movementCount > 0).length;

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm" onClick={onClose} /> : null}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-white shadow-2xl transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">Chi tiết LSX</p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-ink">{summary.code}</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {isEditing
                ? "Chỉnh sửa thông tin gốc của LSX, sau đó lưu để đồng bộ lại danh sách."
                : "Panel này chỉ giữ thông tin phục vụ quyết định và thao tác tiếp theo."}
            </p>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
            type="button"
            onClick={onClose}
            title="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEditing ? (
            editForm
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-line bg-paper p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-xl font-bold text-ink">{detail.code}</h4>
                    <p className="mt-1 text-sm text-zinc-500">{detail.sku}</p>
                    {detail.productName ? <p className="mt-2 text-sm text-zinc-700">{detail.productName}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[detail.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                      Trạng thái LSX: {detail.deliveryStatus || "-"}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[detail.operationalStatus]}`}>
                      Trạng thái vận hành: {detail.operationalStatus}
                    </span>
                    <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
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
                            onClick={() => onSelectOrder(parentOrder.code)}
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
                                onClick={() => onSelectOrder(child.code)}
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

              <div className="grid grid-cols-2 gap-3">
                <InfoMetric label="Tổng xuất" value={formatGram(movementStats.issued)} />
                <InfoMetric label="Tổng nhập" value={formatGram(movementStats.returned)} />
                <InfoMetric label="Bột" value={formatGram(movementStats.powder)} />
                <InfoMetric label="Hao hụt" value={formatGram(movementStats.loss)} />
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <DetailGroup
                  title="Tổng quan đơn"
                  items={[
                    ["Khách hàng", detail.customerName || "-"],
                    ["Mã hàng", detail.sku || "-"],
                    ["Số lượng", detail.qtyPiece !== null ? String(detail.qtyPiece) : "-"],
                    ["SR/KH", detail.salesType || "-"]
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

              <div className="rounded-md border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vận hành hiện tại</p>
                  <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                    {detail.movementCount} giao dịch
                  </span>
                </div>
                <div className="mt-3">
                  <DetailInlineList
                    items={[
                      ["Nơi nhận", detail.destination || "-"],
                      ["Công đoạn", detail.stage || "-"],
                      ["Thợ", detail.worker || "Chưa phân công"],
                      ["NVL dự kiến", detail.plannedMaterial || "-"],
                      ["Loại nguyên liệu", detail.materialSpec || "-"],
                      ["Tuổi vàng", detail.goldAgeValue > 0 ? String(detail.goldAgeValue) : "-"],
                      ["NVL đã phát sinh", detail.movementMaterials.length ? detail.movementMaterials.join(", ") : "Chưa có"],
                      ["Thợ đã nhận", detail.movementWorkers.length ? detail.movementWorkers.join(", ") : "Chưa có"]
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-md border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến trình công đoạn</p>
                  <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                    Đã qua {completedStageCount}/{stageProgress.length} khâu
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {stageProgress.map((stage) => (
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
                            onOpenMovementForStage(stage.code);
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
          {isEditing ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onSaveEdit}
              >
                Lưu LSX
              </button>
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onViewMovements}
              >
                Mở NK NVL
              </button>
              <button
                className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white sm:col-span-2"
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
          <button
            className="w-full rounded-md border border-dashed border-line bg-paper px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
            type="button"
            onClick={onStartNewOrderForSameCustomer}
            title="Tạo LSX mới, tự điền sẵn khách hàng và SR/KH từ đơn đang xem"
          >
            + Tạo đơn mới cho khách hàng này
          </button>
        </div>
      </aside>
    </>
  );
}
