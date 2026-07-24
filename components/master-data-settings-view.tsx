"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LockKeyhole, Pencil, Trash2 } from "lucide-react";
import type { StageMaster } from "@/lib/material-service";
import type { AppUser } from "@/lib/auth-service";
import { useMasterData } from "@/components/master-data-context";
import { FieldShell, SelectControl, fieldControlClass } from "@/components/production-ui";
import { journalStages } from "@/lib/production-journal-options";
import { buildStageOptionsForDropdown } from "@/lib/production-summary";

const haoHutRuleLabels: Record<StageMaster["hao_hut_rule"], string> = {
  truc_tiep: "Trực tiếp tính chi phí",
  kiem_soat_rui_ro: "Kiểm soát rủi ro",
  binh_thuong: "Bình thường"
};

const appUserRoleLabels: Record<AppUser["role"], string> = {
  admin: "Quản trị viên",
  nhan_vien: "Nhân viên"
};

type CategoryTab = "materials" | "workers" | "stages" | "reference" | "users";

const categoryTabs: Array<{ key: CategoryTab; label: string }> = [
  { key: "materials", label: "Danh mục NVL" },
  { key: "workers", label: "Danh mục thợ" },
  { key: "stages", label: "Công đoạn" },
  { key: "reference", label: "Danh mục khác" },
  { key: "users", label: "Người dùng" }
];

function TabBar({ tab, onChange }: { tab: CategoryTab; onChange: (tab: CategoryTab) => void }) {
  return (
    <div className="mt-4 inline-flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1">
      {categoryTabs.map((item) => (
        <button
          key={item.key}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === item.key ? "bg-ink text-white" : "text-zinc-600 hover:bg-white/70 hover:text-ink"
          }`}
          type="button"
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ListPanel({
  title,
  count,
  emptyText,
  children
}: {
  title: string;
  count: number;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line/80 px-3 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h4>
        <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="px-3 py-6 text-sm text-zinc-500">{emptyText}</div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">{children}</div>
      )}
    </div>
  );
}

export function MasterDataSettingsView({ isVisible }: { isVisible: boolean }) {
  const {
    materials,
    workers,
    stages,
    referenceOptions,
    referenceListKeys,
    referenceListKey,
    onChangeReferenceListKey,
    appUsers,
    currentUserId,
    materialDraft,
    workerDraft,
    stageDraft,
    referenceDraft,
    appUserDraft,
    setMaterialDraft,
    setWorkerDraft,
    setStageDraft,
    setReferenceDraft,
    setAppUserDraft,
    onAddMaterial,
    onAddWorker,
    onAddStage,
    onAddReferenceOption,
    onAddAppUser,
    editingWorkerId,
    onStartEditWorker,
    onCancelEditWorker,
    onDeleteWorker,
    editingMaterialId,
    onStartEditMaterial,
    onCancelEditMaterial,
    onDeleteMaterial,
    editingStageId,
    onStartEditStage,
    onCancelEditStage,
    onDeleteStage,
    editingReferenceId,
    onStartEditReferenceOption,
    onCancelEditReferenceOption,
    onDeleteReferenceOption,
    editingAppUserId,
    onStartEditAppUser,
    onCancelEditAppUser,
    onDeleteAppUser
  } = useMasterData();
  const [tab, setTab] = useState<CategoryTab>("materials");
  const workerStageOptions = useMemo(() => buildStageOptionsForDropdown(stages, journalStages), [stages]);

  const filteredReferenceOptions = referenceOptions
    .filter((item) => item.list_key === referenceListKey)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <LockKeyhole className="text-jade" size={18} />
        <h3 className="text-base font-bold text-ink">Danh mục nền</h3>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        Quản lý danh mục NVL và thợ để form nhật ký không phải nhập tự do.
      </p>

      <TabBar tab={tab} onChange={setTab} />

      {tab === "materials" ? (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingMaterialId ? "Sửa NVL" : "Thêm NVL"}</h4>
              {editingMaterialId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldShell label="Mã NVL">
                  <input className={fieldControlClass} placeholder="VD: AU750" value={materialDraft.code} onChange={(event) => setMaterialDraft((current) => ({ ...current, code: event.target.value }))} />
                </FieldShell>
                <FieldShell label="Tên NVL">
                  <input className={fieldControlClass} placeholder="VD: Vàng 18K" value={materialDraft.name} onChange={(event) => setMaterialDraft((current) => ({ ...current, name: event.target.value }))} />
                </FieldShell>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldShell label="Loại">
                  <SelectControl value={materialDraft.category} onChange={(value) => setMaterialDraft((current) => ({ ...current, category: value }))}>
                    <option value="gold">gold</option>
                    <option value="silver">silver</option>
                    <option value="platinum">platinum</option>
                    <option value="other">other</option>
                  </SelectControl>
                </FieldShell>
                <FieldShell label="Hàm lượng">
                  <input className={fieldControlClass} type="number" step="0.0001" placeholder="0.75" value={materialDraft.purity} onChange={(event) => setMaterialDraft((current) => ({ ...current, purity: Number(event.target.value) }))} />
                </FieldShell>
                <FieldShell label="ĐVT">
                  <input className={fieldControlClass} placeholder="gram" value={materialDraft.unit} onChange={(event) => setMaterialDraft((current) => ({ ...current, unit: event.target.value }))} />
                </FieldShell>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddMaterial}>
                  {editingMaterialId ? "Cập nhật NVL" : "Thêm NVL"}
                </button>
                {editingMaterialId ? (
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditMaterial}>
                    Hủy
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <ListPanel title="Danh sách NVL" count={materials.length} emptyText="Chưa có NVL nào trong danh mục.">
            {materials.map((material) => (
              <div
                key={material.id}
                className={`grid grid-cols-[90px_1fr_90px_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingMaterialId === material.id ? "bg-amber-50/60" : ""
                }`}
              >
                <span className="font-semibold text-ink">{material.code}</span>
                <span className="truncate text-zinc-700">{material.name}</span>
                <span className="text-right text-zinc-500">{material.purity}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa NVL"
                    aria-label="Sửa NVL"
                    onClick={() => onStartEditMaterial(material)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa NVL"
                    aria-label="Xóa NVL"
                    onClick={() => onDeleteMaterial(material.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </ListPanel>
        </div>
      ) : tab === "workers" ? (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingWorkerId ? "Sửa thợ" : "Thêm thợ"}</h4>
              {editingWorkerId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldShell label="Mã thợ">
                  <input className={fieldControlClass} placeholder="VD: TD003" value={workerDraft.worker_code} onChange={(event) => setWorkerDraft((current) => ({ ...current, worker_code: event.target.value }))} />
                </FieldShell>
                <FieldShell label="Tên thợ">
                  <input className={fieldControlClass} placeholder="Họ và tên" value={workerDraft.full_name} onChange={(event) => setWorkerDraft((current) => ({ ...current, full_name: event.target.value }))} />
                </FieldShell>
              </div>
              <FieldShell label="Bộ phận">
                <input className={fieldControlClass} placeholder="VD: Sản xuất" value={workerDraft.department} onChange={(event) => setWorkerDraft((current) => ({ ...current, department: event.target.value }))} />
              </FieldShell>
              <FieldShell label="Các khâu có thể đảm nhận" hint="Thợ có thể chọn nhiều khâu; các khâu chỉ 1 thợ (Cán chỉ/Đan dây/Khắc bi) vẫn khai báo bình thường.">
                <div className="grid grid-cols-2 gap-1.5 rounded-md border border-line bg-white p-2 sm:grid-cols-3">
                  {workerStageOptions.map((stage) => {
                    const checked = workerDraft.stages.includes(stage.value);
                    return (
                      <label key={stage.value} className="flex items-center gap-1.5 text-xs text-zinc-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setWorkerDraft((current) => ({
                              ...current,
                              stages: event.target.checked
                                ? [...current.stages, stage.value]
                                : current.stages.filter((code) => code !== stage.value)
                            }))
                          }
                        />
                        {stage.value}
                      </label>
                    );
                  })}
                </div>
              </FieldShell>
              <div className="flex gap-2">
                <button className="flex-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddWorker}>
                  {editingWorkerId ? "Cập nhật thợ" : "Thêm thợ"}
                </button>
                {editingWorkerId ? (
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditWorker}>
                    Hủy
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <ListPanel title="Danh sách thợ" count={workers.length} emptyText="Chưa có thợ nào trong danh mục.">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`grid grid-cols-[90px_1fr_90px_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingWorkerId === worker.id ? "bg-amber-50/60" : ""
                }`}
              >
                <span className="font-semibold text-ink">{worker.worker_code}</span>
                <span className="truncate text-zinc-700">{worker.full_name}</span>
                <span className="truncate text-right text-xs text-zinc-500">{worker.stages.join(", ") || "-"}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa thợ"
                    aria-label="Sửa thợ"
                    onClick={() => onStartEditWorker(worker)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa thợ"
                    aria-label="Xóa thợ"
                    onClick={() => onDeleteWorker(worker.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </ListPanel>
        </div>
      ) : tab === "stages" ? (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingStageId ? "Sửa công đoạn" : "Thêm công đoạn"}</h4>
              {editingStageId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldShell label="Mã công đoạn">
                  <input className={fieldControlClass} placeholder="VD: CKE" value={stageDraft.stage_code} onChange={(event) => setStageDraft((current) => ({ ...current, stage_code: event.target.value }))} />
                </FieldShell>
                <FieldShell label="Tên công đoạn">
                  <input className={fieldControlClass} placeholder="VD: Cán kéo" value={stageDraft.stage_name} onChange={(event) => setStageDraft((current) => ({ ...current, stage_name: event.target.value }))} />
                </FieldShell>
              </div>
              <FieldShell label="Cách tính hao hụt" hint='Quyết định cách hệ thống tính hao hụt/rủi ro cho công đoạn này. Chưa chắc quy tắc? Chọn "Bình thường".'>
                <SelectControl
                  value={stageDraft.hao_hut_rule}
                  onChange={(value) => setStageDraft((current) => ({ ...current, hao_hut_rule: value as StageMaster["hao_hut_rule"] }))}
                >
                  <option value="truc_tiep">{haoHutRuleLabels.truc_tiep}</option>
                  <option value="kiem_soat_rui_ro">{haoHutRuleLabels.kiem_soat_rui_ro}</option>
                  <option value="binh_thuong">{haoHutRuleLabels.binh_thuong}</option>
                </SelectControl>
              </FieldShell>
              <div className="flex gap-2">
                <button className="flex-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddStage}>
                  {editingStageId ? "Cập nhật công đoạn" : "Thêm công đoạn"}
                </button>
                {editingStageId ? (
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditStage}>
                    Hủy
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <ListPanel title="Danh sách công đoạn" count={stages.length} emptyText="Chưa có công đoạn tùy chỉnh nào (danh sách mặc định vẫn dùng được bình thường).">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`grid grid-cols-[80px_1fr_170px_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingStageId === stage.id ? "bg-amber-50/60" : ""
                }`}
              >
                <span className="font-semibold text-ink">{stage.stage_code}</span>
                <span className="truncate text-zinc-700">{stage.stage_name}</span>
                <span className="text-right text-xs text-zinc-500">{haoHutRuleLabels[stage.hao_hut_rule]}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa công đoạn"
                    aria-label="Sửa công đoạn"
                    onClick={() => onStartEditStage(stage)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa công đoạn"
                    aria-label="Xóa công đoạn"
                    onClick={() => onDeleteStage(stage.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </ListPanel>
        </div>
      ) : tab === "reference" ? (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <FieldShell label="Danh mục">
              <SelectControl value={referenceListKey} onChange={onChangeReferenceListKey}>
                {referenceListKeys.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </SelectControl>
            </FieldShell>
            <div className="mt-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingReferenceId ? "Sửa lựa chọn" : "Thêm lựa chọn"}</h4>
              {editingReferenceId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldShell label="Mã lựa chọn">
                  <input className={fieldControlClass} placeholder="VD: CH4" value={referenceDraft.option_code} onChange={(event) => setReferenceDraft((current) => ({ ...current, option_code: event.target.value }))} />
                </FieldShell>
                <FieldShell label="Thứ tự hiển thị">
                  <input className={fieldControlClass} type="number" placeholder="0" value={referenceDraft.sort_order} onChange={(event) => setReferenceDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
                </FieldShell>
              </div>
              <FieldShell label="Tên hiển thị">
                <input className={fieldControlClass} placeholder="Tên hiển thị trong dropdown" value={referenceDraft.option_label} onChange={(event) => setReferenceDraft((current) => ({ ...current, option_label: event.target.value }))} />
              </FieldShell>
              <div className="flex gap-2">
                <button className="flex-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddReferenceOption}>
                  {editingReferenceId ? "Cập nhật lựa chọn" : "Thêm lựa chọn"}
                </button>
                {editingReferenceId ? (
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditReferenceOption}>
                    Hủy
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <ListPanel title="Danh sách lựa chọn" count={filteredReferenceOptions.length} emptyText="Chưa có lựa chọn tùy chỉnh cho danh mục này (danh sách mặc định vẫn dùng được bình thường).">
            {filteredReferenceOptions.map((option) => (
              <div
                key={option.id}
                className={`grid grid-cols-[100px_1fr_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingReferenceId === option.id ? "bg-amber-50/60" : ""
                }`}
              >
                <span className="font-semibold text-ink">{option.option_code}</span>
                <span className="truncate text-zinc-700">{option.option_label}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa lựa chọn"
                    aria-label="Sửa lựa chọn"
                    onClick={() => onStartEditReferenceOption(option)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa lựa chọn"
                    aria-label="Xóa lựa chọn"
                    onClick={() => onDeleteReferenceOption(option.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </ListPanel>
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingAppUserId ? "Sửa người dùng" : "Thêm người dùng"}</h4>
              {editingAppUserId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <FieldShell label="Email" required>
                <input
                  className={fieldControlClass}
                  type="email"
                  placeholder="email@congty.com"
                  value={appUserDraft.email}
                  onChange={(event) => setAppUserDraft((current) => ({ ...current, email: event.target.value }))}
                />
              </FieldShell>
              <FieldShell label="Họ tên" hint="Tùy chọn, giúp nhận diện dễ hơn trong danh sách.">
                <input
                  className={fieldControlClass}
                  placeholder="Họ và tên"
                  value={appUserDraft.full_name ?? ""}
                  onChange={(event) => setAppUserDraft((current) => ({ ...current, full_name: event.target.value }))}
                />
              </FieldShell>
              <FieldShell label="Vai trò" hint="Chỉ email trong danh sách này mới đăng nhập được. Quản trị viên vào được cả màn Cấu hình.">
                <SelectControl value={appUserDraft.role} onChange={(value) => setAppUserDraft((current) => ({ ...current, role: value as AppUser["role"] }))}>
                  <option value="nhan_vien">{appUserRoleLabels.nhan_vien}</option>
                  <option value="admin">{appUserRoleLabels.admin}</option>
                </SelectControl>
              </FieldShell>
              <div className="flex gap-2">
                <button className="flex-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onAddAppUser}>
                  {editingAppUserId ? "Cập nhật người dùng" : "Thêm người dùng"}
                </button>
                {editingAppUserId ? (
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancelEditAppUser}>
                    Hủy
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <ListPanel title="Danh sách người dùng" count={appUsers.length} emptyText="Chưa có người dùng nào được cấp quyền.">
            {appUsers.map((user) => (
              <div
                key={user.id}
                className={`grid grid-cols-[1fr_110px_auto] items-center gap-2 border-b border-line/70 px-3 py-2 text-sm last:border-b-0 ${
                  editingAppUserId === user.id ? "bg-amber-50/60" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{user.email}</p>
                  {user.full_name ? <p className="truncate text-xs text-zinc-500">{user.full_name}</p> : null}
                </div>
                <span className="text-right text-xs text-zinc-500">{appUserRoleLabels[user.role]}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper"
                    type="button"
                    title="Sửa người dùng"
                    onClick={() => onStartEditAppUser(user)}
                    aria-label="Sửa người dùng"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    title={user.id === currentUserId ? "Không thể tự xóa chính mình" : "Xóa người dùng"}
                    aria-label={user.id === currentUserId ? "Không thể tự xóa chính mình" : "Xóa người dùng"}
                    disabled={user.id === currentUserId}
                    onClick={() => onDeleteAppUser(user.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </ListPanel>
        </div>
      )}
    </section>
  );
}
