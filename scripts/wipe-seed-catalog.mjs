// Wipe every synthetic catalog deal — defined as any library_deals row with
// no uploaded audio (`song_file_path IS NULL`). Seed data is always null-file;
// a real submission always has a file_path. So this filter is safe.
// Cascades delete: library_room_songs, library_shortlist_songs, library_pitches, audio_analysis.
//
// Usage:
//   node scripts/wipe-seed-catalog.mjs              # dry-run
//   node scripts/wipe-seed-catalog.mjs --confirm    # actually deletes

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf-8").split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]; }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const confirm = process.argv.includes("--confirm");

const { data: allDeals, error } = await admin
  .from("library_deals")
  .select("id, song_title, artist_name, song_file_path");
if (error) { console.error("ERR deals:", error.message); process.exit(1); }

const toDelete = (allDeals ?? []).filter((d) => d.song_file_path == null);
const keep = (allDeals ?? []).filter((d) => d.song_file_path != null);

console.log(`library_deals: ${allDeals?.length ?? 0} total · ${toDelete.length} to wipe (null file_path) · ${keep.length} to keep (has file)`);
for (const d of toDelete) console.log(`  - ${d.artist_name} — ${d.song_title} (${d.id})`);
if (keep.length) {
  console.log(`\nKeeping (real tracks):`);
  for (const d of keep) console.log(`  · ${d.artist_name} — ${d.song_title}`);
}

const { data: subs } = await admin
  .from("library_submissions")
  .select("id, song_title, artist_name, song_file_path");
const subsToDelete = (subs ?? []).filter((s) => s.song_file_path == null);
console.log(`\nlibrary_submissions: ${subs?.length ?? 0} total · ${subsToDelete.length} to wipe (null file_path)`);
for (const s of subsToDelete) console.log(`  - ${s.artist_name} — ${s.song_title} (${s.id})`);

if (!confirm) {
  console.log("\nDry-run. Pass --confirm to actually delete.");
  process.exit(0);
}

if (toDelete.length) {
  const { error: delErr, count } = await admin
    .from("library_deals")
    .delete({ count: "exact" })
    .in("id", toDelete.map((d) => d.id));
  if (delErr) { console.error("ERR delete deals:", delErr.message); process.exit(1); }
  console.log(`\nDeleted ${count} library_deals (cascades applied).`);
}
if (subsToDelete.length) {
  const { error: delErr, count } = await admin
    .from("library_submissions")
    .delete({ count: "exact" })
    .in("id", subsToDelete.map((s) => s.id));
  if (delErr) { console.error("ERR delete subs:", delErr.message); process.exit(1); }
  console.log(`Deleted ${count} library_submissions.`);
}
if (!toDelete.length && !subsToDelete.length) console.log("\nNothing to delete.");
