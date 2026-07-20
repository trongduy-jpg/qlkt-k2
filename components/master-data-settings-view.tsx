"use client";

import { useState } from "react";
import { LockKeyhole, Pencil, Trash2 } from "lucide-react";
import type { StageMaster } from "@/lib/material-service";
import type { AppUser } from "@/lib/auth-service";
import { useMasterData } from "@/components/master-data-context";

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

  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <LockKeyhole className="text-jade" size={18} />
        <h3 className="text-base font-bold text-ink">Danh mục nền</h3>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        Quản lý danh mục NVL và thợ để form nhật ký không phải nhập tự do.
      </p>

      <div className="mt-4 flex gap-1 border-b border-line">
        <button
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "materials" ? "border-ink text-ink" : "border-transparent text-zinc-500 hover:text-ink"
          }`}
          type="button"
          onClick={() => setTab("materials")}
        >
          Danh mục NVL
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "workers" ? "border-ink text-ink" : "border-transparent text-zinc-500 hover:text-ink"
          }`}
          type="button"
          onClick={() => setTab("workers")}
        >
          Danh mục thợ
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "stages" ? "border-ink text-ink" : "border-transparent text-zinc-500 hover:text-ink"
          }`}
          type="button"
          onClick={() => setTab("stages")}
        >
          Công đoạn
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "reference" ? "border-ink text-ink" : "border-transparent text-zinc-500 hover:text-ink"
          }`}
          type="button"
          onClick={() => setTab("reference")}
        >
          Danh mục khác
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "users" ? "border-ink text-ink" : "border-transparent text-zinc-500 hover:text-ink"
          }`}
          type="button"
          onClick={() => setTab("users")}
        >
          Người dùng
        </button>
      </div>

      {tab === "materials" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingMaterialId ? "Sửa NVL" : "Thêm NVL"}</h4>
              {editingMaterialId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
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

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-line bg-white">
            {materials.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">Chưa có NVL nào trong danh mục.</div>
            ) : null}
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
                    onClick={() => onStartEditMaterial(material)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa NVL"
                    onClick={() => onDeleteMaterial(material.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === "workers" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingWorkerId ? "Sửa thợ" : "Thêm thợ"}</h4>
              {editingWorkerId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
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

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-line bg-white">
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
      ) : tab === "stages" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingStageId ? "Sửa công đoạn" : "Thêm công đoạn"}</h4>
              {editingStageId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Mã công đoạn (VD: CKE)" value={stageDraft.stage_code} onChange={(event) => setStageDraft((current) => ({ ...current, stage_code: event.target.value }))} />
                <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Tên công đoạn" value={stageDraft.stage_name} onChange={(event) => setStageDraft((current) => ({ ...current, stage_name: event.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Cách tính hao hụt</label>
                <select
                  className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  value={stageDraft.hao_hut_rule}
                  onChange={(event) => setStageDraft((current) => ({ ...current, hao_hut_rule: event.target.value as StageMaster["hao_hut_rule"] }))}
                >
                  <option value="truc_tiep">{haoHutRuleLabels.truc_tiep}</option>
                  <option value="kiem_soat_rui_ro">{haoHutRuleLabels.kiem_soat_rui_ro}</option>
                  <option value="binh_thuong">{haoHutRuleLabels.binh_thuong}</option>
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  Quyết định cách hệ thống tính hao hụt/rủi ro cho công đoạn này. Chưa chắc quy tắc? Chọn "Bình thường".
                </p>
              </div>
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

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-line bg-white">
            {stages.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">Chưa có công đoạn tùy chỉnh nào (danh sách mặc định vẫn dùng được bình thường).</div>
            ) : null}
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
                    onClick={() => onStartEditStage(stage)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    type="button"
                    title="Xóa công đoạn"
                    onClick={() => onDeleteStage(stage.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === "reference" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Danh mục</label>
              <select
                className="w-full rounded-md border border-line px-3 py-2 text-sm"
                value={referenceListKey}
                onChange={(event) => onChangeReferenceListKey(event.target.value)}
              >
                {referenceListKeys.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingReferenceId ? "Sửa lựa chọn" : "Thêm lựa chọn"}</h4>
              {editingReferenceId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Mã (VD: CH4)" value={referenceDraft.option_code} onChange={(event) => setReferenceDraft((current) => ({ ...current, option_code: event.target.value }))} />
                <input className="rounded-md border border-line px-3 py-2 text-sm" type="number" placeholder="Thứ tự hiển thị" value={referenceDraft.sort_order} onChange={(event) => setReferenceDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
              </div>
              <input className="rounded-md border border-line px-3 py-2 text-sm" placeholder="Tên hiển thị trong dropdown" value={referenceDraft.option_label} onChange={(event) => setReferenceDraft((current) => ({ ...current, option_label: event.target.value }))} />
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

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-line bg-white">
            {referenceOptions.filter((item) => item.list_key === referenceListKey).length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">Chưa có lựa chọn tùy chỉnh cho danh mục này (danh sách mặc định vẫn dùng được bình thường).</div>
            ) : null}
            {referenceOptions
              .filter((item) => item.list_key === referenceListKey)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((option) => (
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
                      onClick={() => onStartEditReferenceOption(option)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      type="button"
                      title="Xóa lựa chọn"
                      onClick={() => onDeleteReferenceOption(option.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="rounded-md border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-ink">{editingAppUserId ? "Sửa người dùng" : "Thêm người dùng"}</h4>
              {editingAppUserId ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Đang sửa
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                type="email"
                placeholder="Email"
                value={appUserDraft.email}
                onChange={(event) => setAppUserDraft((current) => ({ ...current, email: event.target.value }))}
              />
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="Họ tên (tùy chọn)"
                value={appUserDraft.full_name ?? ""}
                onChange={(event) => setAppUserDraft((current) => ({ ...current, full_name: event.target.value }))}
              />
              <select
                className="rounded-md border border-line px-3 py-2 text-sm"
                value={appUserDraft.role}
                onChange={(event) => setAppUserDraft((current) => ({ ...current, role: event.target.value as AppUser["role"] }))}
              >
                <option value="nhan_vien">{appUserRoleLabels.nhan_vien}</option>
                <option value="admin">{appUserRoleLabels.admin}</option>
              </select>
              <p className="text-xs text-zinc-500">
                Chỉ email trong danh sách này mới đăng nhập được. Quản trị viên vào được cả màn Cấu hình.
              </p>
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

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-line bg-white">
            {appUsers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">Chưa có người dùng nào được cấp quyền.</div>
            ) : null}
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
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    title={user.id === currentUserId ? "Không thể tự xóa chính mình" : "Xóa người dùng"}
                    disabled={user.id === currentUserId}
                    onClick={() => onDeleteAppUser(user.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
