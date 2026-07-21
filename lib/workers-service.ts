import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { WorkerMaster } from "@/lib/material-service-types";

export function buildWorkerCode(workerName: string) {
  return `W-${workerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 24)}`;
}

export async function loadWorkers(): Promise<WorkerMaster[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [
      { id: "local-td003", worker_code: "TD003", full_name: "Le Van Tung", department: "San xuat", stage: "Can keo" },
      { id: "local-td004", worker_code: "TD004", full_name: "Nguyen Van An", department: "San xuat", stage: "Can dat" }
    ];
  }

  const { data, error } = await supabase
    .from("workers")
    .select("id, worker_code, full_name, department, stage")
    .order("worker_code", { ascending: true });

  if (error || !data) throw new Error(`Cannot load workers: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster[];
}

export async function createWorker(input: Omit<WorkerMaster, "id">): Promise<WorkerMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id: crypto.randomUUID() };
  }

  const { data, error } = await supabase
    .from("workers")
    .insert(input)
    .select("id, worker_code, full_name, department, stage")
    .single();

  if (error || !data) throw new Error(`Cannot create worker: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster;
}

export async function updateWorker(id: string, input: Omit<WorkerMaster, "id">): Promise<WorkerMaster> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...input, id };
  }

  const { data, error } = await supabase
    .from("workers")
    .update(input)
    .eq("id", id)
    .select("id, worker_code, full_name, department, stage")
    .single();

  if (error || !data) throw new Error(`Cannot update worker: ${error?.message ?? "unknown error"}`);
  return data as WorkerMaster;
}

export async function deleteWorker(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key constraint") || error.code === "23503") {
      throw new Error("Không xóa được: thợ này đã có giao dịch NVL gắn với mã. Hãy sửa các giao dịch đó sang thợ khác trước khi xóa.");
    }
    throw new Error(`Không xóa được thợ: ${error.message}`);
  }
}
