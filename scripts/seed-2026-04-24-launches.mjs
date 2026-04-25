// Seed the 4 launch announcements for the 2026-04-24 ship train:
//   A. Brand Wiki Rewards (3 new tools) — Studio-tier
//   B. Content + Sync Loop — Pro + Studio
//   C. Weekly digest automation — all paying tiers
//   D. BPM + key detection in the catalog analyzer — all signed-in users
//
// Idempotent: skips rows with the same title that already exist.
// Run with: node scripts/seed-2026-04-24-launches.mjs

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(path.resolve(".env.local"), "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l.slice(i + 1).trim().replace(/^['"]|['"]$/g, ""),
      ];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const ANNOUNCEMENTS = [
  {
    title: "Three new Brand Wiki tools just unlocked",
    body: "Your finished Wiki now writes your social profile, your photo art direction, and a tiered offer stack — each grounded in the modules you completed. Open the Rewards card on the Brand page to run them.",
    severity: "feature",
    target_plan_ids: ["studio", "internal"],
    cta_label: "Open the Rewards",
    cta_url: "/brand",
    dismissible: true,
  },
  {
    title: "One-click release on every sync-ready song",
    body: "When Package Builder turns a song green, the new Content + Sync Loop fans it out: release-day captions across IG · TikTok · X · email, plus a release plan pinned to the song. Look for the new card in the song's vault sidebar.",
    severity: "feature",
    target_plan_ids: ["pro", "studio"],
    cta_label: "Open Vault",
    cta_url: "/vault",
    dismissible: true,
  },
  {
    title: "Weekly digest emails are live",
    body: "Open Settings → Automations and toggle the weekly digest on. Every Monday morning your inbox gets a short read on the past 7 days — new songs, library submissions, deals accepted, and what your studio team did for you.",
    severity: "feature",
    target_plan_ids: [], // visible to all signed-in users
    cta_label: "Open Settings",
    cta_url: "/settings",
    dismissible: true,
  },
  {
    title: "Every catalog song now ships BPM + key",
    body: "The audio analyzer just learned tempo and musical key. Tracks that weren't manually tagged now show the detected values automatically — supervisors searching by BPM finally see real numbers.",
    severity: "info",
    target_plan_ids: [], // visible to all signed-in users
    cta_label: "See the Catalog",
    cta_url: "/catalog",
    dismissible: true,
  },
];

const { data: existing } = await supabase
  .from("announcements")
  .select("id, title")
  .in("title", ANNOUNCEMENTS.map((a) => a.title));

const existingTitles = new Set((existing ?? []).map((a) => a.title));
const toInsert = ANNOUNCEMENTS.filter((a) => !existingTitles.has(a.title));

if (toInsert.length === 0) {
  console.log("All 4 launch announcements already exist. Skipping.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("announcements")
  .insert(toInsert)
  .select("id, title");

if (error) {
  console.error("Failed to insert:", error.message);
  process.exit(1);
}

console.log(`Inserted ${data.length} announcement${data.length === 1 ? "" : "s"}:`);
for (const row of data) console.log(`  ✓ ${row.title}`);
console.log(`\nSkipped (already present): ${existingTitles.size}`);
