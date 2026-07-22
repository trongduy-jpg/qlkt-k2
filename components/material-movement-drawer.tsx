"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import {
  DrawerSection,
  FieldShell,
  SelectControl,
  fieldControlClass
} from "@/components/production-ui";
import type { ProductionOrder, Status } from "@/lib/demo-data";
import type { WorkerMaster } from "@/lib/material-service";
import { formatGram, isClosedStatus } from "@/lib/production-helpers";
import {
  getStageLabel,
  isSingleWorkerStage,
  normalizeStageCode
} from "@/lib/production-business-rules";
import {
  groupNxtLinkOptions,
  journalDestinations,
  materialTypeOptions,
  movementExportSourceOptions,
  movementGoldAgeOptions,
  movementImportSourceOptions,
  movementLossStatusOptions,
  movementStageStatusOptions,
  sourceMaterialOptions,
  type SelectOption
} from "@/lib/production-journal-options";
import type { StageOption } from "@/lib/production-summary";

type MovementFormTab = "info" | "stage" | "advanced";

type MaterialMovementDrawerProps = {
  isOpen: boolean;
  draft: ProductionOrder;
  editingMovementId: string | null;
  movementFormTab: MovementFormTab;
  stageOptions: StageOption[];
  draftStageMovements: Map<string, ProductionOrder>;
  currentDrawerStageMovements: ProductionOrder[];
  workerOptionsForDraft: WorkerMaster[];
  isDraftForClosedOrder: boolean;
  isDraftDirectChargeInvalid: boolean;
  remoteError: string | null;
  getDynamicOptions: (listKey: string, staticFallback: SelectOption[]) => SelectOption[];
  onClose: () => void;
  onTabChange: (tab: MovementFormTab) => void;
  onDraftChange: <K extends keyof ProductionOrder>(key: K, value: ProductionOrder[K]) => void;
  onSelectStage: (stageCode: string) => void;
  onSave: (resetMode?: "close" | "clearStage" | "keepStage") => void;
  onRemoveMovement: (id: string) => void;
};

export function MaterialMovementDrawer({
  isOpen,
  draft,
  editingMovementId,
  movementFormTab,
  stageOptions,
  draftStageMovements,
  currentDrawerStageMovements,
  workerOptionsForDraft,
  isDraftForClosedOrder,
  isDraftDirectChargeInvalid,
  remoteError,
  getDynamicOptions,
  onClose,
  onTabChange,
  onDraftChange,
  onSelectStage,
  onSave,
  onRemoveMovement
}: MaterialMovementDrawerProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(editingMovementId);
  const activeStageCode = normalizeStageCode(draft.stage);
  const balancedTwoColumnGrid = "grid gap-3 md:grid-cols-2";
  const stageButtonGrid = "grid grid-cols-3 gap-2 sm:grid-cols-4";

  return (
    <div>
      <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <section
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col overflow-hidden border-l border-line bg-white shadow-2xl transition-transform duration-200"
        aria-hidden={!isOpen}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">
              {isEditing ? "Sửa giao dịch NVL" : "Thêm giao dịch NVL"}
            </p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-ink">
              {isEditing ? draft.code || "Giao dịch NVL" : "Giao dịch mới"}
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {isEditing
                ? "Chỉnh sửa trực tiếp bên dưới, bấm Cập nhật NVL để lưu."
                : "Nhập thông tin theo mẫu Nhật ký sản xuất tháng."}
            </p>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-zinc-700 hover:bg-paper"
            type="button"
            onClick={onClose}
            title="Đóng form"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
          <div className="grid gap-3">
          <div className="rounded-lg border border-line bg-paper/60 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-zinc-500">
                Mã hàng <span className="font-semibold text-ink">{draft.sku || "Chưa chọn"}</span>
              </span>
              <span className="text-zinc-500">
                Công đoạn <span className="font-semibold text-ink">{draft.stage ? getStageLabel(draft.stage) : "Chưa chọn"}</span>
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-zinc-500">
              {isEditing
                ? "Thông tin gốc của LSX đã khoá, sửa tại màn Lệnh sản xuất nếu cần."
                : "Ưu tiên nhập theo thứ tự từ trên xuống để tránh ghi nhầm giao dịch."}
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1">
            {([
              ["info", "Thông tin"],
              ["stage", "Công đoạn"],
              ["advanced", "Nâng cao"]
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  movementFormTab === key ? "bg-ink text-white" : "text-zinc-600 hover:bg-white/70 hover:text-ink"
                }`}
                onClick={() => onTabChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {movementFormTab === "info" ? (
            <>
              <DrawerSection
                title="Thông tin LSX"
                note={isEditing ? "Mã LSX đã khoá; các trường còn lại vẫn sửa được và áp dụng cho cả lệnh." : "Nhóm nhận diện đơn và sản phẩm đang thao tác."}
              >
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="Mã LSX" required>
                    <input
                      className={fieldControlClass}
                      placeholder="VD: DHAG-260713"
                      value={draft.code}
                      disabled={isEditing}
                      onChange={(event) => onDraftChange("code", event.target.value)}
                    />
                  </FieldShell>
                  <FieldShell label="Mã hàng" required>
                    <input
                      className={fieldControlClass}
                      placeholder="VD: RG750Y"
                      value={draft.sku}
                      onChange={(event) => onDraftChange("sku", event.target.value)}
                    />
                  </FieldShell>
                </div>
                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                  <FieldShell label="Loại NVL" hint="Nhóm nguyên liệu/BTP/bột/phụ kiện.">
                    <SelectControl value={draft.materialType ?? ""} onChange={(value) => onDraftChange("materialType", value)}>
                      <option value="">Chọn loại NVL</option>
                      {getDynamicOptions("nk_nvl_loai_nvl", materialTypeOptions).map((item) => (
                        <option key={item.value} value={item.value} title={item.label}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                  <FieldShell label="Tên hàng / diễn giải">
                    <input
                      className={fieldControlClass}
                      placeholder="Tên sản phẩm hoặc ghi chú nhận diện"
                      value={draft.productName ?? ""}
                      onChange={(event) => onDraftChange("productName", event.target.value)}
                    />
                  </FieldShell>
                </div>
              </DrawerSection>

              <DrawerSection title="Thông tin chứng từ" note="Phục vụ đối chiếu ngày nghiệp vụ và số chứng từ nhập/xuất.">
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="Ngày nghiệp vụ" hint="Ngày phát sinh xuất/nhập NVL." required>
                    <input
                      className={fieldControlClass}
                      type="date"
                      value={draft.occurredDate ?? ""}
                      onChange={(event) => onDraftChange("occurredDate", event.target.value)}
                    />
                  </FieldShell>
                  <FieldShell label="Nơi nhận" required>
                    <SelectControl value={draft.destination ?? ""} onChange={(value) => onDraftChange("destination", value)}>
                      <option value="">Chọn nơi nhận</option>
                      {getDynamicOptions("nk_nvl_noi_nhan", journalDestinations).map((item) => (
                        <option key={item.value} value={item.value} title={item.label}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                </div>
                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                  <FieldShell label="Số CT xuất">
                    <input
                      className={fieldControlClass}
                      placeholder="Tự sinh nếu bỏ trống"
                      value={draft.documentNo ?? ""}
                      onChange={(event) => onDraftChange("documentNo", event.target.value)}
                    />
                  </FieldShell>
                  <FieldShell label="Số CT nhập">
                    <input
                      className={fieldControlClass}
                      placeholder="Nếu có"
                      value={draft.documentInNo ?? ""}
                      onChange={(event) => onDraftChange("documentInNo", event.target.value)}
                    />
                  </FieldShell>
                </div>
              </DrawerSection>
            </>
          ) : null}

          {movementFormTab === "stage" ? (
            <DrawerSection title="Công đoạn & số lượng" note="Chọn khâu rồi điền Thợ/Xuất/Nhập ngay bên dưới; khâu có dấu ✓ là đã ghi nhận, khâu ○ chưa nhập thì có thể bỏ qua.">
              <FieldShell label="Chọn khâu để cập nhật" hint={draft.code ? "Mỗi khâu lưu thành một dòng riêng trong Nhật ký NVL." : "Nhập Mã LSX ở trên trước rồi mới chọn khâu."} required>
                <div className={stageButtonGrid}>
                  {stageOptions.map((item) => {
                    const done = draftStageMovements.has(item.value);
                    const active = activeStageCode === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        disabled={!draft.code.trim()}
                        onClick={() => onSelectStage(item.value)}
                        className={`relative flex h-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "border-jade bg-jade text-white"
                            : done
                              ? "border-jade/40 bg-jade/10 text-ink hover:border-jade/60"
                              : "border-dashed border-line/70 text-zinc-400 hover:border-line"
                        }`}
                        title={item.label}
                      >
                        {item.value}
                        {done && !active ? (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-jade text-[10px] text-white">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </FieldShell>

              <div className={`mt-4 rounded-lg border p-3 ${draft.stage ? "border-jade/50 bg-emerald-50/60" : "border-dashed border-line bg-paper/60"}`}>
                <p className={`text-sm font-bold ${draft.stage ? "text-ink" : "text-zinc-400"}`}>
                  {draft.stage ? `● Đang nhập: ${getStageLabel(draft.stage)}` : "Chưa chọn khâu - bấm 1 ô ở trên"}
                </p>
                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                  <FieldShell label="Trạng thái công đoạn" required>
                    <SelectControl value={draft.stageStatus ?? "Đang thực hiện"} onChange={(value) => onDraftChange("stageStatus", value)}>
                      {movementStageStatusOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                  <FieldShell label="Thợ phụ trách" hint="Danh sách thợ được lọc theo công đoạn nếu có dữ liệu." required>
                    <SelectControl value={draft.worker} onChange={(value) => onDraftChange("worker", value)}>
                      <option value="">Chọn thợ</option>
                      {workerOptionsForDraft.map((worker) => (
                        <option key={worker.id} value={worker.full_name}>{worker.full_name}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                </div>

                <div className={`mt-3 grid gap-3 ${activeStageCode === "DKB" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                  {activeStageCode === "DKB" ? (
                    <FieldShell label="Số lượng viên/sợi">
                      <input
                        className={fieldControlClass}
                        min="0"
                        type="number"
                        placeholder="0"
                        value={draft.qtyPiece || ""}
                        onChange={(event) => onDraftChange("qtyPiece", Number(event.target.value))}
                      />
                    </FieldShell>
                  ) : null}
                  <FieldShell label="Xuất gram">
                    <input
                      className={fieldControlClass}
                      min="0"
                      type="number"
                      placeholder="0.00"
                      value={draft.issued || ""}
                      onChange={(event) => onDraftChange("issued", Number(event.target.value))}
                    />
                  </FieldShell>
                  <FieldShell label="Nhập gram">
                    <input
                      className={fieldControlClass}
                      min="0"
                      type="number"
                      placeholder="0.00"
                      value={draft.returned || ""}
                      onChange={(event) => onDraftChange("returned", Number(event.target.value))}
                    />
                  </FieldShell>
                </div>
                <div className="mt-3 max-w-sm">
                  <FieldShell label="Trạng thái tính hao" required>
                    <SelectControl value={draft.status} onChange={(value) => onDraftChange("status", value as Status)}>
                      {movementLossStatusOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                </div>
                <div className="mt-3">
                  <FieldShell label="Diễn giải giao dịch">
                    <input
                      className={fieldControlClass}
                      placeholder="Nhập diễn giải giao dịch (VD: Xuất cán kéo)"
                      value={draft.sourceMaterialName ?? ""}
                      onChange={(event) => onDraftChange("sourceMaterialName", event.target.value)}
                    />
                  </FieldShell>
                </div>

                {draft.stage && !isSingleWorkerStage(draft.stage) ? (
                  <div className="mt-3 rounded-md border border-dashed border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Thợ đã ghi nhận cho khâu này ({currentDrawerStageMovements.length})
                    </p>
                    {currentDrawerStageMovements.length > 0 ? (
                      <div className="mt-2 grid gap-1.5">
                        {currentDrawerStageMovements.map((movement) => (
                          <div
                            key={movement.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-xs"
                          >
                            <span className="font-medium text-zinc-800">{movement.worker || "(chưa có thợ)"}</span>
                            <div className="flex flex-wrap items-center gap-3 text-zinc-600">
                              <span>Xuất {formatGram(movement.issued)}</span>
                              <span>Nhập {formatGram(movement.returned)}</span>
                              <button
                                className="inline-flex size-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                type="button"
                                title="Xóa thợ này khỏi khâu"
                                disabled={isClosedStatus(movement.status)}
                                onClick={() => onRemoveMovement(movement.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-400">Chưa có thợ nào. Điền Thợ/Xuất/Nhập ở trên rồi bấm "+ Thêm thợ vào khâu".</p>
                    )}
                    <button
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                      type="button"
                      onClick={() => onSave("keepStage")}
                      disabled={isDraftDirectChargeInvalid || !draft.worker.trim()}
                      title="Lưu thợ đang nhập rồi để trống cho thợ tiếp theo của cùng khâu"
                    >
                      <Plus size={15} />
                      Thêm thợ vào khâu
                    </button>
                  </div>
                ) : null}
              </div>
            </DrawerSection>
          ) : null}

          {movementFormTab === "advanced" ? (
            <DrawerSection title="Thông tin NXT / tính hao" note="Nhóm phục vụ báo cáo nhập xuất tồn và quy đổi hao hụt theo tuổi vàng. Chỉ nhập khi cần NXT, quy đổi KCP hoặc nguồn nhập/xuất.">
              <div className="grid gap-3">
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="Tháng tính hao" hint="Kỳ dùng để quyết toán hao hụt.">
                    <input
                      className={fieldControlClass}
                      type="month"
                      value={draft.lossPeriod ?? ""}
                      onChange={(event) => onDraftChange("lossPeriod", event.target.value)}
                    />
                  </FieldShell>
                  <FieldShell label="Tháng NXT" hint="Kỳ dùng cho báo cáo nhập xuất tồn.">
                    <input
                      className={fieldControlClass}
                      type="month"
                      value={draft.nxtPeriod ?? ""}
                      onChange={(event) => onDraftChange("nxtPeriod", event.target.value)}
                    />
                  </FieldShell>
                </div>
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="Tuổi vàng" required>
                    <SelectControl value={String(draft.goldAge ?? "")} onChange={(value) => onDraftChange("goldAge", Number(value))}>
                      <option value="">Chọn tuổi vàng</option>
                      {getDynamicOptions("tuoi_vang", movementGoldAgeOptions).map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                  <FieldShell label="Mã nối NXT" hint="Gõ chữ cái đầu để nhảy nhanh trong danh sách.">
                    <SelectControl value={draft.nxtLinkCode ?? ""} onChange={(value) => onDraftChange("nxtLinkCode", value)}>
                      <option value="">Chọn mã nối</option>
                      {groupNxtLinkOptions(getDynamicOptions("nguon_nvl", sourceMaterialOptions)).map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </SelectControl>
                  </FieldShell>
                </div>
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="Nguồn nhập">
                    <SelectControl value={draft.importSource ?? ""} onChange={(value) => onDraftChange("importSource", value)}>
                      <option value="">Chọn nguồn nhập</option>
                      {getDynamicOptions("nguon_nhap", movementImportSourceOptions).map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                  <FieldShell label="Nguồn xuất">
                    <SelectControl value={draft.exportSource ?? ""} onChange={(value) => onDraftChange("exportSource", value)}>
                      <option value="">Chọn nguồn xuất</option>
                      {getDynamicOptions("nguon_xuat", movementExportSourceOptions).map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </SelectControl>
                  </FieldShell>
                </div>
                <div className={balancedTwoColumnGrid}>
                  <FieldShell label="TL quy KCP xuất" hint="Trọng lượng xuất đã quy đổi theo tuổi vàng.">
                    <input
                      className={fieldControlClass}
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={draft.convertedIssueWeight || ""}
                      onChange={(event) => onDraftChange("convertedIssueWeight", Number(event.target.value))}
                    />
                  </FieldShell>
                  <FieldShell label="TL quy KCP nhập" hint="Trọng lượng nhập đã quy đổi theo tuổi vàng.">
                    <input
                      className={fieldControlClass}
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={draft.convertedReturnWeight || ""}
                      onChange={(event) => onDraftChange("convertedReturnWeight", Number(event.target.value))}
                    />
                  </FieldShell>
                </div>
              </div>
            </DrawerSection>
          ) : null}

          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-white/95 px-5 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs leading-5 text-zinc-500">
            Trường có dấu <span className="font-semibold text-rose-500">*</span> là bắt buộc. Chuyển tab để nhập từng nhóm; nút lưu luôn ở dưới đáy.
          </p>
          {isDraftForClosedOrder ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              LSX này đã chốt. Bạn vẫn có thể cập nhật NK NVL theo luồng xử lý thực tế.
            </div>
          ) : null}
          {remoteError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {remoteError}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
              type="button"
              onClick={() => onSave(isEditing ? "close" : "clearStage")}
              disabled={isDraftDirectChargeInvalid}
              title={isEditing ? undefined : "Lưu khâu này, drawer vẫn mở để chọn khâu tiếp theo của cùng LSX"}
            >
              {isEditing ? <Check size={16} /> : <Plus size={16} />}
              {isEditing ? "Cập nhật NVL" : "Lưu"}
            </button>
            {editingMovementId ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                type="button"
                onClick={() => {
                  onRemoveMovement(editingMovementId);
                  onClose();
                }}
                disabled={isClosedStatus(draft.status)}
                title="Xóa giao dịch"
              >
                <Trash2 size={16} />
                Xóa
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
