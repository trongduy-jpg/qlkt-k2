import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DatabaseHealth } from "@/lib/material-service-types";

export async function loadDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      usingRealSupabase: false,
      counts: {
        productionOrders: 0,
        materialMovements: 0,
        materials: 0,
        workers: 0,
        auditLogs: 0
      },
      hasOperationalData: false
    };
  }

  const [productionOrdersResult, materialMovementsResult, materialsResult, workersResult, auditLogsResult] = await Promise.all([
    supabase.from("production_orders").select("*", { count: "exact", head: true }),
    supabase.from("material_movements").select("*", { count: "exact", head: true }),
    supabase.from("materials").select("*", { count: "exact", head: true }),
    supabase.from("workers").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("*", { count: "exact", head: true })
  ]);

  const errorMessage = [
    productionOrdersResult.error?.message,
    materialMovementsResult.error?.message,
    materialsResult.error?.message,
    workersResult.error?.message,
    auditLogsResult.error?.message
  ]
    .filter(Boolean)
    .join(" | ");

  const counts = {
    productionOrders: productionOrdersResult.count ?? 0,
    materialMovements: materialMovementsResult.count ?? 0,
    materials: materialsResult.count ?? 0,
    workers: workersResult.count ?? 0,
    auditLogs: auditLogsResult.count ?? 0
  };

  return {
    usingRealSupabase: true,
    counts,
    hasOperationalData: counts.productionOrders > 0 || counts.materialMovements > 0,
    errorMessage: errorMessage || undefined
  };
}
