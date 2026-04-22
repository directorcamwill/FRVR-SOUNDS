// Dev-only helper: writes a synthetic audio_analysis row so the UI positive
// path (Waveform SVG + LUFS/TruePeak/LRA tiles) can be previewed on seeded
// deals that have no uploaded audio file.
//
//   node scripts/seed-test-analysis.mjs <deal_id>
//   node scripts/seed-test-analysis.mjs <deal_id> --clear    # removes the row
//
// Do NOT run in production.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync("./.env.local", "utf8").split("\n").reduce((a, l) => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) a[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  return a;
}, {});

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const args = process.argv.slice(2);
const dealId = args.find((a) => !a.startsWith("--"));
const clear = args.includes("--clear");

if (!dealId) {
  console.error("usage: node scripts/seed-test-analysis.mjs <deal_id> [--clear]");
  process.exit(1);
}

await admin.from("audio_analysis").delete().eq("deal_id", dealId);

if (clear) {
  console.log(`cleared audio_analysis rows for deal=${dealId}`);
  process.exit(0);
}

const peaks = Array.from({ length: 500 }, (_, i) => {
  const t = i / 500;
  const envelope = Math.sin(t * Math.PI);
  const wobble = 0.5 + 0.5 * Math.sin(t * 40);
  return Math.max(0.08, Math.abs(envelope * wobble));
});

const { data, error } = await admin.from("audio_analysis").insert({
  deal_id: dealId,
  file_path: "test/seed.mp3",
  duration_sec: 218.5,
  lufs_integrated: -14.2,
  true_peak_db: -1.1,
  dynamic_range: 7.4,
  lufs_short_term_max: -11.8,
  waveform_peaks: peaks,
  analyzer_version: "v1-ebur128-testseed",
}).select("id").single();

console.log(error ? `ERR: ${error.message}` : `OK insert id=${data.id} for deal=${dealId}`);
