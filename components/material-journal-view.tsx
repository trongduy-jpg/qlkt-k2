"use client";

import { useState } from "react";
import { Plus, Printer, SlidersHorizontal } from "lucide-react";
import { MaterialJournalPrintDialog } from "@/components/material-journal-print-dialog";
import type { ProductionOrder } from "@/lib/domain/production";
import { formatDisplayDate, normalizeStageCode } from "@/lib/production-business-rules";
import { isClosedStatus, statusClass, statusOptions } from "@/lib/production-helpers";
import { formatMaterialTypeLabel } from "@/lib/production-journal-options";
import { orderRowKey, type StageOption } from "@/lib/production-summary";
import { ALL_LOSS_PERIODS_FILTER, ALL_NXT_PERIODS_FILTER, ALL_STAGES_FILTER } from "@/lib/production-workflow";
import type { StageWorkerAggregate } from "@/lib/production-workflow";

// Tach ky "YYYY-MM" thanh 2 dropdown: Nam rieng, Thang rieng (nhan gon "Thang 07").
// Gia tri thuc te van la "YYYY-MM" (hoac allValue) de khong doi logic loc ben duoi.
function PeriodYearMonthFilter({
  options,
  value,
  allValue,
  allLabel,
  ariaPrefix,
  onChange
}: {
  options: string[];
  value: string;
  allValue: string;
  allLabel: string;
  ariaPrefix: string;
  onChange: (value: string) => void;
}) {
  const selectClass =
    "h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 disabled:bg-paper disabled:text-zinc-400";

  const years = Array.from(new Set(options.map((period) => period.split("-")[0])))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  const isAll = value === allValue || !value.includes("-");
  const [selectedYear, selectedMonth] = isAll ? ["", ""] : value.split("-");

  const monthsForYear = options
    .filter((period) => period.startsWith(`${selectedYear}-`))
    .map((period) => period.split("-")[1])
    .sort((a, b) => b.localeCompare(a));

  const handleYearChange = (year: string) => {
    if (!year) {
      onChange(allValue);
      return;
    }
    // Doi nam -> giu thang cu neu con du lieu, khong thi lay thang moi nhat cua nam do.
    const monthsInYear = options
      .filter((period) => period.startsWith(`${year}-`))
      .map((period) => period.split("-")[1])
      .sort((a, b) => b.localeCompare(a));
    const month = monthsInYear.includes(selectedMonth) ? selectedMonth : monthsInYear[0];
    onChange(month ? `${year}-${month}` : allValue);
  };

  return (
    <div className="flex gap-2">
      <select
        className={selectClass}
        value={selectedYear}
        onChange={(event) => handleYearChange(event.target.value)}
        aria-label={`${ariaPrefix} - chọn năm`}
      >
        <option value="">{allLabel}</option>
        {years.map((year) => (
          <option key={year} value={year}>
            Năm {year}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={selectedMonth}
        disabled={isAll}
        onChange={(event) => onChange(`${selectedYear}-${event.target.value}`)}
        aria-label={`${ariaPrefix} - chọn tháng`}
      >
        {monthsForYear.map((month) => (
          <option key={month} value={month}>
            Tháng {month}
          </option>
        ))}
      </select>
    </div>
  );
}

type MaterialJournalViewProps = {
  isVisible: boolean;
  orders: ProductionOrder[];
  allOrders: ProductionOrder[];
  // Tong hop so tho cua TAT CA tho cung khau (keyed theo id cua dong dai
  // dien) - dung de biet khau co nhieu tho hay khong. Chi tiet Xuat/Nhap/
  // Hao hut tung tho phai mo sidebar (Sua NVL) moi thay, khong hien tren
  // bang tong quan nay nua.
  stageAggregates: Map<string, StageWorkerAggregate>;
  // Danh sach 12 khau theo dung thu tu quy trinh - dung tinh "Khau X/12"
  // hien kem ten khau trong cot "Cong doan hien tai".
  stageOptionsForDropdown: StageOption[];
  // So luong (SL) cua dung Ma hang, keyed theo orderRowKey(code, sku) -
  // day la So luong nhap o Lenh san xuat, KHONG PHAI order.qtyPiece cua
  // tung giao dich (truong do chi co gia tri o khau DKB).
  plannedQtyByRowKey: Map<string, number>;
  query: string;
  status: (typeof statusOptions)[number];
  stageFilter: string;
  nxtPeriodFilter: string;
  nxtPeriodOptions: string[];
  lossPeriodFilter: string;
  lossPeriodOptions: string[];
  recentCreatedOrderCode: string | null;
  recentlySavedMovementId: string | null;
  onAddMovement: () => void;
  onEditMovement: (order: ProductionOrder) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: (typeof statusOptions)[number]) => void;
  onStageFilterChange: (value: string) => void;
  onNxtPeriodFilterChange: (value: string) => void;
  onLossPeriodFilterChange: (value: string) => void;
};

export function MaterialJournalView({
  isVisible,
  orders,
  allOrders,
  stageAggregates,
  stageOptionsForDropdown,
  plannedQtyByRowKey,
  query,
  status,
  stageFilter,
  nxtPeriodFilter,
  nxtPeriodOptions,
  lossPeriodFilter,
  lossPeriodOptions,
  recentCreatedOrderCode,
  recentlySavedMovementId,
  onAddMovement,
  onEditMovement,
  onQueryChange,
  onStageFilterChange,
  onNxtPeriodFilterChange,
  onLossPeriodFilterChange,
  onStatusChange
}: MaterialJournalViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper"
            type="button"
            onClick={() => setIsPrintDialogOpen(true)}
          >
            <Printer size={16} />
            In PDF
          </button>
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
            aria-label="Lọc theo trạng thái tính hao"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper"
            type="button"
            onClick={() => setIsFilterExpanded((current) => !current)}
          >
            <SlidersHorizontal size={16} />
            Lọc thêm
          </button>
        </div>
      </div>

      <MaterialJournalPrintDialog
        isOpen={isPrintDialogOpen}
        rows={orders}
        allOrders={allOrders}
        stageOptions={stageOptionsForDropdown}
        plannedQtyByRowKey={plannedQtyByRowKey}
        stageAggregates={stageAggregates}
        onClose={() => setIsPrintDialogOpen(false)}
      />

      {isFilterExpanded ? (
        <div className="mt-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-3">
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
            value={stageFilter}
            onChange={(event) => onStageFilterChange(event.target.value)}
            aria-label="Lọc theo công đoạn"
          >
            <option value={ALL_STAGES_FILTER}>{ALL_STAGES_FILTER}</option>
            {stageOptionsForDropdown.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <PeriodYearMonthFilter
            options={nxtPeriodOptions}
            value={nxtPeriodFilter}
            allValue={ALL_NXT_PERIODS_FILTER}
            allLabel={ALL_NXT_PERIODS_FILTER}
            ariaPrefix="Lọc theo tháng NXT"
            onChange={onNxtPeriodFilterChange}
          />
          <PeriodYearMonthFilter
            options={lossPeriodOptions}
            value={lossPeriodFilter}
            allValue={ALL_LOSS_PERIODS_FILTER}
            allLabel={ALL_LOSS_PERIODS_FILTER}
            ariaPrefix="Lọc theo tháng hao"
            onChange={onLossPeriodFilterChange}
          />
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        {orders.length > 0 ? (
          <div className="mb-3 flex items-center justify-end">
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              {orders.length} dòng
            </span>
          </div>
        ) : null}
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
                const plannedQty = plannedQtyByRowKey.get(orderRowKey(order));
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
                  <td className="px-3 py-3 text-zinc-700">{formatMaterialTypeLabel(order.materialType)}</td>
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
                  <td className="px-3 py-3 text-right text-zinc-700">{plannedQty || order.qtyPiece || "-"}</td>
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
