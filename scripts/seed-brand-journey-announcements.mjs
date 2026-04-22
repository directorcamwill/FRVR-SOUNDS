// Seed the 2 Brand Journey launch announcements.
// Run with: `node scripts/seed-brand-journey-announcements.mjs`
// Idempotent via upsert on a generated unique title.

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

const BRAND_JOURNEY_ANNOUNCEMENTS = [
  {
    title: "The Brand Journey is open",
    body: "Seven modules — Identity, Emotional Signature, Positioning, Audience, Visual DNA, Sound DNA, Routes. Your Brand Wiki writes itself as you go, and every agent reads from it.",
    severity: "feature",
    target_plan_ids: [], // visible to all
    cta_label: "Start the Journey",
    cta_url: "/brand",
    dismissible: true,
  },
  {
    title: "Sharpen every answer with Director's Notes",
    body: "Pro Catalog unlocks Director's Notes — a cinematic second pass on every Brand Journey answer, grounded in your Brand Wiki. Never a generic rewrite.",
    severity: "feature",
    target_plan_ids: ["starter"], // Starter-only upsell
    cta_label: "See Pro Catalog",
    cta_url: "/pricing",
    dismissible: true,
  },
];

// Check for existing announcements with the same titles, skip if already present
const { data: existing } = await supabase
  .from("announcements")
  .select("id, title")
  .in(
    "title",
    BRAND_JOURNEY_ANNOUNCEMENTS.map((a) => a.title),
  );

const existingTitles = new Set((existing ?? []).map((a) => a.title));
const toInsert = BRAND_JOURNEY_ANNOUNCEMENTS.filter(
  (a) => !existingTitles.has(a.title),
);

if (toInsert.length === 0) {
  console.log("All Brand Journey announcements already seeded. No-op.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("announcements")
  .insert(toInsert)
  .select();

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} announcement(s):`);
for (const a of data) {
  console.log(
    `  · "${a.title}" — target: ${a.target_plan_ids.length === 0 ? "all plans" : a.target_plan_ids.join(", ")}`,
  );
}
