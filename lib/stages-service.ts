import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StageMaster } from "@/lib/material-service-types";

export async function loadStages(): Promise<StageMaster[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("production_stages")
    .select("id, stage_code, stage_name, hao_hut_rule")
    .order("stage_code", { ascending: true });

  if (error || !data) {
    console.error("Failed to load production stages", error);
    return [];
  }
  return data as StageMaster[];
}

export async function createStage(input: Omit<StageMaster, "id">): Promise<StageMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("production_stages")
    .insert(input)
    .select("id, stage_code, stage_name, hao_hut_rule")
    .single();

  if (error || !data) throw new Error(`Cannot create stage: ${error?.message ?? "unknown error"}`);
  return data as StageMaster;
}

export async function updateStage(id: string, input: Omit<StageMaster, "id">): Promise<StageMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id };
  }

  const { data, error } = await supabase
    .from("production_stages")
    .update(input)
    .eq("id", id)
    .select("id, stage_code, stage_name, hao_hut_rule")
    .single();

  if (error || !data) throw new Error(`Cannot update stage: ${error?.message ?? "unknown error"}`);
  return data as StageMaster;
}

export async function deleteStage(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("production_stages").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key constraint") || error.code === "23503") {
      throw new Error("Không xóa được: công đoạn này đang được dùng. Hãy đổi các giao dịch/thợ sang công đoạn khác trước khi xóa.");
    }
    throw new Error(`Không xóa được công đoạn: ${error.message}`);
  }
}
