import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function createAuditLog(action: string, detail: string, entityId?: string) {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase.from("audit_logs").insert({
    entity_name: "material_movements",
    entity_id: entityId ?? "00000000-0000-0000-0000-000000000000",
    action,
    after_data: { detail }
  });
}
