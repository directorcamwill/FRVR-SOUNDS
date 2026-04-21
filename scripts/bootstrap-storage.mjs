// One-shot bootstrap: ensures the "audio-files" storage bucket exists
// and has the expected mime-type + size settings the upload routes assume.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(path.resolve(".env.local"), "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [
        l.slice(0, idx).trim(),
        l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, ""),
      ];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "audio-files";
const MIME_ALLOWED = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aiff",
  "audio/x-aiff",
  "audio/mp4",
  "audio/x-m4a",
  "application/zip",
  "application/octet-stream",
];
const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB (safe across plans)

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error("list buckets failed:", listErr.message);
  process.exit(1);
}

const existing = (buckets ?? []).find((b) => b.name === BUCKET);
if (existing) {
  const { error: upErr } = await supabase.storage.updateBucket(BUCKET, {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: MIME_ALLOWED,
  });
  if (upErr) {
    console.error("update bucket failed:", upErr.message);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" already existed — settings refreshed.`);
} else {
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: MIME_ALLOWED,
  });
  if (createErr) {
    console.error("create bucket failed:", createErr.message);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" created.`);
}

console.log("Storage bootstrap OK.");
