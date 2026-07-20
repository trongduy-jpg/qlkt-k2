import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AppUserRole = "admin" | "nhan_vien";

export type AppUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppUserRole;
};

export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  const { data, error } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Không kiểm tra được quyền truy cập: ${error.message}`);
  return Boolean(data);
}

export async function sendMagicLink(email: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase chưa được cấu hình.");

  const normalizedEmail = email.trim().toLowerCase();
  const allowed = await isEmailAllowed(normalizedEmail);
  if (!allowed) {
    throw new Error("Email này chưa được admin cấp quyền truy cập hệ thống. Vui lòng liên hệ quản trị viên.");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
    }
  });

  if (error) throw new Error(`Không gửi được link đăng nhập: ${error.message}`);
}

export async function loadAppUserByEmail(email: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, full_name, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Không tải được thông tin người dùng: ${error.message}`);
  return (data as AppUser) ?? null;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.auth.signOut();
}

export async function loadAppUsers(): Promise<AppUser[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, full_name, role")
    .order("email", { ascending: true });

  if (error) throw new Error(`Không tải được danh sách người dùng: ${error.message}`);
  return data as AppUser[];
}

export async function createAppUser(input: Omit<AppUser, "id">): Promise<AppUser> {
  if (!isSupabaseConfigured || !supabase) return { ...input, id: crypto.randomUUID() };

  const { data, error } = await supabase
    .from("app_users")
    .insert({ ...input, email: input.email.trim().toLowerCase() })
    .select("id, email, full_name, role")
    .single();

  if (error || !data) {
    if (error?.code === "23505" || error?.message.includes("duplicate key")) {
      throw new Error(`Email ${input.email} đã có trong danh sách.`);
    }
    throw new Error(`Không thêm được người dùng: ${error?.message ?? "unknown error"}`);
  }
  return data as AppUser;
}

export async function updateAppUser(id: string, input: Omit<AppUser, "id">): Promise<AppUser> {
  if (!isSupabaseConfigured || !supabase) return { ...input, id };

  const { data, error } = await supabase
    .from("app_users")
    .update({ ...input, email: input.email.trim().toLowerCase() })
    .eq("id", id)
    .select("id, email, full_name, role")
    .single();

  if (error || !data) throw new Error(`Không cập nhật được người dùng: ${error?.message ?? "unknown error"}`);
  return data as AppUser;
}

export async function deleteAppUser(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) throw new Error(`Không xóa được người dùng: ${error.message}`);
}
