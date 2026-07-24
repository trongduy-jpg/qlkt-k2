"use client";

import { Link2, Plus } from "lucide-react";
import type { OrderSummary } from "@/lib/production-types";
import type { ProductionOverview } from "@/lib/production-workflow";
import { orderRowKey, type StageOption } from "@/lib/production-summary";
import { deliveryStatusClass, hasMeaningfulText, statusClass } from "@/lib/production-helpers";
import { formatDisplayDate, getStageLabel, normalizeStageCode } from "@/lib/production-business-rules";
import {
  productionOrderDeliveryStatusOptions,
  productionOrderDestinations,
  productionOrderSalesTypeOptions
} from "@/lib/production-journal-options";
import { ALL_CODE_MONTHS_FILTER, ALL_DESTINATIONS_FILTER } from "@/lib/production-workflow";

type ProductionOrdersViewProps = {
  isVisible: boolean;
  productionOverview: ProductionOverview;
  filteredOrderSummaries: OrderSummary[];
  selectedOrderCode: string | null;
  selectedItemSku: string | null;
  stageOptionsForDropdown: StageOption[];
  productionDeliveryStatus: string;
  productionSalesType: string;
  productionDeadlineFilter: string;
  productionDestinationFilter: string;
  productionCodeMonthFilter: string;
  productionCodeMonthOptions: string[];
  productionCustomerQuery: string;
  onDeliveryStatusChange: (value: string) => void;
  onSalesTypeChange: (value: string) => void;
  onDeadlineFilterChange: (value: string) => void;
  onDestinationFilterChange: (value: string) => void;
  onCodeMonthFilterChange: (value: string) => void;
  onCustomerQueryChange: (value: string) => void;
  onCreateOrder: () => void;
  onShowAllOrders: () => void;
  onSelectOrder: (code: string, itemSku?: string) => void;
};

function formatCodeMonthLabel(codeMonth: string) {
  const [year, month] = codeMonth.split("-");
  return `Tháng ${month}/${year}`;
}

// Cac dong lien tiep cung 1 Ma LSX (nhieu Ma hang) duoc gom lai de hien 1 o
// "Ma LSX" duy nhat, keo dai het nhom (rowSpan) - thay vi lap lai hoac dung
// placeholder "cung LSX" o tung dong, giong cach bang tinh/UI chuyen nghiep
// thuong nhom du lieu phan cap.
function computeLsxGroupSpans(summaries: OrderSummary[]): number[] {
  const spans = new Array(summaries.length).fill(0);
  let groupStart = 0;
  for (let index = 1; index <= summaries.length; index += 1) {
    const isBoundary = index === summaries.length || summaries[index].code !== summaries[groupStart].code;
    if (isBoundary) {
      spans[groupStart] = index - groupStart;
      groupStart = index;
    }
  }
  return spans;
}

export function ProductionOrdersView({
  isVisible,
  productionOverview,
  filteredOrderSummaries,
  selectedOrderCode,
  selectedItemSku,
  stageOptionsForDropdown,
  productionDeliveryStatus,
  productionSalesType,
  productionDeadlineFilter,
  productionDestinationFilter,
  productionCodeMonthFilter,
  productionCodeMonthOptions,
  productionCustomerQuery,
  onDeliveryStatusChange,
  onSalesTypeChange,
  onDeadlineFilterChange,
  onDestinationFilterChange,
  onCodeMonthFilterChange,
  onCustomerQueryChange,
  onCreateOrder,
  onShowAllOrders,
  onSelectOrder
}: ProductionOrdersViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-zinc-600">
              Tạo LSX trước, sau đó mới ghi nhận xuất/nhập nguyên vật liệu trong Nhật ký NVL.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
              type="button"
              onClick={onCreateOrder}
            >
              <Plus size={16} />
              Tạo LSX
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
              type="button"
              onClick={onShowAllOrders}
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

        <div className="grid gap-3 rounded-md border border-line bg-paper p-3 lg:grid-cols-3 xl:grid-cols-6">
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={productionDeliveryStatus}
            onChange={(event) => onDeliveryStatusChange(event.target.value)}
            title="Lọc theo trạng thái LSX"
            aria-label="Lọc theo trạng thái LSX"
          >
            <option>Tất cả trạng thái LSX</option>
            {productionOrderDeliveryStatusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={productionDestinationFilter}
            onChange={(event) => onDestinationFilterChange(event.target.value)}
            title="Lọc theo cửa hàng"
            aria-label="Lọc theo cửa hàng"
          >
            <option value={ALL_DESTINATIONS_FILTER}>{ALL_DESTINATIONS_FILTER}</option>
            {productionOrderDestinations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={productionCodeMonthFilter}
            onChange={(event) => onCodeMonthFilterChange(event.target.value)}
            title="Lọc theo tháng (dựa vào Mã LSX)"
            aria-label="Lọc theo tháng"
          >
            <option value={ALL_CODE_MONTHS_FILTER}>{ALL_CODE_MONTHS_FILTER}</option>
            {productionCodeMonthOptions.map((codeMonth) => (
              <option key={codeMonth} value={codeMonth}>
                {formatCodeMonthLabel(codeMonth)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={productionSalesType}
            onChange={(event) => onSalesTypeChange(event.target.value)}
            aria-label="Lọc theo SR/KH"
          >
            <option>Tất cả SR/KH</option>
            {productionOrderSalesTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={productionDeadlineFilter}
            onChange={(event) => onDeadlineFilterChange(event.target.value)}
            aria-label="Lọc theo deadline"
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
            onChange={(event) => onCustomerQueryChange(event.target.value)}
            aria-label="Tìm kiếm LSX, mã hàng, khách hàng"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-ink">Danh sách lệnh sản xuất</h4>
              <p className="mt-1 text-xs text-zinc-500">Mỗi Mã hàng là 1 dòng riêng. Bấm vào dòng để mở chi tiết.</p>
            </div>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              {filteredOrderSummaries.length} Mã hàng
            </span>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-md border border-line bg-white">
            <table className="w-full min-w-[1360px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-line bg-paper text-left text-[11px] uppercase tracking-wider text-zinc-500 shadow-sm">
                  <th className="px-3 py-3">Mã hàng</th>
                  <th className="px-3 py-3">Mã LSX</th>
                  <th className="px-3 py-3">Tên hàng</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">SR/KH</th>
                  <th className="px-3 py-3">Deadline đơn hàng</th>
                  <th className="px-3 py-3 text-right">Số lượng</th>
                  <th
                    className="px-3 py-3 text-right"
                    title="Số dòng đã ghi nhận trong Nhật ký NVL cho LSX này - khác với thông tin trong form LSX."
                  >
                    Số GD NVL
                  </th>
                  <th className="px-3 py-3">Khâu hiện tại</th>
                  <th className="px-3 py-3">Trạng thái LSX</th>
                  <th className="sticky right-0 z-20 bg-paper px-3 py-3 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.15)]">
                    Trạng thái vận hành
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const lsxGroupSpans = computeLsxGroupSpans(filteredOrderSummaries);
                  return filteredOrderSummaries.map((summary, index) => {
                    const isGroupStart = lsxGroupSpans[index] > 0;
                    const isRowSelected = selectedOrderCode === summary.code && selectedItemSku === summary.sku;
                    const rowBgClass = isRowSelected ? "bg-emerald-50/60" : "bg-white";
                    return (
                      <tr
                        key={orderRowKey(summary)}
                        className={`group cursor-pointer border-b border-line/70 transition hover:bg-emerald-50/40 ${
                          isGroupStart ? "border-t-2 border-t-line" : ""
                        } ${rowBgClass}`}
                        onClick={() => onSelectOrder(summary.code, summary.sku)}
                      >
                        <td className="px-3 py-3 align-top font-semibold text-ink">{summary.sku || "-"}</td>
                        {isGroupStart ? (
                          <td
                            className="border-r border-line/70 bg-paper/40 px-3 py-3 align-middle"
                            rowSpan={lsxGroupSpans[index]}
                          >
                            <p className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
                              {summary.code}
                              {summary.parentOrderCode ? (
                                <span title={`Phát sinh từ LSX ${summary.parentOrderCode} (cùng khách hàng)`}>
                                  <Link2 size={12} className="text-jade" />
                                </span>
                              ) : null}
                            </p>
                            {lsxGroupSpans[index] > 1 ? (
                              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                {lsxGroupSpans[index]} Mã hàng
                              </p>
                            ) : null}
                          </td>
                        ) : null}
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
                          <CurrentStage summary={summary} stageOptionsForDropdown={stageOptionsForDropdown} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${deliveryStatusClass[summary.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                            {summary.deliveryStatus || "Chưa cập nhật"}
                          </span>
                        </td>
                        <td
                          className={`sticky right-0 px-3 py-3 align-top shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.15)] transition-colors group-hover:bg-emerald-50/40 ${rowBgClass}`}
                        >
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[summary.status]}`}>
                            {summary.status}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrentStage({
  summary,
  stageOptionsForDropdown
}: {
  summary: OrderSummary;
  stageOptionsForDropdown: StageOption[];
}) {
  const stageCode = summary.plannedStage ? normalizeStageCode(summary.plannedStage) : "";
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
}
