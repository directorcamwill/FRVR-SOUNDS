// Uploads a local audio file to Supabase storage, creates a library_deals row,
// assigns it to rooms, and kicks off the audio analyzer.
//
// Usage:
//   node scripts/upload-catalog-deal.mjs <file> [--title T] [--artist A] [--rooms slug1,slug2] [--genre G] [--sub-genre SG] [--moods m1,m2] [--bpm N] [--key K] [--vocal V] [--key-path path/in/bucket] [--deal-type rev_share|upfront_fee]

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf-8").split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]; }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function argVal(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1];
}

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("Missing or invalid file path");
  process.exit(1);
}

const title = argVal("title", path.basename(file, path.extname(file)));
const artist = argVal("artist", "Unknown");
const roomSlugs = (argVal("rooms", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const genre = argVal("genre", null);
const subGenre = argVal("sub-genre", null);
const moods = (argVal("moods", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const bpm = argVal("bpm") ? parseInt(argVal("bpm"), 10) : null;
const key = argVal("key", null);
const vocal = argVal("vocal", null);
const dealType = argVal("deal-type", "rev_share");
const keyPath = argVal("key-path", `catalog/${path.basename(file)}`);

console.log(`Uploading ${file} → audio-files/${keyPath}`);
const buf = fs.readFileSync(file);
const contentType = file.endsWith(".mp3") ? "audio/mpeg" : file.endsWith(".wav") ? "audio/wav" : "application/octet-stream";
const { error: upErr } = await admin.storage
  .from("audio-files")
  .upload(keyPath, buf, { contentType, upsert: true });
if (upErr) { console.error("Upload ERR:", upErr.message); process.exit(1); }
console.log("  uploaded.");

const isRev = dealType === "rev_share";
const now = new Date();
const ends = new Date(now);
ends.setMonth(ends.getMonth() + (isRev ? 24 : 12));

const dealRow = {
  song_title: title,
  artist_name: artist,
  deal_type: dealType,
  artist_split_pct: isRev ? 60 : 80,
  frvr_split_pct: isRev ? 40 : 20,
  upfront_fee_cents: isRev ? null : 9900,
  upfront_fee_status: isRev ? "not_applicable" : "paid",
  term_months: isRev ? 24 : 12,
  starts_at: now.toISOString().split("T")[0],
  ends_at: ends.toISOString().split("T")[0],
  exclusive_sync: isRev,
  exclusive_master: false,
  exclusive_publishing: false,
  status: "active",
  song_file_path: keyPath,
  genre,
  sub_genre: subGenre,
  moods: moods.length ? moods : null,
  bpm,
  key,
  vocal_type: vocal,
  is_one_stop: true,
};

const { data: deal, error: dErr } = await admin
  .from("library_deals")
  .insert(dealRow)
  .select("id")
  .single();
if (dErr) { console.error("Insert deal ERR:", dErr.message); process.exit(1); }
console.log(`  deal id=${deal.id}`);

if (roomSlugs.length) {
  const { data: rooms } = await admin
    .from("library_rooms")
    .select("id, slug")
    .in("slug", roomSlugs);
  if (rooms?.length) {
    const rows = rooms.map((r) => ({ room_id: r.id, deal_id: deal.id }));
    const { error: rErr } = await admin.from("library_room_songs").insert(rows);
    if (rErr) { console.error("Room assign ERR:", rErr.message); }
    else console.log(`  assigned to rooms: ${rooms.map((r) => r.slug).join(", ")}`);
  }
  const missing = roomSlugs.filter((s) => !rooms?.find((r) => r.slug === s));
  if (missing.length) console.log(`  (unknown room slugs skipped: ${missing.join(", ")})`);
}

console.log("\nTriggering analyzer...");
const t0 = Date.now();
const { data: dl } = await admin.storage.from("audio-files").download(keyPath);
const { analyzeAudio, ANALYZER_VERSION } = await import("../src/lib/audio/analyzer.ts").catch(async () => {
  // Fall back: import via tsx if TS extension import fails under plain node
  const { spawnSync } = await import("node:child_process");
  return null;
});
if (!analyzeAudio) {
  console.log("  analyzer module is TypeScript — call API instead:");
  console.log(`  curl -X POST http://localhost:3000/api/audio-analysis/analyze -H 'Content-Type: application/json' -d '{"deal_id":"${deal.id}","force":true}'`);
  process.exit(0);
}
const fileBuf = Buffer.from(await dl.arrayBuffer());
const ext = keyPath.split(".").pop();
const result = await analyzeAudio(fileBuf, ext);
const { error: aErr } = await admin.from("audio_analysis").insert({
  deal_id: deal.id,
  file_path: keyPath,
  duration_sec: result.duration_sec,
  lufs_integrated: result.lufs_integrated,
  lufs_short_term_max: result.lufs_short_term_max,
  true_peak_db: result.true_peak_db,
  dynamic_range: result.dynamic_range,
  waveform_peaks: result.waveform_peaks,
  analyzer_version: ANALYZER_VERSION,
});
if (aErr) { console.error("Analyzer persist ERR:", aErr.message); process.exit(1); }

console.log(`  analysis done in ${Date.now() - t0}ms`);
console.log(`  duration=${result.duration_sec?.toFixed(1)}s · LUFS=${result.lufs_integrated} · true peak=${result.true_peak_db} dBFS · LRA=${result.dynamic_range} LU`);
console.log(`\nCatalog URL: /catalog/song/${deal.id}`);
