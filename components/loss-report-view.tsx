import { formatGram, statusClass } from "@/lib/production-helpers";
import type { LossReportRow } from "@/lib/production-summary";

type LossReportViewProps = {
  isVisible: boolean;
  rows: LossReportRow[];
  onExportJson: () => void;
};

export function LossReportView({ isVisible, rows, onExportJson }: LossReportViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} mb-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex justify-end">
        <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onExportJson}>
          Xuất dữ liệu báo cáo
        </button>
      </div>

      <div className="mt-4 rounded-md border border-line bg-paper p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-ink">Bảng hao hụt</h4>
          <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
            {rows.length} dòng
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="border-b border-line bg-white text-left text-xs uppercase text-zinc-500">
                <th className="px-3 py-3">Công đoạn</th>
                <th className="px-3 py-3 text-right">Dòng phát sinh</th>
                <th className="px-3 py-3">Loại vàng/NVL</th>
                <th className="px-3 py-3 text-right">Tổng xuất</th>
                <th className="px-3 py-3 text-right">Tổng nhập</th>
                <th className="px-3 py-3 text-right">Hao hụt</th>
                <th className="px-3 py-3 text-right">Hao hụt quy 24K</th>
                <th className="px-3 py-3">Tên thợ</th>
                <th className="px-3 py-3">Số LSX</th>
                <th className="px-3 py-3">Mã hàng</th>
                <th className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line/70 bg-white">
                  <td className="px-3 py-3 font-semibold text-ink">{row.stage}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{row.count}</td>
                  <td className="px-3 py-3 text-zinc-700">{row.material}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatGram(row.issued)}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatGram(row.returned)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">{formatGram(row.loss)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-brass">{formatGram(row.convertedLoss)}</td>
                  <td className="px-3 py-3 text-zinc-700">{row.worker}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{row.lsxCode}</td>
                  <td className="px-3 py-3 text-zinc-700">{row.sku}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusClass[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
