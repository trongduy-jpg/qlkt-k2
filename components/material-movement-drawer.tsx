"use client";

import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  DateInput,
  DrawerSection,
  FieldShell,
  SearchableSelect,
  SelectControl,
  fieldControlClass
} from "@/components/production-ui";
import type { ProductionOrder, Status } from "@/lib/domain/production";
import type { ProductionOrderItem, WorkerMaster } from "@/lib/material-service";
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

type MovementFormTab = "info" | "stage";

// Mau nhan trang thai cong doan hien o ben phai moi dong khau trong accordion.
function stageStatusPillClass(status?: string) {
  switch (status) {
    case "Hoàn thành":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Đang thực hiện":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "Bỏ qua":
      return "bg-zinc-100 text-zinc-500 ring-zinc-200";
    case "Chưa thực hiện":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-white text-zinc-400 ring-line";
  }
}

type MaterialMovementDrawerProps = {
  isOpen: boolean;
  draft: ProductionOrder;
  editingMovementId: string | null;
  movementFormTab: MovementFormTab;
  stageOptions: StageOption[];
  draftStageMovements: Map<string, ProductionOrder>;
  currentDrawerStageMovements: ProductionOrder[];
  workerOptionsForDraft: WorkerMaster[];
  itemsForDraft: ProductionOrderItem[];
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
  onEditStageMovement: (order: ProductionOrder) => void;
  onSelectItem: (item: { sku: string; productName?: string }) => void;
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
  itemsForDraft,
  isDraftForClosedOrder,
  isDraftDirectChargeInvalid,
  remoteError,
  getDynamicOptions,
  onClose,
  onTabChange,
  onDraftChange,
  onSelectStage,
  onSave,
  onRemoveMovement,
  onEditStageMovement,
  onSelectItem
}: MaterialMovementDrawerProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(editingMovementId);
  const activeStageCode = normalizeStageCode(draft.stage);
  const balancedTwoColumnGrid = "grid gap-3 md:grid-cols-2";
  // Ma hang dang duoc chon de ghi nhan cong doan. Neu LSX co danh sach Ma
  // hang chinh thuc (tao qua man Lenh san xuat), bat buoc chon truoc khi
  // hien accordion khau; neu chua co danh sach (VD ghi giao dich truoc khi
  // tao LSX) thi dung tam Ma hang go tay o tab Thong tin nhu truoc.
  const selectedItemSku = draft.itemSku || draft.sku;
  const requiresItemSelection = itemsForDraft.length > 0 && !selectedItemSku.trim();

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
          <div className={`rounded-lg border px-3 py-2.5 ${isEditing ? "border-jade/30 bg-jade/10" : "border-line bg-paper/60"}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {isEditing ? (
                <span className="rounded-full bg-jade px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Đang sửa dòng này
                </span>
              ) : null}
              <span className="text-zinc-500">
                Mã hàng <span className="font-semibold text-ink">{draft.sku || "Chưa chọn"}</span>
              </span>
              <span className="text-zinc-500">
                Công đoạn <span className="font-semibold text-ink">{draft.stage ? getStageLabel(draft.stage) : "Chưa chọn"}</span>
              </span>
              {isEditing ? (
                <span className="text-zinc-500">
                  Thợ <span className="font-semibold text-ink">{draft.worker || "(chưa có thợ)"}</span>
                </span>
              ) : null}
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
              ["stage", "Công đoạn"]
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
                  <FieldShell
                    label="Mã hàng"
                    required
                    hint={itemsForDraft.length > 0 ? "LSX này có nhiều Mã hàng, chọn đúng Mã hàng cần ghi nhận." : undefined}
                  >
                    {itemsForDraft.length > 0 ? (
                      <SelectControl
                        value={draft.itemSku || draft.sku}
                        onChange={(value) => {
                          const matched = itemsForDraft.find((item) => item.sku === value);
                          onSelectItem({ sku: value, productName: matched?.productName });
                        }}
                      >
                        <option value="">Chọn Mã hàng</option>
                        {itemsForDraft.map((item) => (
                          <option key={item.sku} value={item.sku}>{item.sku}</option>
                        ))}
                      </SelectControl>
                    ) : (
                      <input
                        className={fieldControlClass}
                        placeholder="VD: RG750Y"
                        value={draft.sku}
                        onChange={(event) => onDraftChange("sku", event.target.value)}
                      />
                    )}
                  </FieldShell>
                </div>
                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                  <FieldShell label="Loại NVL" hint="Nhóm nguyên liệu/BTP/bột/phụ kiện.">
                    <SearchableSelect
                      value={draft.materialType ?? ""}
                      onChange={(value) => onDraftChange("materialType", value)}
                      groups={[{ options: getDynamicOptions("nk_nvl_loai_nvl", materialTypeOptions) }]}
                      placeholder="Chọn loại NVL"
                      clearLabel="Chọn loại NVL"
                    />
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
                    <DateInput
                      value={draft.occurredDate ?? ""}
                      onChange={(value) => onDraftChange("occurredDate", value)}
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
            <DrawerSection
              title="Công đoạn & tiến độ"
              note={
                !draft.code
                  ? "Nhập Mã LSX ở tab Thông tin trước rồi mới ghi nhận khâu."
                  : requiresItemSelection
                    ? "LSX này có nhiều Mã hàng — chọn đúng Mã hàng cần ghi nhận trước."
                    : "Bấm vào từng khâu để mở và điền Thợ/Xuất/Nhập; điền xong bấm Lưu để đóng khâu rồi chuyển sang khâu kế."
              }
            >
              {!draft.code.trim() ? (
                <p className="rounded-md border border-dashed border-line bg-paper/60 px-3 py-4 text-sm text-zinc-500">
                  Chưa có Mã LSX. Sang tab &quot;Thông tin&quot; nhập Mã LSX trước khi ghi nhận công đoạn.
                </p>
              ) : requiresItemSelection ? (
                <div className="grid gap-2">
                  {itemsForDraft.map((item) => (
                    <button
                      key={item.sku}
                      type="button"
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left hover:border-jade hover:bg-jade/5"
                      onClick={() => onSelectItem({ sku: item.sku, productName: item.productName })}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{item.sku}</p>
                        {item.productName ? <p className="truncate text-xs text-zinc-500">{item.productName}</p> : null}
                      </div>
                      <ChevronDown className="size-4 shrink-0 -rotate-90 text-zinc-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2">
                  {itemsForDraft.length > 0 ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-jade/40 bg-jade/5 px-3 py-2 text-sm">
                      <span className="text-zinc-600">
                        Mã hàng <span className="font-semibold text-ink">{selectedItemSku}</span>
                      </span>
                      <button
                        type="button"
                        className="font-semibold text-jade underline hover:text-jade/80"
                        onClick={() => onSelectItem({ sku: "", productName: "" })}
                      >
                        Đổi Mã hàng
                      </button>
                    </div>
                  ) : null}
                  {stageOptions.map((item, index) => {
                    const recorded = draftStageMovements.get(item.value);
                    const done = Boolean(recorded);
                    const active = activeStageCode === item.value;
                    const single = isSingleWorkerStage(item.value);

                    return (
                      <div
                        key={item.value}
                        className={`overflow-hidden rounded-lg border transition-colors ${
                          active ? "border-jade bg-emerald-50/40" : "border-line bg-white"
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectStage(item.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onSelectStage(item.value);
                            }
                          }}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              done ? "bg-jade text-white" : active ? "bg-ink text-white" : "bg-zinc-200 text-zinc-500"
                            }`}
                          >
                            {done ? "✓" : index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-semibold ${active || done ? "text-ink" : "text-zinc-600"}`}>
                              {item.label}
                            </p>
                            <p className="text-[11px] text-zinc-400">{single ? "1 thợ" : "Nhiều thợ"}</p>
                          </div>
                          {active ? (
                            <div className="w-40 shrink-0" onClick={(event) => event.stopPropagation()}>
                              <SelectControl value={draft.stageStatus ?? "Đang thực hiện"} onChange={(value) => onDraftChange("stageStatus", value)}>
                                {movementStageStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </SelectControl>
                            </div>
                          ) : (
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${stageStatusPillClass(recorded?.stageStatus)}`}>
                              {recorded?.stageStatus ?? "Chưa nhập"}
                            </span>
                          )}
                          <ChevronDown className={`size-4 shrink-0 text-zinc-400 transition-transform ${active ? "rotate-180" : ""}`} />
                        </div>

                        {active ? (
                          <div className="border-t border-jade/30 px-3 py-3">
                            <FieldShell label="Thợ phụ trách" hint="Danh sách thợ được lọc theo công đoạn nếu có dữ liệu." required>
                              <SelectControl value={draft.worker} onChange={(value) => onDraftChange("worker", value)}>
                                <option value="">Chọn thợ</option>
                                {workerOptionsForDraft.map((worker) => (
                                  <option key={worker.id} value={worker.full_name}>{worker.full_name}</option>
                                ))}
                              </SelectControl>
                            </FieldShell>

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

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <FieldShell label="Loại vàng" hint="Loại vàng/NVL đang xử lý ở khâu này.">
                                <SelectControl value={draft.materialType ?? ""} onChange={(value) => onDraftChange("materialType", value)}>
                                  <option value="">Chọn loại vàng</option>
                                  {getDynamicOptions("nk_nvl_loai_nvl", materialTypeOptions).map((option) => (
                                    <option key={option.value} value={option.value} title={option.label}>{option.label}</option>
                                  ))}
                                </SelectControl>
                              </FieldShell>
                              <FieldShell label="Trạng thái tính hao" required>
                                <SelectControl value={draft.status} onChange={(value) => onDraftChange("status", value as Status)}>
                                  {movementLossStatusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </SelectControl>
                              </FieldShell>
                            </div>
                            <div className="mt-3">
                              <FieldShell label="Diễn giải giao dịch">
                                <input
                                  className={fieldControlClass}
                                  placeholder="VD: Xuất cán kéo"
                                  value={draft.sourceMaterialName ?? ""}
                                  onChange={(event) => onDraftChange("sourceMaterialName", event.target.value)}
                                />
                              </FieldShell>
                            </div>

                            <details className="mt-3 rounded-md border border-line bg-paper/50">
                              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                Nâng cao — NXT / hao hụt của khâu này
                              </summary>
                              <div className="border-t border-line/70 p-3">
                                <div className={balancedTwoColumnGrid}>
                                  <FieldShell label="Tuổi vàng" required>
                                    <SelectControl value={String(draft.goldAge ?? "")} onChange={(value) => onDraftChange("goldAge", Number(value))}>
                                      <option value="">Chọn tuổi vàng</option>
                                      {getDynamicOptions("tuoi_vang", movementGoldAgeOptions).map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </SelectControl>
                                  </FieldShell>
                                  <FieldShell label="Mã nối NXT" hint="Gõ để tìm nhanh trong danh sách.">
                                    <SearchableSelect
                                      value={draft.nxtLinkCode ?? ""}
                                      onChange={(value) => onDraftChange("nxtLinkCode", value)}
                                      groups={groupNxtLinkOptions(getDynamicOptions("nguon_nvl", sourceMaterialOptions))}
                                      placeholder="Chọn mã nối"
                                      clearLabel="Chọn mã nối"
                                    />
                                  </FieldShell>
                                </div>
                                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                                  <FieldShell label="Nguồn nhập">
                                    <SelectControl value={draft.importSource ?? ""} onChange={(value) => onDraftChange("importSource", value)}>
                                      <option value="">Chọn nguồn nhập</option>
                                      {getDynamicOptions("nguon_nhap", movementImportSourceOptions).map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </SelectControl>
                                  </FieldShell>
                                  <FieldShell label="Nguồn xuất">
                                    <SelectControl value={draft.exportSource ?? ""} onChange={(value) => onDraftChange("exportSource", value)}>
                                      <option value="">Chọn nguồn xuất</option>
                                      {getDynamicOptions("nguon_xuat", movementExportSourceOptions).map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </SelectControl>
                                  </FieldShell>
                                </div>
                                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
                                  <FieldShell label="TL quy KCP xuất" hint="Tự tính = Xuất × tuổi vàng của khâu này; sửa lại nếu cần.">
                                    <input
                                      className={fieldControlClass}
                                      type="number"
                                      step="0.0001"
                                      placeholder="0.0000"
                                      value={draft.convertedIssueWeight || ""}
                                      onChange={(event) => onDraftChange("convertedIssueWeight", Number(event.target.value))}
                                    />
                                  </FieldShell>
                                  <FieldShell label="TL quy KCP nhập" hint="Tự tính = Nhập × tuổi vàng của khâu này; sửa lại nếu cần.">
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
                                <div className={`mt-3 ${balancedTwoColumnGrid}`}>
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
                              </div>
                            </details>

                            {single ? (
                              <button
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                                type="button"
                                onClick={() => onSave("clearStage")}
                                disabled={isDraftDirectChargeInvalid || !draft.worker.trim()}
                                title="Lưu khâu này rồi đóng lại để chọn khâu kế tiếp"
                              >
                                <Check size={15} />
                                Lưu khâu này
                              </button>
                            ) : (
                              <div className="mt-3 rounded-md border border-dashed border-line bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Thợ đã ghi nhận cho khâu này ({currentDrawerStageMovements.length})
                                </p>
                                {currentDrawerStageMovements.length > 0 ? (
                                  <div className="mt-2 grid gap-1.5">
                                    {currentDrawerStageMovements.map((movement) => {
                                      const isBeingEdited = movement.id === editingMovementId;
                                      return (
                                        <div
                                          key={movement.id}
                                          className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs ${
                                            isBeingEdited ? "border-jade bg-jade/10" : "border-line bg-paper"
                                          }`}
                                        >
                                          <span className="font-medium text-zinc-800">
                                            {movement.worker || "(chưa có thợ)"}
                                            {isBeingEdited ? <span className="ml-1.5 text-[10px] font-semibold uppercase text-jade">Đang sửa</span> : null}
                                          </span>
                                          <div className="flex flex-wrap items-center gap-3 text-zinc-600">
                                            <span>Xuất {formatGram(movement.issued)}</span>
                                            <span>Nhập {formatGram(movement.returned)}</span>
                                            <button
                                              className="inline-flex size-6 items-center justify-center rounded-md border border-line bg-white text-zinc-600 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                                              type="button"
                                              title="Sửa thông tin thợ này"
                                              disabled={isBeingEdited}
                                              onClick={() => onEditStageMovement(movement)}
                                            >
                                              <Pencil size={12} />
                                            </button>
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
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-xs text-zinc-400">Chưa có thợ nào. Điền Thợ/Xuất/Nhập ở trên rồi bấm &quot;Thêm thợ vào khâu&quot;.</p>
                                )}
                                <button
                                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                                  type="button"
                                  onClick={() => onSave("keepStage")}
                                  disabled={isDraftDirectChargeInvalid || !draft.worker.trim()}
                                  title="Lưu thợ đang nhập rồi để trống cho thợ tiếp theo của cùng khâu. Đánh dấu hoàn thành khâu ở ô Trạng thái công đoạn phía trên."
                                >
                                  <Plus size={15} />
                                  Thêm thợ vào khâu
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </DrawerSection>
          ) : null}

          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-white/95 px-5 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs leading-5 text-zinc-500">
            Trường có dấu <span className="font-semibold text-rose-500">*</span> là bắt buộc. Mỗi khâu có mục &quot;Nâng cao&quot; riêng cho NXT/hao hụt; nút lưu luôn ở dưới đáy.
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
