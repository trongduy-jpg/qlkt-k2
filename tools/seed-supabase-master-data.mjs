import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const materials = [
  { code: "AU9999", name: "Vang 24K", category: "gold", purity: 0.9999, unit: "gram" },
  { code: "AU750", name: "Vang 18K", category: "gold", purity: 0.75, unit: "gram" },
  { code: "PT900", name: "Platinum 900", category: "platinum", purity: 0.9, unit: "gram" },
  { code: "AG925", name: "Bac 92.5", category: "silver", purity: 0.925, unit: "gram" }
];

const workers = [
  { worker_code: "TD003", full_name: "Le Van Tung", department: "San xuat", stage: "Can keo" },
  { worker_code: "TD004", full_name: "Nguyen Van An", department: "San xuat", stage: "Can dat" },
  { worker_code: "TD005", full_name: "Tran Minh Khoi", department: "San xuat", stage: "Duc" },
  { worker_code: "TD006", full_name: "Pham Quoc Huy", department: "San xuat", stage: "Hoan thien" }
];

async function seedMaterials() {
  const { error } = await supabase.from("materials").upsert(materials, { onConflict: "code" });
  if (error) throw new Error(`Cannot seed materials: ${error.message}`);
  console.log(`- materials: ${materials.length} seeded`);
}

async function seedWorkers() {
  const { error } = await supabase.from("workers").upsert(workers, { onConflict: "worker_code" });
  if (error) throw new Error(`Cannot seed workers: ${error.message}`);
  console.log(`- workers: ${workers.length} seeded`);
}

async function seedPricePeriod() {
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id")
    .eq("code", "AU9999")
    .single();

  if (materialError || !material) {
    throw new Error(`Cannot locate AU9999 material for price seed: ${materialError?.message ?? "missing material"}`);
  }

  const payload = {
    period_code: "2026-05",
    material_id: material.id,
    price_vnd_per_chi: 15407000,
    source: "Gia mua binh quan",
    approval_status: "approved",
    approved_at: new Date().toISOString()
  };

  const { error } = await supabase.from("price_periods").upsert(payload, { onConflict: "period_code" });
  if (error) throw new Error(`Cannot seed price_periods: ${error.message}`);
  console.log("- price_periods: 1 seeded");
}

async function main() {
  console.log("Seeding minimal master data for QLKT K2...");
  await seedMaterials();
  await seedWorkers();
  await seedPricePeriod();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
