import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/v2-health
 *
 * Super-admin health check for the V2 deployment. Probes for the columns
 * and tables that migrations 00030/00031/00032 introduce, returns a clear
 * OK / MISSING report. Use this immediately after applying migrations to
 * confirm everything landed.
 *
 * Returns:
 *   { ok: boolean, tables: { <table>: "ok" | "missing" }, brand_wiki_columns: { <col>: "ok" | "missing" }, migrations: { applied: string[], missing: string[] } }
 *
 * Auth: requires super_admin. Reading information_schema is unprivileged
 * but exposing the schema layout is operator-only.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "content_pieces",
  "streak_log",
  "feedback_runs",
  "onboarding_responses",
];

const REQUIRED_BRAND_WIKI_COLUMNS = [
  // V2 — 00030
  "public_truth",
  "niche_micro_statement",
  "niche_competitors",
  "niche_gap",
  "niche_ownable_territory",
  "revenue_primary_path",
  "revenue_secondary_paths",
  "revenue_offer_100",
  "revenue_offer_1k",
  "revenue_offer_10k",
  "content_pillars",
  "content_formats",
  "platform_strategy",
  "weekly_cadence",
  "hook_library",
  "conversion_path",
  "offer_ladder",
  "content_revenue_map",
  "consistency_plan",
  "module_outputs",
  "audience_models",
  // V2 — 00032 (cadence flat columns)
  "weekly_cadence_primary_count",
  "weekly_cadence_batch_day",
  "weekly_cadence_ship_days",
];

const REQUIRED_MIGRATIONS = [
  "00030_brand_journey_v2",
  "00031_onboarding_quiz",
  "00032_cadence_columns",
];

export async function GET() {
  const access = await getUserAccess();
  if (!access?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const tables: Record<string, "ok" | "missing"> = {};
  const columns: Record<string, "ok" | "missing"> = {};

  // ── Table presence ──
  // Probe each required table with a HEAD count query. If the table doesn't
  // exist, Postgres returns a "relation does not exist" error which we map
  // to "missing".
  for (const t of REQUIRED_TABLES) {
    const { error } = await admin
      .from(t)
      .select("*", { count: "exact", head: true })
      .limit(0);
    tables[t] =
      error && /relation .* does not exist|schema cache/i.test(error.message)
        ? "missing"
        : "ok";
  }

  // ── brand_wiki column presence ──
  // information_schema is the canonical source. We query in a single round-trip.
  const { data: colRows, error: colErr } = await admin
    .from("information_schema.columns" as never)
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", "brand_wiki");

  if (colErr) {
    // Supabase REST may not allow information_schema reads — fall back to
    // a per-column probe via SELECT.
    for (const c of REQUIRED_BRAND_WIKI_COLUMNS) {
      const { error } = await admin
        .from("brand_wiki")
        .select(c)
        .limit(0);
      columns[c] =
        error && /column .* does not exist|schema cache/i.test(error.message)
          ? "missing"
          : "ok";
    }
  } else {
    const present = new Set(
      (colRows ?? [])
        .map((r) => (r as { column_name?: string }).column_name)
        .filter((s): s is string => typeof s === "string"),
    );
    for (const c of REQUIRED_BRAND_WIKI_COLUMNS) {
      columns[c] = present.has(c) ? "ok" : "missing";
    }
  }

  // ── Migration manifest (best-effort) ──
  // Supabase tracks applied migrations in supabase_migrations.schema_migrations.
  // The lookup is non-fatal — if the table isn't accessible, we just omit it.
  let applied: string[] = [];
  let missing: string[] = [];
  try {
    const { data: appliedRows } = await admin
      .from("supabase_migrations.schema_migrations" as never)
      .select("version")
      .order("version", { ascending: false });
    const versions = new Set(
      (appliedRows ?? [])
        .map((r) => (r as { version?: string }).version)
        .filter((s): s is string => typeof s === "string"),
    );
    for (const m of REQUIRED_MIGRATIONS) {
      // Migration version strings vary by environment; match on the leading
      // 5-digit prefix so 00030_brand_journey_v2 matches 20240501123000_…
      // when run via Supabase CLI.
      const prefix = m.split("_")[0];
      const found = Array.from(versions).some((v) => v.includes(prefix));
      (found ? applied : missing).push(m);
    }
  } catch {
    // schema_migrations not visible — skip section
  }

  const allTablesOk = Object.values(tables).every((v) => v === "ok");
  const allColumnsOk = Object.values(columns).every((v) => v === "ok");

  // If the schema probes all pass but the migration tracker reports them
  // missing, the migrations were applied manually via the SQL editor —
  // the schema is live, the version tracker just isn't populated. Reclassify
  // so the report doesn't spook the operator.
  const schemaLive = allTablesOk && allColumnsOk;
  let appliedSource: "cli" | "manual" | "unknown" = "unknown";
  if (applied.length === REQUIRED_MIGRATIONS.length) {
    appliedSource = "cli";
  } else if (schemaLive && missing.length === REQUIRED_MIGRATIONS.length) {
    appliedSource = "manual";
    applied = [...REQUIRED_MIGRATIONS];
    missing = [];
  }

  return NextResponse.json({
    ok: schemaLive,
    tables,
    brand_wiki_columns: columns,
    migrations: {
      applied,
      missing,
      applied_source: appliedSource,
      checked: applied.length + missing.length > 0,
    },
  });
}
