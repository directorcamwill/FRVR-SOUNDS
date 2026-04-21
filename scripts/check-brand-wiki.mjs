// Check whether brand_wiki table exists on whatever DB .env.local points at.
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { error } = await supabase.from("brand_wiki").select("artist_id").limit(1);
if (error) {
  console.log(`brand_wiki NOT ready on ${env.NEXT_PUBLIC_SUPABASE_URL}: ${error.message}`);
  process.exit(1);
} else {
  console.log(`brand_wiki OK on ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  process.exit(0);
}
