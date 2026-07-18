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

const tablesInDeleteOrder = [
  "audit_logs",
  "material_movements",
  "price_periods",
  "production_orders",
  "workers",
  "materials"
];

async function countRows(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Cannot count ${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function deleteRows(table) {
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) {
    throw new Error(`Cannot delete ${table}: ${error.message}`);
  }
}

async function main() {
  console.log("Resetting Supabase data for QLKT K2...");

  for (const table of tablesInDeleteOrder) {
    const before = await countRows(table);
    if (before === 0) {
      console.log(`- ${table}: 0 rows, skipped`);
      continue;
    }

    await deleteRows(table);
    const after = await countRows(table);
    console.log(`- ${table}: ${before} -> ${after}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
