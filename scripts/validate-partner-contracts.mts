import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) {
    console.log("SKIP: no Supabase service env configured");
    process.exit(0);
  }

  const c = createClient(url, key);
  const { data, error } = await c
    .from("contract_versions")
    .select("contract_type, version, title, is_active")
    .in("contract_type", ["terms_of_use", "self_bill_agreement", "contractor_service_agreement"])
    .eq("is_active", true);

  if (error) {
    console.error("Query error:", error.message);
    process.exit(1);
  }

  console.log(`Active partner contracts: ${data?.length ?? 0}`);
  for (const row of data ?? []) console.log(` - ${row.contract_type} v${row.version}: ${row.title}`);
  process.exit((data?.length ?? 0) >= 3 ? 0 : 1);
}

main();
