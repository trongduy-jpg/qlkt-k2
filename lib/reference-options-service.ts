import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ReferenceOption } from "@/lib/material-service-types";

export async function loadReferenceOptions(): Promise<ReferenceOption[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("reference_options")
    .select("id, list_key, option_code, option_label, sort_order")
    .order("list_key", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Failed to load reference options", error);
    return [];
  }
  return data as ReferenceOption[];
}

export async function createReferenceOption(input: Omit<ReferenceOption, "id">): Promise<ReferenceOption> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("reference_options")
    .insert(input)
    .select("id, list_key, option_code, option_label, sort_order")
    .single();

  if (error || !data) throw new Error(`Cannot create reference option: ${error?.message ?? "unknown error"}`);
  return data as ReferenceOption;
}

export async function updateReferenceOption(id: string, input: Omit<ReferenceOption, "id">): Promise<ReferenceOption> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id };
  }

  const { data, error } = await supabase
    .from("reference_options")
    .update(input)
    .eq("id", id)
    .select("id, list_key, option_code, option_label, sort_order")
    .single();

  if (error || !data) throw new Error(`Cannot update reference option: ${error?.message ?? "unknown error"}`);
  return data as ReferenceOption;
}

export async function deleteReferenceOption(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("reference_options").delete().eq("id", id);
  if (error) throw new Error(`Không xóa được lựa chọn: ${error.message}`);
}
