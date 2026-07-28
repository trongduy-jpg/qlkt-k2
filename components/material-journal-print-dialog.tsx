"use client";

import { useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import type { ProductionOrder } from "@/lib/domain/production";
import { formatDisplayDate, normalizeStageCode } from "@/lib/production-business-rules";
import { formatGram } from "@/lib/production-helpers";
import { formatMaterialTypeLabel } from "@/lib/production-journal-options";
import { orderLineKey, orderRowKey, type StageOption } from "@/lib/production-summary";
import type { StageWorkerAggregate } from "@/lib/production-workflow";

type PrintMode = "table" | "detail" | "stage";

type PrintFieldKey =
  | "documentNo"
  | "occurredDate"
  | "code"
  | "sku"
  | "productName"
  | "materialType"
  | "material"
  | "stage"
  | "worker"
  | "qtyPiece"
  | "issued"
  | "returned"
  | "transferred"
  | "powder"
  | "loss"
  | "nxtPeriod"
  | "lossPeriod"
  | "status";

type PrintContext = {
  stageOptions: StageOption[];
  plannedQtyByRowKey: Map<string, number>;
  stageAggregates: Map<string, StageWorkerAggregate>;
};

type PrintField = {
  key: PrintFieldKey;
  label: string;
  value: (order: ProductionOrder, context: PrintContext) => string;
};

type MaterialJournalPrintDialogProps = {
  isOpen: boolean;
  rows: ProductionOrder[];
  allOrders: ProductionOrder[];
  stageOptions: StageOption[];
  plannedQtyByRowKey: Map<string, number>;
  stageAggregates: Map<string, StageWorkerAggregate>;
  onClose: () => void;
};

const printFields: PrintField[] = [
  {
    key: "documentNo",
    label: "Số CT",
    value: (order) => order.documentNo || order.documentInNo || "-"
  },
  {
    key: "occurredDate",
    label: "Ngày",
    value: (order) => formatDisplayDate(order.occurredDate) || "-"
  },
  {
    key: "code",
    label: "Mã LSX",
    value: (order) => order.code || "-"
  },
  {
    key: "sku",
    label: "Mã hàng",
    value: (order) => order.sku || "-"
  },
  {
    key: "productName",
    label: "Tên hàng",
    value: (order) => order.productName || "-"
  },
  {
    key: "materialType",
    label: "Loại NVL",
    value: (order) => formatMaterialTypeLabel(order.materialType)
  },
  {
    key: "material",
    label: "NVL",
    value: (order) => order.material || "-"
  },
  {
    key: "stage",
    label: "Công đoạn",
    value: (order, context) => formatStage(order.stage, context.stageOptions)
  },
  {
    key: "worker",
    label: "Thợ",
    value: (order, context) => {
      const aggregate = context.stageAggregates.get(order.id);
      if (aggregate && aggregate.workerCount > 1) return `${aggregate.workerCount} thợ`;
      return order.worker || "-";
    }
  },
  {
    key: "qtyPiece",
    label: "SL",
    value: (order, context) => String(context.plannedQtyByRowKey.get(orderRowKey(order)) || order.qtyPiece || "-")
  },
  {
    key: "issued",
    label: "Xuất",
    value: (order, context) => formatGram(context.stageAggregates.get(order.id)?.totalIssued ?? order.issued ?? 0)
  },
  {
    key: "returned",
    label: "Nhập",
    value: (order, context) => formatGram(context.stageAggregates.get(order.id)?.totalReturned ?? order.returned ?? 0)
  },
  {
    key: "transferred",
    label: "Chuyển",
    value: (order) => formatGram(order.transferred ?? 0)
  },
  {
    key: "powder",
    label: "Bột",
    value: (order) => formatGram(order.powder ?? 0)
  },
  {
    key: "loss",
    label: "Hao hụt",
    value: (order, context) => formatGram(context.stageAggregates.get(order.id)?.totalLoss ?? order.loss ?? 0)
  },
  {
    key: "nxtPeriod",
    label: "Tháng NXT",
    value: (order) => order.nxtPeriod || "-"
  },
  {
    key: "lossPeriod",
    label: "Tháng tính hao",
    value: (order) => order.lossPeriod || "-"
  },
  {
    key: "status",
    label: "Trạng thái",
    value: (order) => order.status || "-"
  }
];

const defaultFields: PrintFieldKey[] = [
  "documentNo",
  "occurredDate",
  "code",
  "sku",
  "productName",
  "materialType",
  "material",
  "stage",
  "worker",
  "qtyPiece",
  "issued",
  "returned",
  "loss",
  "status"
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatStage(stage: string | undefined, stageOptions: StageOption[]) {
  const code = normalizeStageCode(stage || "");
  if (!code) return "-";
  const index = stageOptions.findIndex((item) => item.value === code);
  return index >= 0 ? `[${index + 1}] ${code}` : code;
}

function lineKey(order: ProductionOrder) {
  return orderLineKey(order.code, order.itemSku || order.sku);
}

function getDetailRows(rows: ProductionOrder[], allOrders: ProductionOrder[]) {
  const keys = new Set(rows.map(lineKey));
  return allOrders
    .filter((order) => keys.has(lineKey(order)))
    .sort((left, right) => {
      const codeDiff = left.code.localeCompare(right.code);
      if (codeDiff !== 0) return codeDiff;
      const skuDiff = (left.itemSku || left.sku).localeCompare(right.itemSku || right.sku);
      if (skuDiff !== 0) return skuDiff;
      return (left.occurredDate || "").localeCompare(right.occurredDate || "");
    });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function buildTableHtml(rows: ProductionOrder[], fields: PrintField[], context: PrintContext) {
  const header = fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join("");
  const body = rows
    .map((order) => {
      const cells = fields.map((field) => `<td>${escapeHtml(field.value(order, context))}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${header}</tr></thead><tbody>${body || `<tr><td colspan="${fields.length}">Không có dữ liệu.</td></tr>`}</tbody></table>`;
}

function buildDetailHtml(rows: ProductionOrder[], allOrders: ProductionOrder[], context: PrintContext) {
  const detailRows = getDetailRows(rows, allOrders);
  if (detailRows.length === 0) return `<p class="empty">Không có dữ liệu chi tiết công đoạn.</p>`;

  const byLine = groupBy(detailRows, lineKey);
  return Array.from(byLine.entries())
    .map(([, orders]) => {
      const first = orders[0];
      const totalIssued = orders.reduce((sum, item) => sum + (item.issued || 0), 0);
      const totalReturned = orders.reduce((sum, item) => sum + (item.returned || 0), 0);
      const totalLoss = orders.reduce((sum, item) => sum + (item.loss || 0), 0);
      const byStage = groupBy(orders, (order) => normalizeStageCode(order.stage) || "-");
      const stageBlocks = Array.from(byStage.entries())
        .map(([stageCode, stageOrders]) => {
          const rowsHtml = stageOrders
            .map((order) => `
              <tr>
                <td>${escapeHtml(order.worker || "-")}</td>
                <td>${escapeHtml(formatDisplayDate(order.occurredDate) || "-")}</td>
                <td>${escapeHtml(order.documentNo || order.documentInNo || "-")}</td>
                <td>${escapeHtml(formatMaterialTypeLabel(order.materialType))}</td>
                <td>${escapeHtml(order.material || "-")}</td>
                <td>${escapeHtml(formatGram(order.issued || 0))}</td>
                <td>${escapeHtml(formatGram(order.returned || 0))}</td>
                <td>${escapeHtml(formatGram(order.transferred || 0))}</td>
                <td>${escapeHtml(formatGram(order.powder || 0))}</td>
                <td>${escapeHtml(formatGram(order.loss || 0))}</td>
                <td>${escapeHtml(order.status || "-")}</td>
              </tr>
            `)
            .join("");

          return `
            <section class="stage-block">
              <h3>${escapeHtml(formatStage(stageCode, context.stageOptions))}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Thợ</th><th>Ngày</th><th>Số CT</th><th>Loại NVL</th><th>NVL</th>
                    <th>Xuất</th><th>Nhập</th><th>Chuyển</th><th>Bột</th><th>Hao hụt</th><th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </section>
          `;
        })
        .join("");

      return `
        <section class="line-block">
          <div class="line-header">
            <div>
              <h2>${escapeHtml(first.code)} · ${escapeHtml(first.itemSku || first.sku)}</h2>
              <p>${escapeHtml(first.productName || "-")}</p>
            </div>
            <div class="totals">
              <span>Xuất: <b>${escapeHtml(formatGram(totalIssued))}</b></span>
              <span>Nhập: <b>${escapeHtml(formatGram(totalReturned))}</b></span>
              <span>Hao hụt: <b>${escapeHtml(formatGram(totalLoss))}</b></span>
            </div>
          </div>
          ${stageBlocks}
        </section>
      `;
    })
    .join("");
}

function buildStageSummaryHtml(rows: ProductionOrder[], allOrders: ProductionOrder[], context: PrintContext) {
  const detailRows = getDetailRows(rows, allOrders);
  if (detailRows.length === 0) return `<p class="empty">Không có dữ liệu tổng hợp công đoạn.</p>`;

  const byStage = groupBy(detailRows, (order) => normalizeStageCode(order.stage) || "-");
  const rowsHtml = Array.from(byStage.entries())
    .map(([stageCode, stageRows]) => {
      const workerCount = new Set(stageRows.map((item) => item.worker).filter(Boolean)).size;
      const productCount = new Set(stageRows.map(lineKey)).size;
      const issued = stageRows.reduce((sum, item) => sum + (item.issued || 0), 0);
      const returned = stageRows.reduce((sum, item) => sum + (item.returned || 0), 0);
      const loss = stageRows.reduce((sum, item) => sum + (item.loss || 0), 0);
      return `
        <tr>
          <td>${escapeHtml(formatStage(stageCode, context.stageOptions))}</td>
          <td>${productCount}</td>
          <td>${workerCount}</td>
          <td>${escapeHtml(formatGram(issued))}</td>
          <td>${escapeHtml(formatGram(returned))}</td>
          <td>${escapeHtml(formatGram(loss))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table>
      <thead><tr><th>Công đoạn</th><th>Mã sản phẩm</th><th>Thợ</th><th>Tổng xuất</th><th>Tổng nhập</th><th>Hao hụt</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

function buildPrintHtml({
  mode,
  rows,
  allOrders,
  fields,
  context
}: {
  mode: PrintMode;
  rows: ProductionOrder[];
  allOrders: ProductionOrder[];
  fields: PrintField[];
  context: PrintContext;
}) {
  const title =
    mode === "detail"
      ? "Nhật ký NVL - Chi tiết công đoạn"
      : mode === "stage"
        ? "Nhật ký NVL - Tổng hợp công đoạn"
        : "Nhật ký NVL - Bảng hiện tại";
  const body =
    mode === "detail"
      ? buildDetailHtml(rows, allOrders, context)
      : mode === "stage"
        ? buildStageSummaryHtml(rows, allOrders, context)
        : buildTableHtml(rows, fields, context);

  return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, sans-serif; color: #18130f; background: #fff; }
      header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #d8cfc2; padding-bottom: 12px; margin-bottom: 16px; }
      .brand { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a6b28; }
      h1 { margin: 4px 0 0; font-size: 22px; }
      .meta { text-align: right; font-size: 12px; color: #6b6258; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
      th { background: #f4f0e9; color: #6b6258; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; }
      th, td { border-bottom: 1px solid #e7ded2; padding: 8px 9px; vertical-align: top; font-size: 12px; }
      tr { page-break-inside: avoid; }
      .line-block { page-break-inside: avoid; border: 1px solid #d8cfc2; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
      .line-header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 12px; }
      .line-header h2 { margin: 0; font-size: 17px; }
      .line-header p { margin: 4px 0 0; color: #6b6258; }
      .totals { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; font-size: 12px; }
      .totals span { border: 1px solid #e7ded2; border-radius: 6px; padding: 6px 8px; background: #fbfaf7; }
      .stage-block { margin-top: 10px; }
      .stage-block h3 { margin: 10px 0 6px; font-size: 13px; color: #006f62; }
      .empty { border: 1px dashed #d8cfc2; border-radius: 8px; padding: 24px; color: #6b6258; }
    </style>
  </head>
  <body>
    <header>
      <div>
        <div class="brand">Asiana Gold · QLKT K2</div>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="meta">
        <div>Ngày in: ${escapeHtml(formatDisplayDate(new Date().toISOString().slice(0, 10)) || "")}</div>
        <div>Số dòng đang in: ${rows.length}</div>
      </div>
    </header>
    ${body}
    <script>window.addEventListener("load", () => setTimeout(() => window.print(), 150));</script>
  </body>
</html>`;
}

export function MaterialJournalPrintDialog({
  isOpen,
  rows,
  allOrders,
  stageOptions,
  plannedQtyByRowKey,
  stageAggregates,
  onClose
}: MaterialJournalPrintDialogProps) {
  const [mode, setMode] = useState<PrintMode>("detail");
  const [selectedFields, setSelectedFields] = useState<PrintFieldKey[]>(defaultFields);

  const selectedPrintFields = useMemo(
    () => printFields.filter((field) => selectedFields.includes(field.key)),
    [selectedFields]
  );

  if (!isOpen) return null;

  const toggleField = (key: PrintFieldKey) => {
    setSelectedFields((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(
      buildPrintHtml({
        mode,
        rows,
        allOrders,
        fields: selectedPrintFields.length > 0 ? selectedPrintFields : printFields,
        context: { stageOptions, plannedQtyByRowKey, stageAggregates }
      })
    );
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/25 px-4 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">In PDF Nhật ký NVL</p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-ink">Thiết lập bản in</h3>
            <p className="mt-1 text-sm text-zinc-600">Chọn kiểu báo cáo và các trường cần in, sau đó lưu bằng Save as PDF.</p>
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section className="rounded-md border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Kiểu báo cáo</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                ["detail", "Chi tiết công đoạn"],
                ["table", "Bảng hiện tại"],
                ["stage", "Tổng hợp công đoạn"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    mode === value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-paper"
                  }`}
                  type="button"
                  onClick={() => setMode(value as PrintMode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Trường cần in</p>
              <button
                className="text-xs font-semibold text-jade hover:text-jade/80"
                type="button"
                onClick={() => setSelectedFields(printFields.map((field) => field.key))}
              >
                Chọn tất cả
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {printFields.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
                >
                  <input
                    className="size-4 accent-jade"
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-white px-5 py-4">
          <p className="text-sm text-zinc-600">{rows.length} dòng đang nằm trong phạm vi in.</p>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white"
            type="button"
            onClick={printReport}
          >
            <Printer size={16} />
            In / Lưu PDF
          </button>
        </div>
      </div>
    </div>
  );
}
