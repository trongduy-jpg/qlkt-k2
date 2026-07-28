"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { workerBoxBalanceLines, workerBoxPeriods, type WorkerBoxBalanceLine } from "@/lib/worker-box-data";
import {
  filterWorkerBoxLines,
  formatWorkerBoxMonthLabel,
  formatWorkerBoxYearLabel,
  getDefaultWorkerBoxPeriodCode,
  getPeriodsFromLines,
  parseWorkerBoxPeriodCode,
  type WorkerBoxDebtFilter,
  type WorkerBoxGoldAgeFilter,
  type WorkerBoxMetalFilter,
  type WorkerBoxReviewFilter
} from "@/lib/worker-box-service";
import { formatDisplayDate } from "@/lib/production-business-rules";

type WorkerBoxViewProps = {
  isVisible: boolean;
  useDemoData?: boolean;
  lines?: WorkerBoxBalanceLine[];
};

type WorkerBoxManualInput = {
  openingConvertedGram?: number;
  physicalConvertedGram?: number;
  depositNormConvertedGram?: number;
};

const workerBoxManualStorageKey = "qlkt-worker-box-manual-inputs-v1";
const machinePowderStageCodes = new Set(["BAO", "KBI"]);

function roundGram(value: number) {
  return Number(value.toFixed(4));
}

function parseGramInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMachinePowderStage(stageCode: string) {
  return machinePowderStageCodes.has(stageCode.toUpperCase());
}

function normalizeWorkerBoxLine(line: WorkerBoxBalanceLine, manual?: WorkerBoxManualInput): WorkerBoxBalanceLine {
  const openingConvertedGram = manual?.openingConvertedGram ?? line.openingConvertedGram;
  const physicalConvertedGram = manual?.physicalConvertedGram ?? line.physicalConvertedGram;
  const depositNormConvertedGram = manual?.depositNormConvertedGram ?? line.depositNormConvertedGram;
  const bookClosingConvertedGram = roundGram(openingConvertedGram + line.importConvertedGram - line.exportConvertedGram);
  const diffConvertedGram = roundGram(physicalConvertedGram - bookClosingConvertedGram);
  const absDiffConvertedGram = Math.abs(diffConvertedGram);
  const machinePowderConvertedGram = isMachinePowderStage(line.stageCode) ? absDiffConvertedGram : 0;
  const goldAge = line.goldAge || 1;
  const reviewStatus: WorkerBoxBalanceLine["reviewStatus"] = absDiffConvertedGram > depositNormConvertedGram ? "risk" : "matched";

  return {
    ...line,
    openingConvertedGram,
    openingRawGram: roundGram(openingConvertedGram / goldAge),
    bookClosingConvertedGram,
    bookClosingRawGram: roundGram(bookClosingConvertedGram / goldAge),
    physicalConvertedGram,
    physicalTotalRawGram: roundGram(physicalConvertedGram / goldAge),
    physicalNvlGram: roundGram(physicalConvertedGram / goldAge),
    diffConvertedGram,
    diffRawGram: roundGram(diffConvertedGram / goldAge),
    machinePowderConvertedGram,
    machinePowderRawGram: roundGram(machinePowderConvertedGram / goldAge),
    reviewLossConvertedGram: absDiffConvertedGram,
    depositNormConvertedGram,
    riskDiffConvertedGram: roundGram(absDiffConvertedGram - depositNormConvertedGram),
    reviewStatus
  };
}

function formatGram(value: number) {
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g`;
}

function reviewStatusLabel(status: WorkerBoxBalanceLine["reviewStatus"]) {
  if (status === "matched") return "Đạt định mức";
  if (status === "risk") return "Cần soát xét";
  if (status === "pending") return "Chưa soát";
  if (status === "matched") return "Đã khớp";
  if (status === "risk") return "Rủi ro";
  return "Cần soát";
}

function reviewStatusClass(status: WorkerBoxBalanceLine["reviewStatus"]) {
  if (status === "matched") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "risk") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

function metalLabel(code: WorkerBoxBalanceLine["metalCode"]) {
  if (code === "AU") return "Vàng";
  if (code === "AG") return "Bạc";
  return "PT";
}

function mapGoldAgeLabel(code: string) {
  return code;
}

export function WorkerBoxView({ isVisible, useDemoData = true, lines = [] }: WorkerBoxViewProps) {
  const computedPeriods = useMemo(() => getPeriodsFromLines(lines), [lines]);
  const [periodCode, setPeriodCode] = useState(getDefaultWorkerBoxPeriodCode());
  const [query, setQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<WorkerBoxReviewFilter>("all");
  const [metalFilter, setMetalFilter] = useState<WorkerBoxMetalFilter>("all");
  const [goldAgeFilter, setGoldAgeFilter] = useState<WorkerBoxGoldAgeFilter>("all");
  const [debtFilter, setDebtFilter] = useState<WorkerBoxDebtFilter>("all");
  const [selectedId, setSelectedId] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [manualInputs, setManualInputs] = useState<Record<string, WorkerBoxManualInput>>({});
  const [hasLoadedManualInputs, setHasLoadedManualInputs] = useState(false);
  const pageSize = 8;
  const sourceLines = useMemo(() => (useDemoData ? workerBoxBalanceLines : lines), [lines, useDemoData]);
  const adjustedLines = useMemo(
    () => sourceLines.map((line) => normalizeWorkerBoxLine(line, manualInputs[line.id])),
    [manualInputs, sourceLines]
  );
  const periodOptions = useMemo(
    () => (useDemoData ? workerBoxPeriods : computedPeriods),
    [computedPeriods, useDemoData]
  );
  const selectedPeriod = periodOptions.find((period) => period.code === periodCode) ?? periodOptions[0] ?? null;
  const selectedPeriodParts = parseWorkerBoxPeriodCode(selectedPeriod?.code ?? periodCode);
  const periodYears = useMemo(
    () => Array.from(new Set(periodOptions.map((period) => parseWorkerBoxPeriodCode(period.code).year).filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [periodOptions]
  );
  const periodMonths = useMemo(
    () => periodOptions.filter((period) => parseWorkerBoxPeriodCode(period.code).year === selectedPeriodParts.year),
    [periodOptions, selectedPeriodParts.year]
  );

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(workerBoxManualStorageKey);
      if (rawValue) {
        setManualInputs(JSON.parse(rawValue) as Record<string, WorkerBoxManualInput>);
      }
    } catch {
      setManualInputs({});
    } finally {
      setHasLoadedManualInputs(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedManualInputs) return;
    window.localStorage.setItem(workerBoxManualStorageKey, JSON.stringify(manualInputs));
  }, [hasLoadedManualInputs, manualInputs]);

  useEffect(() => {
    if (useDemoData) return;
    if (computedPeriods.length === 0) return;
    if (computedPeriods.some((period) => period.code === periodCode)) return;
    setPeriodCode(computedPeriods[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedPeriods, useDemoData]);

  const result = useMemo(() => {
    if (!useDemoData && adjustedLines.length === 0) {
      return {
        rows: [],
        total: 0,
        page: 1,
        pageSize,
        pageCount: 1,
        summary: {
          book: 0,
          physical: 0,
          diff: 0,
          risk: 0,
          pending: 0,
          matched: 0
        },
        filterOptions: {
          metalCodes: [],
          goldAgeCodes: [],
          debtStatuses: []
        }
      };
    }

    return filterWorkerBoxLines(
      {
        periodCode,
        reviewStatus: reviewFilter,
        debtStatus: debtFilter,
        metalCode: metalFilter,
        goldAgeCode: goldAgeFilter,
        query,
        page,
        pageSize
      },
      adjustedLines
    );
  }, [adjustedLines, debtFilter, goldAgeFilter, metalFilter, page, pageSize, periodCode, query, reviewFilter, useDemoData]);

  const selectedLine = result.rows.find((line) => line.id === selectedId) ?? null;

  function clearFilters() {
    setReviewFilter("all");
    setMetalFilter("all");
    setGoldAgeFilter("all");
    setDebtFilter("all");
    setQuery("");
    setPage(1);
    setSelectedId("");
    setIsDetailOpen(false);
  }

  function selectLine(line: WorkerBoxBalanceLine) {
    setSelectedId(line.id);
    setIsDetailOpen(true);
  }

  return (
    <section className={`${isVisible ? "block" : "hidden"} mt-5 space-y-4`}>
      <div className="rounded-md border border-line bg-white/94 p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 disabled:cursor-not-allowed disabled:bg-paper"
              value={selectedPeriodParts.year}
              disabled={!useDemoData && lines.length === 0}
              onChange={(event) => {
                const nextPeriod = periodOptions.find((period) => parseWorkerBoxPeriodCode(period.code).year === event.target.value);
                if (nextPeriod) setPeriodCode(nextPeriod.code);
                clearFilters();
              }}
            >
              {periodYears.length > 0 ? (
                periodYears.map((year) => (
                  <option key={year} value={year}>{`Năm ${year}`}</option>
                ))
              ) : (
                <option value="">Chưa có năm báo cáo</option>
              )}
            </select>

            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 disabled:cursor-not-allowed disabled:bg-paper"
              value={periodCode}
              disabled={!useDemoData && lines.length === 0}
              onChange={(event) => {
                setPeriodCode(event.target.value);
                clearFilters();
              }}
            >
              {useDemoData ? (
                periodMonths.map((period) => (
                  <option key={period.code} value={period.code}>{formatWorkerBoxMonthLabel(period.code)}</option>
                ))
              ) : periodMonths.length > 0 ? (
                periodMonths.map((period) => (
                  <option key={period.code} value={period.code}>{formatWorkerBoxMonthLabel(period.code)}</option>
                ))
              ) : (
                <option value="">Chưa có dữ liệu kỳ báo cáo</option>
              )}
            </select>

            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 disabled:cursor-not-allowed disabled:bg-paper"
              value={reviewFilter}
              disabled={!useDemoData && lines.length === 0}
              onChange={(event) => {
                setReviewFilter(event.target.value as WorkerBoxReviewFilter);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="risk">Cần soát xét</option>
              <option value="pending">Chưa soát</option>
              <option value="matched">Đạt định mức</option>
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-jade/30 disabled:cursor-not-allowed disabled:bg-paper sm:w-64"
                placeholder="Tìm thợ, công đoạn, NVL..."
                value={query}
                disabled={!useDemoData && lines.length === 0}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                  setSelectedId("");
                  setIsDetailOpen(false);
                }}
              />
            </div>

            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-not-allowed disabled:bg-paper disabled:text-zinc-400"
              type="button"
              disabled={!useDemoData && lines.length === 0}
              onClick={() => setIsAdvancedOpen((current) => !current)}
            >
              <SlidersHorizontal size={16} />
              Lọc thêm
            </button>
          </div>
        </div>

        {selectedPeriod ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/30 px-3 py-2 text-sm text-zinc-700">
            <span className="font-semibold text-ink">{formatWorkerBoxYearLabel(selectedPeriod.code)}</span>
            <span className="mx-2 text-zinc-400">·</span>
            <span>{formatWorkerBoxMonthLabel(selectedPeriod.code)}</span>
            <span className="mx-2 text-zinc-400">·</span>
            <span>{formatDisplayDate(selectedPeriod.fromDate)} đến {formatDisplayDate(selectedPeriod.toDate)}</span>
            <span className="mx-2 text-zinc-400">·</span>
            <span>Nguồn: <strong>{selectedPeriod.source}</strong></span>
          </div>
        ) : null}

        {isAdvancedOpen && useDemoData ? (
          <div className="mt-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4">
            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm"
              value={metalFilter}
              onChange={(event) => {
                setMetalFilter(event.target.value as WorkerBoxMetalFilter);
                setPage(1);
              }}
            >
              <option value="all">Tất cả kim loại</option>
              {result.filterOptions.metalCodes.map((metal) => (
                <option key={metal} value={metal}>{metalLabel(metal)}</option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm"
              value={goldAgeFilter}
              onChange={(event) => {
                setGoldAgeFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả tuổi vàng</option>
              {result.filterOptions.goldAgeCodes.map((age) => (
                <option key={age} value={age}>{mapGoldAgeLabel(age)}</option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-line bg-white px-3 text-sm"
              value={debtFilter}
              onChange={(event) => {
                setDebtFilter(event.target.value as WorkerBoxDebtFilter);
                setPage(1);
              }}
            >
              <option value="all">Tất cả nhóm dòng</option>
              <option value="none">Dòng thường</option>
              <option value="treo_no">Treo nợ</option>
              <option value="resolved">Đã xử lý</option>
            </select>

            <button className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink" type="button" onClick={clearFilters}>
              Xóa lọc
            </button>
          </div>
        ) : null}

        {!useDemoData && lines.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-line bg-paper px-3 py-2 text-sm text-zinc-600">
            Chưa có giao dịch NVL nào để tổng hợp tồn hộp thợ.
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Tồn sổ sách quy đổi" value={formatGram(result.summary.book)} />
          <SummaryCard label="Tồn thực tế quy đổi" value={formatGram(result.summary.physical)} />
          <SummaryCard label="Chênh lệch quy đổi" value={formatGram(result.summary.diff)} tone={result.summary.diff < 0 ? "bad" : "good"} />
          <SummaryCard label="Cần xử lý" value={`${result.summary.risk + result.summary.pending} dòng`} />
        </div>
      </div>

      <div className="grid gap-4">
        <section className="rounded-md border border-line bg-white/94 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">Bảng tồn hộp thợ</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Bảng chỉ hiển thị đúng các cột cần dùng cho nghiệp vụ đối soát.
              </p>
            </div>
            <span className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink">{result.total} dòng</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-transparent text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-3">Tháng</th>
                  <th className="px-3 py-3">Trạng thái soát xét</th>
                  <th className="px-3 py-3">Kim loại</th>
                  <th className="px-3 py-3">Tuổi vàng</th>
                  <th className="px-3 py-3">Tên thợ</th>
                  <th className="px-3 py-3">Công đoạn</th>
                  <th className="px-3 py-3 text-right">Tồn đầu kỳ</th>
                  <th className="px-3 py-3 text-right">Nhập trong kỳ</th>
                  <th className="px-3 py-3 text-right">Xuất trong kỳ</th>
                  <th className="px-3 py-3 text-right">Tồn sổ sách</th>
                  <th className="px-3 py-3 text-right">Tồn thực tế</th>
                  <th className="px-3 py-3 text-right">Chênh lệch</th>
                  <th className="px-3 py-3 text-right">Định mức ký quỹ</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length > 0 ? result.rows.map((line) => (
                  <tr
                    key={line.id}
                    className={`cursor-pointer border-b border-line/70 hover:bg-paper ${selectedId === line.id ? "bg-emerald-50/70" : ""}`}
                    onClick={() => selectLine(line)}
                  >
                    <td className="px-3 py-3">{formatWorkerBoxMonthLabel(line.periodCode)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${reviewStatusClass(line.reviewStatus)}`}>
                        {reviewStatusLabel(line.reviewStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-3">{metalLabel(line.metalCode)}</td>
                    <td className="px-3 py-3">{line.goldAgeCode}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-ink">{line.workerName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-ink">{line.stageCode}</div>
                    </td>
                    <td className="px-3 py-3 text-right">{formatGram(line.openingConvertedGram)}</td>
                    <td className="px-3 py-3 text-right">{formatGram(line.importConvertedGram)}</td>
                    <td className="px-3 py-3 text-right">{formatGram(line.exportConvertedGram)}</td>
                    <td className="px-3 py-3 text-right">{formatGram(line.bookClosingConvertedGram)}</td>
                    <td className="px-3 py-3 text-right">{formatGram(line.physicalConvertedGram)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${line.diffConvertedGram < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {formatGram(line.diffConvertedGram)}
                    </td>
                    <td className="px-3 py-3 text-right">{formatGram(line.depositNormConvertedGram)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-3 py-10 text-center text-sm text-zinc-500" colSpan={13}>
                      Chưa có dữ liệu tồn hợp thợ để hiển thị.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Trang <strong className="text-ink">{result.page}</strong> / {result.pageCount}, hiển thị tối đa {result.pageSize} dòng mỗi trang</span>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={result.page <= 1}
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                  setSelectedId("");
                  setIsDetailOpen(false);
                }}
              >
                Trước
              </button>
              <button
                className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={result.page >= result.pageCount}
                onClick={() => {
                  setPage((current) => Math.min(result.pageCount, current + 1));
                  setSelectedId("");
                  setIsDetailOpen(false);
                }}
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {isDetailOpen && selectedLine ? (
        <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-line bg-white p-5 shadow-2xl transition-transform duration-200 ${
          isDetailOpen && selectedLine ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {selectedLine ? (
          <WorkerBoxDetail
            line={selectedLine}
            onClose={() => setIsDetailOpen(false)}
            onSave={(input) => {
              setManualInputs((current) => ({ ...current, [selectedLine.id]: input }));
            }}
          />
        ) : null}
      </aside>
    </section>
  );
}

function WorkerBoxDetail({
  line,
  onClose,
  onSave
}: {
  line: WorkerBoxBalanceLine;
  onClose: () => void;
  onSave: (input: WorkerBoxManualInput) => void;
}) {
  const [openingInput, setOpeningInput] = useState(String(line.openingConvertedGram));
  const [physicalInput, setPhysicalInput] = useState(String(line.physicalConvertedGram));
  const [depositInput, setDepositInput] = useState(String(line.depositNormConvertedGram));
  const canShowMachinePowder = isMachinePowderStage(line.stageCode);
  const openingConvertedGram = parseGramInput(openingInput);
  const physicalConvertedGram = parseGramInput(physicalInput);
  const depositNormConvertedGram = parseGramInput(depositInput);
  const previewLine = normalizeWorkerBoxLine(line, {
    openingConvertedGram,
    physicalConvertedGram,
    depositNormConvertedGram
  });

  useEffect(() => {
    setOpeningInput(String(line.openingConvertedGram));
    setPhysicalInput(String(line.physicalConvertedGram));
    setDepositInput(String(line.depositNormConvertedGram));
  }, [line.id, line.openingConvertedGram, line.physicalConvertedGram, line.depositNormConvertedGram]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-brass">Chi tiết dòng tồn</p>
          <h3 className="mt-1 text-lg font-bold text-ink">{line.workerName}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {line.stageCode} - {line.stageName} · {line.materialName}
          </p>
        </div>
        <button className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper" type="button" onClick={onClose} title="Đóng" aria-label="Đóng">
          <X size={17} />
        </button>
      </div>

      <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Nhập đối soát</p>
            <p className="mt-1 text-sm text-zinc-700">
              Tồn sổ sách = Tồn đầu kỳ + Nhập trong kỳ - Xuất trong kỳ.
            </p>
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${reviewStatusClass(previewLine.reviewStatus)}`}>
            {reviewStatusLabel(previewLine.reviewStatus)}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <NumberField label="Tồn đầu kỳ" value={openingInput} onChange={setOpeningInput} />
          <NumberField label="Tồn thực tế" value={physicalInput} onChange={setPhysicalInput} />
          <NumberField label="Định mức ký quỹ" value={depositInput} onChange={setDepositInput} />
        </div>
        <div className="mt-3 grid gap-2 rounded-md border border-emerald-100 bg-white/80 p-3 text-sm sm:grid-cols-3">
          <Metric label="Tồn sổ sách" value={formatGram(previewLine.bookClosingConvertedGram)} />
          <Metric label="Chênh lệch" value={formatGram(previewLine.diffConvertedGram)} tone={previewLine.diffConvertedGram < 0 ? "bad" : "good"} />
          <Metric label="Vượt định mức" value={formatGram(Math.max(0, previewLine.riskDiffConvertedGram))} tone={previewLine.riskDiffConvertedGram > 0 ? "bad" : "good"} />
        </div>
        {canShowMachinePowder ? (
          <p className="mt-2 text-xs text-zinc-600">Tồn bột máy chỉ áp dụng cho khâu BAO/KBI, hệ thống lấy bằng chênh lệch quy đổi.</p>
        ) : null}
        <button
          className="mt-3 w-full rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white hover:bg-jade/90"
          type="button"
          onClick={() => onSave({ openingConvertedGram, physicalConvertedGram, depositNormConvertedGram })}
        >
          Lưu đối soát
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Năm theo dõi" value={formatWorkerBoxYearLabel(previewLine.periodCode)} />
        <Metric label="Tháng báo cáo" value={formatWorkerBoxMonthLabel(previewLine.periodCode)} />
        <Metric label="Trạng thái soát xét" value={reviewStatusLabel(previewLine.reviewStatus)} />
        <Metric label="Kim loại" value={metalLabel(previewLine.metalCode)} />
        <Metric label="Tuổi vàng" value={previewLine.goldAgeCode} />
        <Metric label="Tên thợ" value={`${previewLine.workerCode} - ${previewLine.workerName}`} />
        <Metric label="Mã công đoạn" value={previewLine.stageCode} />
        <Metric label="Tên công đoạn" value={previewLine.stageName} />
        <Metric label="Tồn đầu kỳ" value={formatGram(previewLine.openingConvertedGram)} />
        <Metric label="Nhập trong kỳ" value={formatGram(previewLine.importConvertedGram)} />
        <Metric label="Xuất trong kỳ" value={formatGram(previewLine.exportConvertedGram)} />
        {canShowMachinePowder ? <Metric label="Tồn bột máy" value={formatGram(previewLine.machinePowderConvertedGram)} /> : null}
        <Metric label="Tồn sổ sách" value={formatGram(previewLine.bookClosingConvertedGram)} />
        <Metric label="Tồn thực tế" value={formatGram(previewLine.physicalConvertedGram)} />
        <Metric label="Chênh lệch" value={formatGram(previewLine.diffConvertedGram)} tone={previewLine.diffConvertedGram < 0 ? "bad" : "good"} />
        <Metric label="Định mức ký quỹ" value={formatGram(previewLine.depositNormConvertedGram)} />
      </div>

      <div className="rounded-md border border-line bg-paper p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nhận xét</p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">{line.comment || "-"}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const toneClass = tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-ink";

  return (
    <div className="rounded-md border border-line bg-white px-4 py-3">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const toneClass = tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-ink";

  return (
    <div className="rounded-md bg-paper p-3">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
