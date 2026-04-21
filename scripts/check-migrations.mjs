// One-shot schema verifier for migrations 00008–00012.
// Reads .env.local, selects each new column once — ok if column exists,
// error if it doesn't. Safe to delete after verification.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      const k = l.slice(0, idx).trim();
      const v = l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      return [k, v];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

const checks = [
  ["sync_scores",         "confidence",           "00008"],
  ["opportunity_matches", "confidence",           "00009"],
  ["song_metadata",       "scene_tags",           "00010"],
  ["song_metadata",       "dialogue_safe_score",  "00010"],
  ["song_metadata",       "cutdown_points",       "00010"],
  ["song_metadata",       "loop_points",          "00010"],
  ["song_metadata",       "tv_mix_available",     "00010"],
  ["deliverables",        "artifact_type",        "00010"],
  ["deliverables",        "song_id",              "00010"],
  ["deliverables",        "lufs_target",          "00010"],
  ["deliverables",        "true_peak_target",     "00010"],
  ["deliverables",        "qc_passed",            "00010"],
  ["deliverables",        "file_key",             "00010"],
  ["opportunities",       "brief_details",        "00011"],
  ["opportunities",       "brief_structured_at",  "00011"],
  ["opportunities",       "placement_dna_cache",  "00011"],
  ["opportunities",       "placement_dna_cached_at", "00011"],
  ["songs",               "package_status",       "00012"],
  ["songs",               "package_checked_at",   "00012"],
];

let pass = 0;
let fail = 0;
const failures = [];
for (const [table, column, mig] of checks) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (error) {
    fail += 1;
    failures.push({ mig, target: `${table}.${column}`, msg: error.message });
    console.log(`FAIL  ${mig}  ${table}.${column}  — ${error.message}`);
  } else {
    pass += 1;
    console.log(`OK    ${mig}  ${table}.${column}`);
  }
}

console.log(`\n${pass}/${checks.length} columns present, ${fail} missing.`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.mig}  ${f.target}`);
}
process.exit(fail > 0 ? 1 : 0);
