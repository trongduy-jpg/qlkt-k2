"use client";

import type { ProductionOrder } from "@/lib/domain/production";
import type { OrderSummary } from "@/lib/production-types";
import { statusClass } from "@/lib/production-helpers";
import { orderRowKey } from "@/lib/production-summary";

type DashboardKpi = {
  label: string;
  value: string;
  unit: string;
  trend: string;
};

type DashboardOverview = {
  inProgressCount: number;
  overdueCount: number;
};

type DashboardOverviewViewProps = {
  isVisible: boolean;
  kpis: DashboardKpi[];
  productionOverview: DashboardOverview;
  recentOrders: ProductionOrder[];
  orderSummaries: OrderSummary[];
  onOpenProduction: () => void;
  onOpenJournal: () => void;
  onSelectProductionOrder: (code: string, itemSku?: string) => void;
};

export function DashboardOverviewView({
  isVisible,
  kpis,
  productionOverview,
  recentOrders,
  orderSummaries,
  onOpenProduction,
  onOpenJournal,
  onSelectProductionOrder
}: DashboardOverviewViewProps) {
  return (
    <>
      <div className={`${isVisible ? "grid" : "hidden"} gap-4 py-5 sm:grid-cols-2 xl:grid-cols-4`}>
        {kpis.map((item) => (
          <article key={item.label} className="rounded-md border border-line bg-white/92 p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-600">{item.label}</p>
            <div className="mt-3 flex items-end gap-2">
              <strong className="text-2xl font-bold text-ink">{item.value}</strong>
              <span className="pb-1 text-sm text-zinc-500">{item.unit}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-brass">{item.trend}</p>
          </article>
        ))}
      </div>

      <section className={`${isVisible ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">Bảng điều hành hôm nay</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Màn này chỉ giữ overview và việc ưu tiên. Các thao tác chi tiết chuyển sang từng phân hệ riêng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onOpenProduction}
              >
                Mở màn LSX
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                type="button"
                onClick={onOpenJournal}
              >
                Mở NK NVL
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-sky-200 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">LSX đang xử lý</p>
              <p className="mt-2 text-2xl font-bold text-sky-900">{productionOverview.inProgressCount}</p>
              <p className="mt-2 text-sm text-zinc-700">Các lệnh đang có phát sinh vận hành trong ngày.</p>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">LSX quá hạn</p>
              <p className="mt-2 text-2xl font-bold text-rose-900">{productionOverview.overdueCount}</p>
              <p className="mt-2 text-sm text-zinc-700">Cần rà soát deadline và tiến độ giao hàng.</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-md border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-ink">Giao dịch NVL gần đây</h4>
                  <p className="mt-1 text-xs text-zinc-500">Hiển thị nhanh các dòng vừa phát sinh để theo dõi tiến độ.</p>
                </div>
                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                  {recentOrders.length} dòng
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {recentOrders.slice(0, 4).map((order) => (
                  <button
                    key={`dashboard-recent-${order.id ?? order.code ?? `${order.code}-${order.material}`}`}
                    className="flex w-full items-center justify-between rounded-md border border-line bg-white px-3 py-3 text-left hover:border-jade/60 hover:bg-emerald-50/40"
                    type="button"
                    onClick={onOpenJournal}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{order.code}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{order.material || "-"} · {order.worker || "Chưa phân công"}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600 ring-1 ring-line">
                      Xem lịch sử
                    </span>
                  </button>
                ))}
                {recentOrders.length === 0 ? (
                  <div className="rounded-md border border-dashed border-line bg-white px-4 py-6 text-sm text-zinc-500">
                    Chưa có giao dịch NVL nào để hiển thị.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-ink">LSX cần theo dõi</h4>
                  <p className="mt-1 text-xs text-zinc-500">Giữ ở mức ngắn gọn để Dashboard không biến thành màn thao tác.</p>
                </div>
                <button
                  className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
                  type="button"
                  onClick={onOpenProduction}
                >
                  Xem toàn bộ
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {orderSummaries.slice(0, 4).map((summary) => (
                  <button
                    key={orderRowKey(summary)}
                    className="flex w-full items-center justify-between rounded-md border border-line bg-white px-3 py-3 text-left hover:border-jade/60 hover:bg-emerald-50/40"
                    type="button"
                    onClick={() => onSelectProductionOrder(summary.code, summary.sku)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{summary.code}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{summary.plannedStage || "-"} · {summary.plannedWorker || "Chưa phân công"}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${statusClass[summary.status]}`}>
                      {summary.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
