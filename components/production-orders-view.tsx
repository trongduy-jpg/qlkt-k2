"use client";

import { useState } from "react";
import { Link2, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { OrderSummary } from "@/lib/production-types";
import type { ProductionOverview } from "@/lib/production-workflow";
import { orderRowKey } from "@/lib/production-summary";
import { deliveryStatusClass, hasMeaningfulText, statusClass } from "@/lib/production-helpers";
import { formatDisplayDate } from "@/lib/production-business-rules";
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
  onSelectOrder: (code: string, itemSku?: string) => void;
};

function formatCodeMonthLabel(codeMonth: string) {
  const [year, month] = codeMonth.split("-");
  return `Tháng ${month}/${year}`;
}

type LsxGroupInfo = { isGroupStart: boolean; groupParity: 0 | 1 };

// Danh dau dong dau tien cua moi nhom "cung 1 Ma LSX" (de ke duong phan
// cach + doi mau nen xen ke giua cac nhom) - KHONG dung rowSpan de gop o,
// vi cac dong cung 1 Ma LSX co the khong lien tiep trong danh sach da loc
// (VD giao dich roi/chua gan Ma hang chinh thuc duoc gom o cuoi danh
// sach), rowSpan trong truong hop do se lam bang bi lech cot.
function computeLsxGroupInfo(summaries: OrderSummary[]): LsxGroupInfo[] {
  let groupIndex = -1;
  let previousCode: string | null = null;
  return summaries.map((summary) => {
    const isGroupStart = summary.code !== previousCode;
    if (isGroupStart) groupIndex += 1;
    previousCode = summary.code;
    return { isGroupStart, groupParity: (groupIndex % 2) as 0 | 1 };
  });
}

export function ProductionOrdersView({
  isVisible,
  productionOverview,
  filteredOrderSummaries,
  selectedOrderCode,
  selectedItemSku,
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
  onSelectOrder
}: ProductionOrdersViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const activeExtraFilterCount = [
    productionDestinationFilter !== ALL_DESTINATIONS_FILTER,
    productionCodeMonthFilter !== ALL_CODE_MONTHS_FILTER,
    productionSalesType !== "Tất cả phân loại KH",
    productionDeadlineFilter !== "Tất cả deadline"
  ].filter(Boolean).length;

  function clearFilters() {
    onDeliveryStatusChange("Tất cả trạng thái LSX");
    onDestinationFilterChange(ALL_DESTINATIONS_FILTER);
    onCodeMonthFilterChange(ALL_CODE_MONTHS_FILTER);
    onSalesTypeChange("Tất cả phân loại KH");
    onDeadlineFilterChange("Tất cả deadline");
    onCustomerQueryChange("");
  }

  return (
    <section className={`${isVisible ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
            type="button"
            onClick={onCreateOrder}
          >
            <Plus size={16} />
            Tạo LSX
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-zinc-600">
            Tổng LSX <strong className="font-semibold text-ink">{productionOverview.total}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-zinc-600">
            Đang xử lý <strong className="font-semibold text-ink">{productionOverview.inProgressCount}</strong>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              productionOverview.overdueCount > 0 ? "bg-red-50 text-red-700" : "bg-paper text-zinc-600"
            }`}
          >
            Quá hạn deadline{" "}
            <strong className={`font-semibold ${productionOverview.overdueCount > 0 ? "text-red-700" : "text-ink"}`}>
              {productionOverview.overdueCount}
            </strong>
          </span>
        </div>

        <div className="rounded-md border border-line/60 bg-paper/60 p-2">
          <div className="flex flex-wrap items-center gap-2">
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

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 sm:w-64"
              placeholder="Tìm LSX, mã hàng, khách hàng..."
              value={productionCustomerQuery}
              onChange={(event) => onCustomerQueryChange(event.target.value)}
              aria-label="Tìm kiếm LSX, mã hàng, khách hàng"
            />
          </div>

          <button
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold hover:bg-paper ${
              isFilterExpanded ? "border-ink text-ink" : "border-line text-ink"
            }`}
            type="button"
            onClick={() => setIsFilterExpanded((current) => !current)}
          >
            <SlidersHorizontal size={16} />
            Lọc thêm
            {activeExtraFilterCount > 0 ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {activeExtraFilterCount}
              </span>
            ) : null}
          </button>

          {activeExtraFilterCount > 0 ? (
            <button
              className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-ink"
              type="button"
              onClick={clearFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          ) : null}
        </div>

        {isFilterExpanded ? (
          <div className="mt-2 grid gap-2 border-t border-line/60 pt-2 md:grid-cols-4">
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
              aria-label="Lọc theo phân loại KH"
            >
              <option>Tất cả phân loại KH</option>
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
          </div>
        ) : null}
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex justify-end">
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              {filteredOrderSummaries.length} Mã hàng
            </span>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-md border border-line bg-white">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-line bg-paper text-left text-[11px] uppercase tracking-wider text-zinc-500 shadow-sm">
                  <th className="px-3 py-3">Mã hàng / Mã LSX</th>
                  <th className="px-3 py-3">Tên hàng</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">Phân loại KH</th>
                  <th className="px-3 py-3">Deadline đơn hàng</th>
                  <th className="px-3 py-3 text-right">Số lượng</th>
                  <th
                    className="px-3 py-3 text-right"
                    title="Số dòng đã ghi nhận trong Nhật ký NVL cho LSX này - khác với thông tin trong form LSX."
                  >
                    Số GD NVL
                  </th>
                  <th className="px-3 py-3">Trạng thái LSX</th>
                  <th className="sticky right-0 z-20 bg-paper px-3 py-3 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.15)]">
                    Trạng thái vận hành
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const lsxGroupInfo = computeLsxGroupInfo(filteredOrderSummaries);
                  return filteredOrderSummaries.map((summary, index) => {
                    const { isGroupStart, groupParity } = lsxGroupInfo[index];
                    const isRowSelected = selectedOrderCode === summary.code && selectedItemSku === summary.sku;
                    const rowBgClass = isRowSelected ? "bg-emerald-50/60" : groupParity === 1 ? "bg-paper/50" : "bg-white";
                    return (
                      <tr
                        key={orderRowKey(summary)}
                        className={`group cursor-pointer border-b border-line/70 transition hover:bg-emerald-50/40 ${
                          isGroupStart ? "border-t-2 border-t-line" : ""
                        } ${rowBgClass}`}
                        onClick={() => onSelectOrder(summary.code, summary.sku)}
                      >
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-ink">{summary.sku || "-"}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-zinc-500">
                            {summary.code}
                            {summary.parentOrderCode ? (
                              <span title={`Phát sinh từ LSX ${summary.parentOrderCode} (cùng khách hàng)`}>
                                <Link2 size={12} className="text-jade" />
                              </span>
                            ) : null}
                          </p>
                        </td>
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
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${deliveryStatusClass[summary.deliveryStatus || ""] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                            {summary.deliveryStatus || "Chưa cập nhật"}
                          </span>
                        </td>
                        <td
                          className={`sticky right-0 px-3 py-3 align-top shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.15)] transition-colors group-hover:bg-emerald-50/40 ${rowBgClass}`}
                        >
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[summary.status]}`}>
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
