"use client";

import { Plus } from "lucide-react";
import type { ProductionOrder, Status } from "@/lib/demo-data";
import { formatDisplayDate, getStageLabel } from "@/lib/production-business-rules";
import { formatGram, isClosedStatus, statusClass, statusOptions } from "@/lib/production-helpers";

type MaterialJournalViewProps = {
  isVisible: boolean;
  orders: ProductionOrder[];
  query: string;
  status: (typeof statusOptions)[number];
  recentCreatedOrderCode: string | null;
  recentlySavedMovementId: string | null;
  onAddMovement: () => void;
  onEditMovement: (order: ProductionOrder) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: (typeof statusOptions)[number]) => void;
  onChangeOrderStatus: (id: string, nextStatus: Status) => void;
};

export function MaterialJournalView({
  isVisible,
  orders,
  query,
  status,
  recentCreatedOrderCode,
  recentlySavedMovementId,
  onAddMovement,
  onEditMovement,
  onQueryChange,
  onStatusChange,
  onChangeOrderStatus
}: MaterialJournalViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-zinc-600">
            Màn này chỉ dùng để tiếp nhận LSX mới và ghi nhận giao dịch NVL phát sinh.
          </p>
        </div>
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
          />
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as (typeof statusOptions)[number])}
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
            <p className="mt-1 text-xs text-zinc-500">Bấm "Sửa NVL" để chỉnh sửa một dòng đã ghi nhận.</p>
          </div>
          {orders.length > 0 ? (
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              {orders.length} dòng
            </span>
          ) : null}
        </div>
        {orders.length > 0 ? (
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
              {orders.map((order) => (
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
                    <div className="font-medium text-zinc-800">{order.worker}</div>
                    <div className="text-xs text-zinc-500">{order.stage ? getStageLabel(order.stage) : "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-zinc-700">{order.qtyPiece ?? "-"}</td>
                  <td className={`px-3 py-3 text-right ${order.issued > 0 ? "text-zinc-700" : "text-zinc-400"}`}>
                    {formatGram(order.issued)}
                  </td>
                  <td className={`px-3 py-3 text-right ${order.returned > 0 ? "text-zinc-700" : "text-zinc-400"}`}>
                    {formatGram(order.returned)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${order.loss > 0 ? "text-ink" : "text-zinc-400"}`}>
                    {formatGram(order.loss)}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600">
                    <div>{order.lossPeriod || "-"}</div>
                    <div>{order.nxtPeriod || "-"}</div>
                  </td>
                  <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    <select
                      className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 outline-none disabled:cursor-not-allowed disabled:opacity-70 ${statusClass[order.status]}`}
                      value={order.status}
                      onChange={(event) => onChangeOrderStatus(order.id, event.target.value as Status)}
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
  );
}
