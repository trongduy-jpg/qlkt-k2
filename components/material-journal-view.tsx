"use client";

import { Plus } from "lucide-react";
import type { ProductionOrder } from "@/lib/domain/production";
import { formatDisplayDate, normalizeStageCode } from "@/lib/production-business-rules";
import { isClosedStatus, statusClass, statusOptions } from "@/lib/production-helpers";
import type { StageOption } from "@/lib/production-summary";
import type { StageWorkerAggregate } from "@/lib/production-workflow";

type MaterialJournalViewProps = {
  isVisible: boolean;
  orders: ProductionOrder[];
  // Tong hop so tho cua TAT CA tho cung khau (keyed theo id cua dong dai
  // dien) - dung de biet khau co nhieu tho hay khong. Chi tiet Xuat/Nhap/
  // Hao hut tung tho phai mo sidebar (Sua NVL) moi thay, khong hien tren
  // bang tong quan nay nua.
  stageAggregates: Map<string, StageWorkerAggregate>;
  // Danh sach 12 khau theo dung thu tu quy trinh - dung tinh "Khau X/12"
  // hien kem ten khau trong cot "Cong doan hien tai".
  stageOptionsForDropdown: StageOption[];
  query: string;
  status: (typeof statusOptions)[number];
  recentCreatedOrderCode: string | null;
  recentlySavedMovementId: string | null;
  onAddMovement: () => void;
  onEditMovement: (order: ProductionOrder) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: (typeof statusOptions)[number]) => void;
};

export function MaterialJournalView({
  isVisible,
  orders,
  stageAggregates,
  stageOptionsForDropdown,
  query,
  status,
  recentCreatedOrderCode,
  recentlySavedMovementId,
  onAddMovement,
  onEditMovement,
  onQueryChange,
  onStatusChange
}: MaterialJournalViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold uppercase tracking-wide text-white"
            type="button"
            onClick={onAddMovement}
          >
            <Plus size={16} />
            Thêm giao dịch
          </button>
          <input
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            placeholder="Tìm LSX, mã hàng, thợ..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Tìm kiếm LSX, mã hàng, thợ"
          />
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as (typeof statusOptions)[number])}
            aria-label="Lọc theo trạng thái vận hành"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-ink">Lịch sử giao dịch NVL</h4>
            <p className="mt-1 text-xs text-zinc-500">Bấm "Sửa NVL" để xem chi tiết Xuất/Nhập/Hao hụt từng thợ.</p>
          </div>
          {orders.length > 0 ? (
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              {orders.length} dòng
            </span>
          ) : null}
        </div>
        {orders.length > 0 ? (
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-transparent text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-3">Số CT</th>
                <th className="px-3 py-3">Mã hàng</th>
                <th className="px-3 py-3">Tên hàng</th>
                <th className="px-3 py-3">Mã LSX</th>
                <th className="px-3 py-3">Loại NVL</th>
                <th className="px-3 py-3">NVL</th>
                <th className="px-3 py-3">Công đoạn hiện tại</th>
                <th className="px-3 py-3 text-right">SL</th>
                <th className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const aggregate = stageAggregates.get(order.id);
                const stageCode = order.stage ? normalizeStageCode(order.stage) : "";
                const stageIndex = stageCode ? stageOptionsForDropdown.findIndex((item) => item.value === stageCode) : -1;
                return (
                <tr
                  key={order.id}
                  className={`border-b ${isClosedStatus(order.status) ? "" : "cursor-pointer hover:bg-paper"} ${
                    recentlySavedMovementId === order.id || recentCreatedOrderCode === order.code
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-line/70"
                  }`}
                  onClick={() => {
                    if (isClosedStatus(order.status)) return;
                    onEditMovement(order);
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
                    {stageIndex >= 0 ? (
                      <div className="font-semibold text-sky-700">[{stageIndex + 1}] {stageCode}</div>
                    ) : (
                      <div className="font-medium text-zinc-400">Chưa bắt đầu</div>
                    )}
                    {aggregate && aggregate.workerCount > 1 ? (
                      <div className="text-xs text-zinc-500">{aggregate.workerCount} thợ - xem chi tiết ở Sửa NVL</div>
                    ) : (
                      <div className="text-xs text-zinc-500">{order.worker || "Chưa phân công"}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-zinc-700">{order.qtyPiece ?? "-"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[order.status]}`}
                      title="Sửa trạng thái tính hao trong form Sửa giao dịch NVL"
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="rounded-md border border-dashed border-line bg-white px-4 py-8 text-sm text-zinc-500">
            Chưa có giao dịch NVL phát sinh theo bộ lọc hiện tại.
          </div>
        )}
      </div>
    </section>
  );
}
