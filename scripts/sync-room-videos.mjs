#!/usr/bin/env node
// Scans public/catalog/rooms/*.mp4 and points library_rooms.hero_video_url
// at whatever it finds, matching file basename to room slug.
//
// Usage: node scripts/sync-room-videos.mjs [--dry]
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (loaded from
// .env.local automatically).

import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DRY = process.argv.includes("--dry");
const HERE = fileURLToPath(new URL(".", import.meta.url));
const VIDEO_DIR = join(HERE, "..", "public", "catalog", "rooms");

let files = [];
try {
  files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".mp4"));
} catch {
  console.error(`No videos found at ${VIDEO_DIR}`);
  process.exit(1);
}
if (files.length === 0) {
  console.log(`No .mp4 files in ${VIDEO_DIR}. Drop them in (e.g. lodge.mp4) and rerun.`);
  process.exit(0);
}

const admin = createClient(url, key);
const { data: rooms, error } = await admin
  .from("library_rooms")
  .select("id, slug, name, hero_video_url");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const bySlug = new Map((rooms ?? []).map((r) => [r.slug, r]));

let updated = 0;
let skipped = 0;
let missing = 0;
for (const f of files) {
  const slug = f.replace(/\.mp4$/i, "");
  const room = bySlug.get(slug);
  if (!room) {
    console.log(`- ${f}: no matching room slug. skipping.`);
    missing++;
    continue;
  }
  const target = `/catalog/rooms/${f}`;
  if (room.hero_video_url === target) {
    console.log(`- ${room.name}: already set to ${target}. skipping.`);
    skipped++;
    continue;
  }
  const size = statSync(join(VIDEO_DIR, f)).size;
  const mb = (size / 1024 / 1024).toFixed(1);
  if (DRY) {
    console.log(`- ${room.name}: would set hero_video_url → ${target} (${mb}MB)`);
    updated++;
    continue;
  }
  const { error: uerr } = await admin
    .from("library_rooms")
    .update({ hero_video_url: target })
    .eq("id", room.id);
  if (uerr) {
    console.log(`- ${room.name}: update failed — ${uerr.message}`);
    continue;
  }
  console.log(`✓ ${room.name}: hero_video_url → ${target} (${mb}MB)`);
  updated++;
}

console.log("");
console.log(`Done. ${updated} updated · ${skipped} already set · ${missing} unmatched`);
if (DRY) console.log("(dry run — no writes performed)");
