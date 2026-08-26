import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type FeedbackType = "bug" | "suggestion";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "rejected";

export type UserFeedback = {
  id: string;
  createdBy: string | null;
  createdByEmail: string;
  type: FeedbackType;
  content: string;
  contextModule: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

function isMissingTableError(message?: string | null) {
  if (!message) return false;
  return (
    message.includes("user_feedback") &&
    (message.includes("does not exist") || message.includes("schema cache") || message.includes("Could not find"))
  );
}

function mapRow(row: Record<string, unknown>): UserFeedback {
  return {
    id: String(row.id),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdByEmail: String(row.created_by_email ?? ""),
    type: row.type === "suggestion" ? "suggestion" : "bug",
    content: String(row.content ?? ""),
    contextModule: row.context_module ? String(row.context_module) : null,
    status:
      row.status === "in_progress" || row.status === "resolved" || row.status === "rejected"
        ? row.status
        : "open",
    adminNote: row.admin_note ? String(row.admin_note) : null,
    createdAt: String(row.created_at ?? ""),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null
  };
}

export async function createFeedback(input: {
  createdById: string | null;
  createdByEmail: string;
  type: FeedbackType;
  content: string;
  contextModule: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const trimmedContent = input.content.trim();
  if (!trimmedContent) return;

  const { error } = await supabase.from("user_feedback").insert({
    created_by: input.createdById,
    created_by_email: input.createdByEmail.trim().toLowerCase(),
    type: input.type,
    content: trimmedContent,
    context_module: input.contextModule
  });

  if (error) {
    if (isMissingTableError(error.message)) return;
    throw new Error(`Không gửi được phản hồi: ${error.message}`);
  }
}

export async function loadFeedback(): Promise<UserFeedback[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("user_feedback")
    .select("id, created_by, created_by_email, type, content, context_module, status, admin_note, created_at, resolved_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (isMissingTableError(error?.message)) return [];
    throw new Error(`Không tải được danh sách phản hồi: ${error?.message ?? "unknown error"}`);
  }

  return data.map((row: Record<string, unknown>) => mapRow(row));
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus, adminNote?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from("user_feedback")
    .update({
      status,
      admin_note: adminNote?.trim() || null,
      resolved_at: status === "resolved" || status === "rejected" ? new Date().toISOString() : null
    })
    .eq("id", id);

  if (error) {
    if (isMissingTableError(error.message)) return;
    throw new Error(`Không cập nhật được trạng thái phản hồi: ${error.message}`);
  }
}
