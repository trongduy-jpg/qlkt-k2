"use client";

import { Plus, Trash2 } from "lucide-react";
import { FieldShell, SelectControl, fieldControlClass } from "@/components/production-ui";
import { createEmptyProductionOrderItem } from "@/lib/production-mappers";
import { productionOrderMaterialSpecOptions, type SelectOption } from "@/lib/production-journal-options";
import type { MaterialMaster, ProductionOrderItem } from "@/lib/material-service";

// Editor danh sach Ma hang (line item) cua 1 LSX: 1 LSX co the co nhieu Ma
// hang, moi Ma hang co bo thong tin rieng (Ten hang, So luong, Quy cach,
// TL du kien, SL da giao, TL HT...). Dung chung cho form Tao/Sua LSX.
export function ProductionItemsEditor({
  items,
  onChange,
  materials,
  getDynamicOptions,
  focusSku,
  allowManageItems = true
}: {
  items: ProductionOrderItem[];
  onChange: (items: ProductionOrderItem[]) => void;
  materials: MaterialMaster[];
  getDynamicOptions: (listKey: string, staticFallback: SelectOption[]) => SelectOption[];
  // Neu truyen focusSku va trung 1 Ma hang trong danh sach: chi hien va cho
  // sua dung Ma hang do (dung khi mo sua tu 1 dong cu the trong bang), giu
  // nguyen cac Ma hang khac cua LSX phia sau. Khong truyen (hoac khong tim
  // thay) thi hien toan bo danh sach nhu form Tao LSX.
  focusSku?: string | null;
  // Chi cho phep them/xoa Ma hang tai 1 noi duy nhat: form Tao/Sua toan bo
  // LSX (mac dinh true). Sidebar sua nhanh 1 dong luon truyen false de
  // tranh tao Ma hang moi ngoai form chinh, giu he thong gon/de dung.
  allowManageItems?: boolean;
}) {
  const fullList = items.length > 0 ? items : [createEmptyProductionOrderItem()];
  const focusIndex = focusSku ? fullList.findIndex((item) => item.sku === focusSku) : -1;
  const isFocused = focusIndex >= 0;
  const list = isFocused ? [fullList[focusIndex]] : fullList;
  const canManageItems = allowManageItems && !isFocused;

  function updateItem(index: number, patch: Partial<ProductionOrderItem>) {
    const targetIndex = isFocused ? focusIndex : index;
    onChange(fullList.map((item, position) => (position === targetIndex ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...fullList, createEmptyProductionOrderItem()]);
  }

  function removeItem(index: number) {
    const next = fullList.filter((_, position) => position !== index);
    onChange(next.length > 0 ? next : [createEmptyProductionOrderItem()]);
  }

  return (
    <div className="rounded-md border border-line bg-white/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {isFocused ? "Mã hàng đang xem" : "Danh sách Mã hàng"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {isFocused
              ? `Đang sửa đúng Mã hàng này (LSX có ${fullList.length} Mã hàng). Để thêm Mã hàng mới hoặc xóa Mã hàng khác, vào "Sửa toàn bộ LSX".`
              : canManageItems
                ? "1 LSX có thể có nhiều Mã hàng; mỗi Mã hàng nhập thông tin riêng và có tiến trình công đoạn riêng."
                : "Để thêm Mã hàng mới hoặc xóa Mã hàng, vào \"Sửa toàn bộ LSX\"."}
          </p>
        </div>
        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
          {isFocused ? `1/${fullList.length} Mã hàng` : `${list.length} Mã hàng`}
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {list.map((item, index) => (
          <div key={isFocused ? focusIndex : index} className="rounded-md border border-line bg-paper/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                {(isFocused ? focusIndex : index) + 1}
              </span>
              {canManageItems ? (
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Xóa Mã hàng này"
                  aria-label="Xóa Mã hàng này"
                  disabled={list.length <= 1}
                  onClick={() => removeItem(index)}
                >
                  <Trash2 size={13} />
                </button>
              ) : null}
            </div>

            <div className="mt-2 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FieldShell label="Mã hàng" required>
                  <input
                    className={fieldControlClass}
                    placeholder="VD: RG750Y"
                    value={item.sku}
                    onChange={(event) => updateItem(index, { sku: event.target.value })}
                  />
                </FieldShell>
              </div>
              <div className="col-span-12 md:col-span-5">
                <FieldShell label="Tên hàng / diễn giải">
                  <input
                    className={fieldControlClass}
                    placeholder="VD: Nhẫn vàng 18K"
                    value={item.productName ?? ""}
                    onChange={(event) => updateItem(index, { productName: event.target.value })}
                  />
                </FieldShell>
              </div>
              <div className="col-span-12 md:col-span-3">
                <FieldShell label="Số lượng">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    placeholder="0"
                    value={item.quantityPiece || ""}
                    onChange={(event) => updateItem(index, { quantityPiece: Number(event.target.value) })}
                  />
                </FieldShell>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FieldShell label="Quy cách">
                  <SelectControl value={item.materialSpec ?? ""} onChange={(value) => updateItem(index, { materialSpec: value })}>
                    <option value="">Chọn quy cách</option>
                    {getDynamicOptions("loai_nguyen_lieu", productionOrderMaterialSpecOptions).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </SelectControl>
                </FieldShell>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FieldShell label="NVL dự kiến">
                  <SelectControl value={item.plannedMaterial ?? ""} onChange={(value) => updateItem(index, { plannedMaterial: value })}>
                    <option value="">Chọn NVL</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.name}>{material.code} - {material.name}</option>
                    ))}
                  </SelectControl>
                </FieldShell>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FieldShell label="TL dự kiến (GR)">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={item.plannedWeightGram || ""}
                    onChange={(event) => updateItem(index, { plannedWeightGram: Number(event.target.value) })}
                  />
                </FieldShell>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FieldShell label="SL đã giao">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    placeholder="0"
                    value={item.deliveredQty || ""}
                    onChange={(event) => updateItem(index, { deliveredQty: Number(event.target.value) })}
                  />
                </FieldShell>
              </div>
              <div className="col-span-12 md:col-span-6">
                <FieldShell label="TL hoàn tất (GR)">
                  <input
                    className={fieldControlClass}
                    min="0"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={item.completedWeightGram || ""}
                    onChange={(event) => updateItem(index, { completedWeightGram: Number(event.target.value) })}
                  />
                </FieldShell>
              </div>
            </div>
          </div>
        ))}
      </div>

      {canManageItems ? (
        <button
          type="button"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-ink bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-paper"
          onClick={addItem}
        >
          <Plus size={15} />
          Thêm Mã hàng
        </button>
      ) : null}
    </div>
  );
}
