/**
 * Apply migration 229 (Fixfy partner contract templates) when DATABASE_URL is set.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/apply-partner-contracts-migration.mts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import pg from "pg";

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
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DIRECT_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL (or SUPABASE_DB_URL / DIRECT_URL) is required.");
    process.exit(1);
  }

  const sqlPath = join(process.cwd(), "../master-os/supabase/migrations/229_partner_fixfy_contract_templates.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    console.log("Applying 229_partner_fixfy_contract_templates.sql...");
    await client.query(sql);
    const { rows } = await client.query(`
      SELECT contract_type, version, title, is_active
      FROM contract_versions
      WHERE contract_type IN ('terms_of_use','self_bill_agreement','contractor_service_agreement')
        AND is_active = true
      ORDER BY contract_type
    `);
    console.log("Active partner contracts:", rows);
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Done.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
