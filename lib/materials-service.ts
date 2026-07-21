import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { MaterialMaster } from "@/lib/material-service-types";

export async function loadMaterials(): Promise<MaterialMaster[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [
      { id: "local-au9999", code: "AU9999", name: "Vàng 24K", category: "gold", purity: 0.9999, unit: "gram" },
      { id: "local-au750", code: "AU750", name: "Vàng 18K", category: "gold", purity: 0.75, unit: "gram" },
      { id: "local-pt900", code: "PT900", name: "Platinum 900", category: "platinum", purity: 0.9, unit: "gram" },
      { id: "local-ag925", code: "AG925", name: "Bạc 92.5", category: "silver", purity: 0.925, unit: "gram" }
    ];
  }

  const { data, error } = await supabase
    .from("materials")
    .select("id, code, name, category, purity, unit")
    .order("code", { ascending: true });

  if (error || !data) throw new Error(`Cannot load materials: ${error?.message ?? "unknown error"}`);
  return data.map((item) => ({ ...item, purity: Number(item.purity) })) as MaterialMaster[];
}

export async function createMaterial(input: Omit<MaterialMaster, "id">): Promise<MaterialMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("materials")
    .insert(input)
    .select("id, code, name, category, purity, unit")
    .single();

  if (error || !data) throw new Error(`Cannot create material: ${error?.message ?? "unknown error"}`);
  return { ...data, purity: Number(data.purity) } as MaterialMaster;
}

export async function updateMaterial(id: string, input: Omit<MaterialMaster, "id">): Promise<MaterialMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id };
  }

  const { data, error } = await supabase
    .from("materials")
    .update(input)
    .eq("id", id)
    .select("id, code, name, category, purity, unit")
    .single();

  if (error || !data) throw new Error(`Cannot update material: ${error?.message ?? "unknown error"}`);
  return { ...data, purity: Number(data.purity) } as MaterialMaster;
}

export async function deleteMaterial(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key constraint") || error.code === "23503") {
      throw new Error("Không xóa được: NVL này đã có giao dịch NVL gắn với mã. Hãy sửa các giao dịch đó sang NVL khác trước khi xóa.");
    }
    throw new Error(`Không xóa được NVL: ${error.message}`);
  }
}
