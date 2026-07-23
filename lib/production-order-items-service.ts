import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductionOrderItem, ProductionOrderItemRecord } from "@/lib/material-service-types";

// Tang "Ma hang (line item)": 1 LSX co the co nhieu Ma hang, moi Ma hang
// mot bo thong tin rieng (Ten hang, So luong, Quy cach, TL du kien, SL da
// giao, TL HT...). Bang production_order_items (migration 0022).

function isMissingTableError(message?: string | null) {
  if (!message) return false;
  return (
    message.includes("production_order_items") &&
    (message.includes("does not exist") || message.includes("schema cache") || message.includes("Could not find"))
  );
}

export async function loadProductionOrderItems(): Promise<ProductionOrderItemRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("production_order_items")
    .select(
      "id, order_code, sku, product_name, quantity_piece, material_spec, planned_material, planned_gold_age, planned_material_type, delivered_qty, completed_weight_gram, note, sort_order, created_at"
    )
    .order("order_code", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) {
    // Chua chay migration 0022 -> chua co bang: tra ve rong de app van chay
    // (van dung du lieu Ma hang cu tren production_orders qua fallback o
    // tang tong hop), thay vi lam vo toan bo man hinh.
    if (isMissingTableError(error?.message)) return [];
    throw new Error(`Không tải được danh sách Mã hàng của LSX: ${error?.message ?? "unknown error"}`);
  }

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    orderCode: String(row.order_code ?? ""),
    sku: String(row.sku ?? ""),
    productName: String(row.product_name ?? ""),
    quantityPiece: Number(row.quantity_piece ?? 0),
    materialSpec: String(row.material_spec ?? ""),
    plannedMaterial: String(row.planned_material ?? ""),
    plannedGoldAge: Number(row.planned_gold_age ?? 0),
    plannedMaterialType: String(row.planned_material_type ?? ""),
    deliveredQty: Number(row.delivered_qty ?? 0),
    completedWeightGram: Number(row.completed_weight_gram ?? 0),
    note: String(row.note ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? "")
  }));
}

// Thay toan bo danh sach Ma hang cua 1 LSX bang danh sach moi (xoa het roi
// chen lai) - phu hop voi form quan ly danh sach Ma hang cua LSX.
export async function replaceProductionOrderItems(orderCode: string, items: ProductionOrderItem[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const trimmedCode = orderCode.trim();
  if (!trimmedCode) return;

  const del = await supabase.from("production_order_items").delete().eq("order_code", trimmedCode);
  if (del.error) {
    if (isMissingTableError(del.error.message)) return;
    throw new Error(`Không xóa được Mã hàng cũ của LSX ${trimmedCode}: ${del.error.message}`);
  }

  const validItems = items.filter((item) => item.sku.trim().length > 0);
  if (validItems.length === 0) return;

  const payload = validItems.map((item, index) => ({
    order_code: trimmedCode,
    sku: item.sku.trim(),
    product_name: item.productName?.trim() || null,
    quantity_piece: item.quantityPiece || 0,
    material_spec: item.materialSpec?.trim() || null,
    planned_material: item.plannedMaterial?.trim() || null,
    planned_gold_age: item.plannedGoldAge || null,
    planned_material_type: item.plannedMaterialType?.trim() || null,
    delivered_qty: item.deliveredQty || 0,
    completed_weight_gram: item.completedWeightGram || 0,
    note: item.note?.trim() || null,
    sort_order: item.sortOrder ?? index
  }));

  const ins = await supabase.from("production_order_items").insert(payload);
  if (ins.error) {
    if (isMissingTableError(ins.error.message)) return;
    throw new Error(`Không lưu được Mã hàng của LSX ${trimmedCode}: ${ins.error.message}`);
  }
}
