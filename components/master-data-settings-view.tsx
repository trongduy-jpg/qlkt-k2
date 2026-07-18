import type { Dispatch, SetStateAction } from "react";
import { LockKeyhole, Pencil, Trash2 } from "lucide-react";
import { modules } from "@/lib/demo-data";
import type { MaterialMaster, WorkerMaster } from "@/lib/material-service";

type MasterDataSettingsViewProps = {
  isVisible: boolean;
  materials: MaterialMaster[];
  workers: WorkerMaster[];
  materialDraft: Omit<MaterialMaster, "id">;
  workerDraft: Omit<WorkerMaster, "id">;
  setMaterialDraft: Dispatch<SetStateAction<Omit<MaterialMaster, "id">>>;
  setWorkerDraft: Dispatch<SetStateAction<Omit<WorkerMaster, "id">>>;
  onAddMaterial: () => void;
  onAddWorker: () => void;
  editingWorkerId: string | null;
  onStartEditWorker: (worker: WorkerMaster) => void;
  onCancelEditWorker: () => void;
  onDeleteWorker: (id: string) => void;
};

export function MasterDataSettingsView({
  isVisible,
  materials,
  workers,
  materialDraft,
  workerDraft,
  setMaterialDraft,
  setWorkerDraft,
  onAddMaterial,
  onAddWorker,
  editingWorkerId,
  onStartEditWorker,
  onCancelEditWorker,
  onDeleteWorker
}: MasterDataSettingsViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <LockKeyhole className="text-jade" size={18} />
        <h3 className="text-base font-bold text-ink">Cấu hình danh mục nền</h3>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        Quản lý nhanh danh mục NVL và thợ để form nhật ký không phải nhập tự do.
      </p>

      <div className="mt-4 balanced-grid">
        <div className="rounded-md border border-line bg-paper p-3">
          <h4 className="font-semibold text-ink">Danh mục NVL</h4>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Mã NVL" value={materialDraft.code} onChange={(event) => setMaterialDraft((current) => ({ ...current, code: event.target.value }))} />
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Tên NVL" value={materialDraft.name} onChange={(event) => setMaterialDraft((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select className="rounded-md border border-line px-3 py-2 text-sm" value={materialDraft.category} onChange={(event) => setMaterialDraft((current) => ({ ...current, category: event.target.value }))}>
                <option value="gold">gold</option>
                <option value="silver">silver</option>
                <option value="platinum">platinum</option>
                <option value="other">other</option>
              </select>
              <input className="rounded-md border border-line px-3 py-2 text-sm" type="number" step="0.0001" placeholder="Hàm lượng" value={materialDraft.purity} onChange={(event) => setMaterialDraft((current) => ({ ...current, purity: Number(event.target.value) }))} />
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="ĐVT" value={materialDraft.unit} onChange={(event) => setMaterialDraft((current) => ({ ...current, unit: event.target.value }))} />
            </div>
            <button className="rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddMaterial}>
              Thêm NVL
            </button>
          </div>
          <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-line bg-white">
            {materials.map((material) => (
              <div key={material.id} className="grid grid-cols-[90px_1fr_80px] gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0">
                <span className="font-semibold text-ink">{material.code}</span>
                <span className="text-zinc-700">{material.name}</span>
                <span className="text-right text-zinc-500">{material.purity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-ink">Danh mục thợ</h4>
            {editingWorkerId ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                Đang sửa thợ
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Mã thợ" value={workerDraft.worker_code} onChange={(event) => setWorkerDraft((current) => ({ ...current, worker_code: event.target.value }))} />
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Tên thợ" value={workerDraft.full_name} onChange={(event) => setWorkerDraft((current) => ({ ...current, full_name: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Bộ phận" value={workerDraft.department} onChange={(event) => setWorkerDraft((current) => ({ ...current, department: event.target.value }))} />
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Công đoạn" value={workerDraft.stage ?? ""} onChange={(event) => setWorkerDraft((current) => ({ ...current, stage: event.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-md bg-jade px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddWorker}>
                {editingWorkerId ? "Cập nhật thợ" : "Thêm thợ"}
              </button>
              {editingWorkerId ? (
                <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditWorker}>
                  Hủy
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-line bg-white">
            {workers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">Chưa có thợ nào trong danh mục.</div>
            ) : null}
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`grid grid-cols-[90px_1fr_90px_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingWorkerId === worker.id ? "bg-amber-50/60" : ""
                }`}
              >
                <span className="font-semibold text-ink">{worker.worker_code}</span>
                <span className="truncate text-zinc-700">{worker.full_name}</span>
                <span className="text-right text-zinc-500">{worker.stage}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa thợ"
                    onClick={() => onStartEditWorker(worker)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa thợ"
                    onClick={() => onDeleteWorker(worker.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article key={module.name} className="rounded-md border border-line bg-paper px-3 py-3">
            <h4 className="font-semibold text-ink">{module.name}</h4>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{module.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
