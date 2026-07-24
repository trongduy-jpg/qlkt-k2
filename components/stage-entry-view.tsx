import { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatGram } from "@/lib/production-helpers";
import { isSingleWorkerStage } from "@/lib/production-business-rules";
import { fieldControlClass } from "@/components/production-ui";
import type { StageOption } from "@/lib/production-summary";
import type { OrderSummary } from "@/lib/production-types";
import type { ProductionOrder, Status } from "@/lib/domain/production";
import type { WorkerMaster } from "@/lib/material-service";

type StageEntryDraft = { worker: string; issued: number; returned: number; status: Status };

type StageEntryViewProps = {
  isVisible: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  filteredOrders: OrderSummary[];
  selectedOrderCode: string | null;
  onSelectOrder: (code: string) => void;
  selectedSummary: OrderSummary | null;
  stageOptions: StageOption[];
  entriesByStage: Record<string, ProductionOrder[]>;
  workers: WorkerMaster[];
  lossStatusOptions: Array<{ value: string; label: string }>;
  onRecord: (input: { stage: string; worker: string; issued: number; returned: number; status: Status }) => void;
  onDeleteEntry: (id: string) => void;
};

function createEmptyDraft(): StageEntryDraft {
  return { worker: "", issued: 0, returned: 0, status: "Treo nợ" };
}

export function StageEntryView({
  isVisible,
  query,
  onQueryChange,
  filteredOrders,
  selectedOrderCode,
  onSelectOrder,
  selectedSummary,
  stageOptions,
  entriesByStage,
  workers,
  lossStatusOptions,
  onRecord,
  onDeleteEntry
}: StageEntryViewProps) {
  const [drafts, setDrafts] = useState<Record<string, StageEntryDraft>>({});

  const getDraft = (code: string) => drafts[code] ?? createEmptyDraft();
  const setDraft = (code: string, patch: Partial<StageEntryDraft>) =>
    setDrafts((current) => ({ ...current, [code]: { ...getDraft(code), ...patch } }));

  const doneCount = stageOptions.filter((s) => (entriesByStage[s.value]?.length ?? 0) > 0).length;

  function submit(stageCode: string) {
    const draft = getDraft(stageCode);
    onRecord({ stage: stageCode, worker: draft.worker, issued: draft.issued, returned: draft.returned, status: draft.status });
    setDrafts((current) => ({ ...current, [stageCode]: createEmptyDraft() }));
  }

  function workerOptions(stageCode: string) {
    const matched = workers.filter((w) => w.stages.includes(stageCode));
    return matched.length > 0 ? matched : workers;
  }

  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div>
        <p className="text-sm text-zinc-600">
          Chọn 1 LSX rồi ghi nhận Thợ · Xuất · Nhập trực tiếp trên từng dòng khâu. Khâu Cán chỉ/Đan dây/Khắc bi chỉ 1 thợ; các khâu khác thêm được nhiều thợ.
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="rounded-md border border-line bg-white">
          <div className="border-b border-line/80 p-3">
            <input
              className={fieldControlClass}
              placeholder="Tìm LSX, mã hàng, khách hàng..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <div className="max-h-[560px] overflow-y-auto">
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

        <div className="rounded-md border border-line bg-white">
          {!selectedSummary ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-zinc-500">
              Chọn 1 LSX bên trái để bắt đầu ghi nhận từng khâu.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến trình công đoạn</p>
                  <h4 className="font-display mt-0.5 text-xl font-semibold text-ink">{selectedSummary.code}</h4>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    {selectedSummary.sku}
                    {selectedSummary.productName ? ` · ${selectedSummary.productName}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                  Đã qua {doneCount}/{stageOptions.length} khâu
                </span>
              </div>

              <div className="divide-y divide-line/70">
                {stageOptions.map((stage, index) => {
                  const entries = entriesByStage[stage.value] ?? [];
                  const single = isSingleWorkerStage(stage.value);
                  const canAdd = !single || entries.length === 0;
                  const draft = getDraft(stage.value);

                  return (
                    <div key={stage.value} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            entries.length > 0 ? "bg-ink text-white" : "bg-zinc-200 text-zinc-500"
                          }`}
                        >
                          {entries.length > 0 ? "✓" : index + 1}
                        </span>
                        <span className={`font-semibold ${entries.length > 0 ? "text-ink" : "text-zinc-500"}`}>{stage.label}</span>
                        <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                          {single ? "1 thợ" : "Nhiều thợ"}
                        </span>
                      </div>

                      {entries.length > 0 ? (
                        <div className="mt-2 grid gap-1.5">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-xs"
                            >
                              <span className="font-medium text-zinc-800">{entry.worker || "(chưa có thợ)"}</span>
                              <div className="flex flex-wrap items-center gap-3 text-zinc-600">
                                <span>Xuất {formatGram(entry.issued)}</span>
                                <span>Nhập {formatGram(entry.returned)}</span>
                                <span>Hao {formatGram(entry.loss)}</span>
                                <button
                                  className="inline-flex size-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  type="button"
                                  title="Xóa dòng ghi nhận này"
                                  aria-label="Xóa dòng ghi nhận này"
                                  onClick={() => onDeleteEntry(entry.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {canAdd ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_auto]">
                          <select
                            className={`${fieldControlClass} h-9`}
                            value={draft.worker}
                            onChange={(event) => setDraft(stage.value, { worker: event.target.value })}
                          >
                            <option value="">Chọn thợ</option>
                            {workerOptions(stage.value).map((worker) => (
                              <option key={worker.id} value={worker.full_name}>
                                {worker.worker_code} - {worker.full_name}
                              </option>
                            ))}
                          </select>
                          <input
                            className={`${fieldControlClass} h-9`}
                            type="number"
                            min="0"
                            placeholder="Xuất g"
                            value={draft.issued || ""}
                            onChange={(event) => setDraft(stage.value, { issued: Number(event.target.value) })}
                          />
                          <input
                            className={`${fieldControlClass} h-9`}
                            type="number"
                            min="0"
                            placeholder="Nhập g"
                            value={draft.returned || ""}
                            onChange={(event) => setDraft(stage.value, { returned: Number(event.target.value) })}
                          />
                          <select
                            className={`${fieldControlClass} h-9`}
                            value={draft.status}
                            onChange={(event) => setDraft(stage.value, { status: event.target.value as Status })}
                          >
                            {lossStatusOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="h-9 rounded-md bg-ink px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                            type="button"
                            disabled={!draft.worker.trim()}
                            onClick={() => submit(stage.value)}
                          >
                            Ghi nhận
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-400">Khâu này chỉ 1 thợ. Xóa dòng trên nếu cần đổi thợ.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
