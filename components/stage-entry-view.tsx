import { formatGram } from "@/lib/production-helpers";
import { formatDisplayDate } from "@/lib/production-business-rules";
import type { StageProgressItem } from "@/lib/production-summary";
import type { OrderSummary } from "@/lib/production-types";

type StageEntryViewProps = {
  isVisible: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  filteredOrders: OrderSummary[];
  selectedOrderCode: string | null;
  onSelectOrder: (code: string) => void;
  selectedSummary: OrderSummary | null;
  stageProgress: StageProgressItem[];
  onUpdateStage: (stageCode: string) => void;
};

export function StageEntryView({
  isVisible,
  query,
  onQueryChange,
  filteredOrders,
  selectedOrderCode,
  onSelectOrder,
  selectedSummary,
  stageProgress,
  onUpdateStage
}: StageEntryViewProps) {
  const doneCount = stageProgress.filter((item) => item.movementCount > 0).length;

  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div>
        <h3 className="text-base font-bold text-ink">Ghi nhận công đoạn</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Chọn 1 LSX rồi ghi nhận Xuất/Nhập/Thợ trực tiếp cho từng khâu, không cần mở form Nhật ký NVL riêng.
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <div className="rounded-md border border-line bg-white">
          <div className="border-b border-line/80 p-3">
            <input
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
              placeholder="Tìm LSX, mã hàng, khách hàng..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="px-3 py-6 text-sm text-zinc-500">Không tìm thấy LSX phù hợp.</div>
            ) : (
              filteredOrders.map((summary) => (
                <button
                  key={summary.code}
                  type="button"
                  onClick={() => onSelectOrder(summary.code)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b border-line/70 px-3 py-2.5 text-left text-sm last:border-b-0 transition-colors ${
                    selectedOrderCode === summary.code ? "bg-jade/10" : "hover:bg-paper"
                  }`}
                >
                  <span className="font-semibold text-ink">{summary.code}</span>
                  <span className="truncate text-xs text-zinc-500">
                    {summary.sku}
                    {summary.customerName ? ` · ${summary.customerName}` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border border-line bg-paper p-4">
          {!selectedSummary ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
              Chọn 1 LSX bên trái để bắt đầu ghi nhận từng khâu.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Đang ghi nhận</p>
                  <h4 className="font-display mt-0.5 text-xl font-semibold text-ink">{selectedSummary.code}</h4>
                  <p className="mt-1 text-sm text-zinc-600">
                    {selectedSummary.sku}
                    {selectedSummary.productName ? ` · ${selectedSummary.productName}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                  Đã qua {doneCount}/{stageProgress.length} khâu
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {stageProgress.map((stage) => (
                  <div
                    key={stage.code}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                      stage.movementCount > 0 ? "border-line bg-white" : "border-dashed border-line/70 bg-transparent text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          stage.movementCount > 0 ? "bg-ink text-white" : "bg-zinc-200 text-zinc-500"
                        }`}
                      >
                        {stage.movementCount > 0 ? "✓" : "•"}
                      </span>
                      <span className={`font-semibold ${stage.movementCount > 0 ? "text-ink" : "text-zinc-400"}`}>{stage.label}</span>
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
                        onClick={() => onUpdateStage(stage.code)}
                      >
                        + Cập nhật khâu này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
