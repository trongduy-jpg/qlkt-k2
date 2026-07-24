"use client";

import { DateInput, FieldShell, SelectControl, fieldControlClass } from "@/components/production-ui";
import { ProductionItemsEditor } from "@/components/production-items-editor";
import type { MaterialMaster } from "@/lib/material-service";
import {
  productionOrderDeliveryStatusOptions,
  productionOrderDestinations,
  productionOrderSalesTypeOptions,
  type SelectOption
} from "@/lib/production-journal-options";
import type { ProductionHeaderDraft } from "@/components/production-order-form-overlay";

type ProductionOrderInlineEditFormProps = {
  draft: ProductionHeaderDraft;
  materials: MaterialMaster[];
  getDynamicOptions: (listKey: string, staticFallback: SelectOption[]) => SelectOption[];
  onDraftChange: <K extends keyof ProductionHeaderDraft>(key: K, value: ProductionHeaderDraft[K]) => void;
  onItemsChange: (items: ProductionHeaderDraft["items"]) => void;
  focusItemSku?: string | null;
};

export function ProductionOrderInlineEditForm({
  draft,
  materials,
  getDynamicOptions,
  onDraftChange,
  onItemsChange,
  focusItemSku
}: ProductionOrderInlineEditFormProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-zinc-700">
        Trạng thái vận hành và tiến độ thực tế sẽ tiếp tục cập nhật trong Nhật ký NVL.
      </div>

      <div className="rounded-md border border-line bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thông tin đầu đơn</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FieldShell label="Mã LSX">
            <input
              className={fieldControlClass}
              value={draft.code}
              disabled
              onChange={(event) => onDraftChange("code", event.target.value)}
            />
          </FieldShell>
          <FieldShell label="Nơi nhận">
            <SelectControl value={draft.destination} onChange={(value) => onDraftChange("destination", value)}>
              {getDynamicOptions("lsx_noi_nhan", productionOrderDestinations).map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
          <FieldShell label="Khách hàng">
            <input
              className={fieldControlClass}
              value={draft.customerName}
              onChange={(event) => onDraftChange("customerName", event.target.value)}
            />
          </FieldShell>
          <FieldShell label="SR/KH">
            <SelectControl value={draft.salesType} onChange={(value) => onDraftChange("salesType", value)}>
              {productionOrderSalesTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
          <FieldShell label="Trạng thái LSX">
            <SelectControl value={draft.deliveryStatus} onChange={(value) => onDraftChange("deliveryStatus", value)}>
              {productionOrderDeliveryStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </SelectControl>
          </FieldShell>
        </div>
      </div>

      <ProductionItemsEditor
        items={draft.items}
        onChange={onItemsChange}
        materials={materials}
        getDynamicOptions={getDynamicOptions}
        focusSku={focusItemSku}
      />

      <div className="rounded-md border border-line bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Kế hoạch sản xuất</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FieldShell label="Ngày kế hoạch">
            <DateInput value={draft.plannedDate} onChange={(value) => onDraftChange("plannedDate", value)} />
          </FieldShell>
          <FieldShell label="Deadline đơn hàng">
            <DateInput value={draft.deadlineDate} onChange={(value) => onDraftChange("deadlineDate", value)} />
          </FieldShell>
          <FieldShell label="Ngày HT">
            <DateInput value={draft.completedDate} onChange={(value) => onDraftChange("completedDate", value)} />
          </FieldShell>
          <div className="col-span-2">
            <FieldShell label="Quy cách chung (Độ dài/Đường kính)">
              <input
                className={fieldControlClass}
                value={draft.specification}
                onChange={(event) => onDraftChange("specification", event.target.value)}
              />
            </FieldShell>
          </div>
        </div>
        <div className="mt-3">
          <FieldShell label="Diễn giải tiến độ thực">
            <textarea
              className={`${fieldControlClass} min-h-20 resize-y`}
              value={draft.actualProgressNote}
              onChange={(event) => onDraftChange("actualProgressNote", event.target.value)}
            />
          </FieldShell>
        </div>
      </div>
    </div>
  );
}
