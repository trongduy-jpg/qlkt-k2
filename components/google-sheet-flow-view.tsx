import { Database } from "lucide-react";
import {
  schemaTableBlueprints,
  sheetModuleBlueprints,
  sheetSourceStats
} from "@/lib/google-sheet-blueprint";

type GoogleSheetFlowViewProps = {
  isVisible: boolean;
};

export function GoogleSheetFlowView({ isVisible }: GoogleSheetFlowViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} mt-5 space-y-5`}>
      <div className="rounded-md border border-line bg-white/94 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">Google Sheets blueprint</p>
            <h3 className="mt-1 text-lg font-bold text-ink">Kiến trúc webapp theo quy trình Google Sheet</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Tổng hợp từ dữ liệu CSV đã export. Màn hình này cho biết từng nhóm Google Sheet sẽ được thay bằng module nào,
              các trường thông tin lõi cần giữ lại và các bảng Supabase cần triển khai.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-line bg-paper px-4 py-3">
              <p className="text-xs uppercase text-zinc-500">Google Sheet</p>
              <p className="mt-1 text-xl font-bold text-ink">{sheetSourceStats.spreadsheets}</p>
            </div>
            <div className="rounded-md border border-line bg-paper px-4 py-3">
              <p className="text-xs uppercase text-zinc-500">Tab CSV</p>
              <p className="mt-1 text-xl font-bold text-ink">{sheetSourceStats.tabs}</p>
            </div>
            <div className="rounded-md border border-line bg-paper px-4 py-3">
              <p className="text-xs uppercase text-zinc-500">Module</p>
              <p className="mt-1 text-xl font-bold text-ink">{sheetModuleBlueprints.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sheetModuleBlueprints.map((module) => (
          <article key={module.name} className="rounded-md border border-line bg-white/94 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-ink">{module.name}</h4>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{module.purpose}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ring-1 ${
                module.buildPriority === "P1"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : module.buildPriority === "P2"
                    ? "bg-amber-50 text-amber-800 ring-amber-200"
                    : "bg-zinc-100 text-zinc-700 ring-zinc-300"
              }`}>
                {module.buildPriority}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-paper p-3">
                <p className="text-xs font-semibold uppercase text-zinc-500">Thay thế sheet</p>
                <div className="mt-2 space-y-1">
                  {module.replaces.map((source) => (
                    <p key={source} className="text-sm text-zinc-700">{source}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-paper p-3">
                <p className="text-xs font-semibold uppercase text-zinc-500">Bảng Supabase</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {module.tables.map((table) => (
                    <span key={table} className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-ink">
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-md border border-line bg-white p-3">
              <p className="text-xs font-semibold uppercase text-zinc-500">Trường thông tin lõi</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {module.coreFields.map((field) => (
                  <span key={field} className="rounded-md bg-paper px-2 py-1 text-xs text-zinc-700">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-md border border-line bg-white/94 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="text-jade" size={18} />
          <h3 className="text-base font-bold text-ink">Schema giai đoạn 1 cần triển khai</h3>
        </div>
        <p className="mt-1 text-sm text-zinc-600">
          File SQL đã tạo: <span className="font-semibold text-ink">supabase/phase1_google_sheet_schema.sql</span>.
          Chạy file này sau schema hiện tại để có các bảng nền thay thế Google Sheet.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-xs uppercase text-zinc-500">
                <th className="px-3 py-3">Bảng</th>
                <th className="px-3 py-3">Vai trò</th>
                <th className="px-3 py-3">Trường chính</th>
              </tr>
            </thead>
            <tbody>
              {schemaTableBlueprints.map((table) => (
                <tr key={table.name} className="border-b border-line/70 align-top">
                  <td className="px-3 py-3 font-semibold text-ink">{table.name}</td>
                  <td className="px-3 py-3 text-zinc-700">{table.purpose}</td>
                  <td className="px-3 py-3 text-zinc-700">{table.fields.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
