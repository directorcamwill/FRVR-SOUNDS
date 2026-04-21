// Check 00014 applied: content_moments should have source_agent + batch_id columns.
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
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const cols = [
  "source_agent",
  "source_moment_type",
  "source_song_id",
  "source_opportunity_id",
  "confidence",
  "reasoning",
  "hashtags",
  "hook_ideas",
  "batch_id",
];

let pass = 0;
let fail = 0;
for (const c of cols) {
  const { error } = await supabase.from("content_moments").select(c).limit(1);
  if (error) {
    console.log(`FAIL content_moments.${c} — ${error.message}`);
    fail += 1;
  } else {
    pass += 1;
  }
}
console.log(`\n${pass}/${cols.length} columns present, ${fail} missing.`);
process.exit(fail > 0 ? 1 : 0);
