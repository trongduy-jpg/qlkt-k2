"use client";

import { X } from "lucide-react";
import { DateInput, FieldShell, SelectControl, fieldControlClass } from "@/components/production-ui";
import { ProductionItemsEditor } from "@/components/production-items-editor";
import { deliveryStatusClass } from "@/lib/production-helpers";
import type { MaterialMaster } from "@/lib/material-service";
import type { ProductionOrderHeader } from "@/lib/production-types";
import {
  productionOrderDeliveryStatusOptions,
  productionOrderDestinations,
  productionOrderSalesTypeOptions,
  type SelectOption
} from "@/lib/production-journal-options";

export type ProductionHeaderDraft = Omit<ProductionOrderHeader, "id" | "createdAt">;

type ProductionOrderFormOverlayProps = {
  isOpen: boolean;
  editingCode: string | null;
  draft: ProductionHeaderDraft;
  materials: MaterialMaster[];
  getDynamicOptions: (listKey: string, staticFallback: SelectOption[]) => SelectOption[];
  onDraftChange: <K extends keyof ProductionHeaderDraft>(key: K, value: ProductionHeaderDraft[K]) => void;
  onItemsChange: (items: ProductionHeaderDraft["items"]) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ProductionOrderFormOverlay({
  isOpen,
  editingCode,
  draft,
  materials,
  getDynamicOptions,
  onDraftChange,
  onItemsChange,
  onCancel,
  onSave
}: ProductionOrderFormOverlayProps) {
  // Form nay chi dung de TAO LSX moi. Sua LSX da co gio lam thang trong
  // sidebar (khong con nut mo lai form nay tu sidebar nua), nen bail neu
  // dang o trang thai sua (editingCode) de tranh hien nham.
  if (!isOpen || editingCode) return null;

  return (
    <div className="fixed inset-0 z-40 bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl items-start justify-center">
        <div className="section-card flex max-h-full w-full flex-col overflow-hidden border-emerald-200 bg-emerald-50/95">
          <FormHeader editingCode={editingCode} onCancel={onCancel} />

          <div className="overflow-y-auto px-5 py-4">
            <FormIntro deliveryStatus={draft.deliveryStatus} />
            <OrderIdentitySection
              draft={draft}
              getDynamicOptions={getDynamicOptions}
              onDraftChange={onDraftChange}
            />

            <div className="mt-4">
              <ProductionItemsEditor
                items={draft.items}
                onChange={onItemsChange}
                materials={materials}
                getDynamicOptions={getDynamicOptions}
              />
            </div>

            <ProductionPlanningSection draft={draft} onDraftChange={onDraftChange} />
          </div>

          <FormFooter onCancel={onCancel} onSave={onSave} />
        </div>
      </div>
    </div>
  );
}

function FormHeader({
  editingCode,
  onCancel
}: {
  editingCode: string | null;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-emerald-200 px-5 py-4">
      <div>
        <h4 className="font-bold text-ink">{editingCode ? "Cập nhật lệnh sản xuất" : "Tạo lệnh sản xuất mới"}</h4>
        <p className="mt-1 text-sm text-zinc-700">
          {editingCode
            ? "Chỉnh sửa thông tin gốc của LSX. Trạng thái vận hành và tiến độ thực tế sẽ tiếp tục cập nhật trong Nhật ký NVL."
            : "Tạo thông tin gốc cho LSX tại đây. Sau khi lưu, user sẽ cập nhật xuất, nhập, chuyển và trạng thái trong Nhật ký NVL."}
        </p>
      </div>
      <button
        className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-white text-zinc-700"
        type="button"
        onClick={onCancel}
        title="Đóng form"
        aria-label="Đóng form"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function FormIntro({ deliveryStatus }: { deliveryStatus: string }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-zinc-700">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-ink">Form thông tin gốc của lệnh sản xuất</p>
          <p className="mt-1">
            Màn này chỉ nhập thông tin đầu đơn. Phần xuất, nhập, chuyển và trạng thái vận hành sẽ cập nhật trong Nhật ký NVL.
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold ring-1 ${deliveryStatusClass[deliveryStatus] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
          Trạng thái LSX: {deliveryStatus || "-"}
        </span>
      </div>
    </div>
  );
}

function OrderIdentitySection({
  draft,
  getDynamicOptions,
  onDraftChange
}: {
  draft: ProductionHeaderDraft;
  getDynamicOptions: (listKey: string, staticFallback: SelectOption[]) => SelectOption[];
  onDraftChange: ProductionOrderFormOverlayProps["onDraftChange"];
}) {
  return (
    <div className="mt-4 rounded-md border border-line bg-white/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin đầu đơn</p>
      <div className="mt-3 grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-3">
          <FieldShell label="Mã LSX" hint="Mã định danh của lệnh sản xuất.">
            <input
              className={fieldControlClass}
              placeholder="VD: DHAG-260713"
              value={draft.code}
              onChange={(event) => onDraftChange("code", event.target.value)}
            />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Nơi nhận" hint="Bộ phận hoặc nơi tiếp nhận lệnh.">
            <SelectControl value={draft.destination} onChange={(value) => onDraftChange("destination", value)}>
              {getDynamicOptions("lsx_noi_nhan", productionOrderDestinations).map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4 xl:col-span-2">
          <FieldShell label="Tháng">
            <input
              className={fieldControlClass}
              type="month"
              value={draft.orderMonth}
              onChange={(event) => onDraftChange("orderMonth", event.target.value)}
            />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-4 xl:col-span-2">
          <FieldShell label="SR/KH">
            <SelectControl value={draft.salesType} onChange={(value) => onDraftChange("salesType", value)}>
              {productionOrderSalesTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-4 xl:col-span-3">
          <FieldShell label="Khách hàng">
            <input
              className={fieldControlClass}
              placeholder="Tên khách hàng"
              value={draft.customerName}
              onChange={(event) => onDraftChange("customerName", event.target.value)}
            />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Trạng thái LSX">
            <SelectControl value={draft.deliveryStatus} onChange={(value) => onDraftChange("deliveryStatus", value)}>
              {productionOrderDeliveryStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
        </div>
      </div>
    </div>
  );
}

function ProductionPlanningSection({
  draft,
  onDraftChange
}: {
  draft: ProductionHeaderDraft;
  onDraftChange: ProductionOrderFormOverlayProps["onDraftChange"];
}) {
  return (
    <div className="mt-4 rounded-md border border-line bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin lệnh sản xuất</p>
      <div className="mt-3 grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Ngày đặt hàng">
            <DateInput value={draft.orderDate} onChange={(value) => onDraftChange("orderDate", value)} />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Ngày kế hoạch" hint="Ngày dự kiến bắt đầu/ghi nhận LSX.">
            <DateInput value={draft.plannedDate} onChange={(value) => onDraftChange("plannedDate", value)} />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Deadline đơn hàng">
            <DateInput value={draft.deadlineDate} onChange={(value) => onDraftChange("deadlineDate", value)} />
          </FieldShell>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <FieldShell label="Ngày HT">
            <DateInput value={draft.completedDate} onChange={(value) => onDraftChange("completedDate", value)} />
          </FieldShell>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <FieldShell label="Quy cách chung (Độ dài/Đường kính)">
            <input
              className={fieldControlClass}
              placeholder="VD: 1.2mm / 16cm"
              value={draft.specification}
              onChange={(event) => onDraftChange("specification", event.target.value)}
            />
          </FieldShell>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <FieldShell label="Diễn giải tiến độ thực">
          <textarea
            className={`${fieldControlClass} min-h-20 resize-y`}
            placeholder="Mô tả tiến độ thực tế, vướng mắc hoặc kết quả giao hàng"
            value={draft.actualProgressNote}
            onChange={(event) => onDraftChange("actualProgressNote", event.target.value)}
          />
        </FieldShell>
        <div className="rounded-md border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm leading-6 text-zinc-600">
          Sau khi lưu LSX, phần xuất, nhập, chuyển, hao hụt và trạng thái vận hành sẽ được cập nhật trong <strong>Nhật ký NVL</strong>.
        </div>
      </div>
    </div>
  );
}

function FormFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-t border-emerald-200 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-emerald-900">
        Sau khi tạo LSX, chuyển sang Nhật ký NVL để cập nhật phát sinh và trạng thái vận hành.
      </p>
      <div className="flex gap-2">
        <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink" type="button" onClick={onCancel}>
          Hủy
        </button>
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="button" onClick={onSave}>
          Lưu LSX
        </button>
      </div>
    </div>
  );
}
