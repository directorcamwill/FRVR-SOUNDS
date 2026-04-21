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
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
    })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const cols = ["producer_guidance","producer_guidance_at","songwriter_guidance","songwriter_guidance_at","collab_suggestions","collab_suggestions_at"];
let pass=0, fail=0;
for (const c of cols) {
  const { error } = await s.from("song_lab_projects").select(c).limit(1);
  if (error) { console.log(`FAIL ${c}: ${error.message}`); fail++; } else pass++;
}
console.log(`${pass}/${cols.length} columns present`);
process.exit(fail > 0 ? 1 : 0);
