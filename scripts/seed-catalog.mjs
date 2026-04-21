// Seed 20 synthetic signed deals across the 10 Northwoods rooms so the
// public Catalog has content to display. Each deal is assigned to 1-3 rooms
// based on the mood/genre mapping below. No audio files — just metadata.
// Run with: node scripts/seed-catalog.mjs

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

// 20 synthetic tracks, each with which room slugs they belong in.
const TRACKS = [
  {
    song_title: "Slow Burn at 2 A.M.",
    artist_name: "Luma Vance",
    genre: "R&B",
    sub_genre: "Alt R&B",
    moods: ["intimate", "melancholic", "warm"],
    bpm: 72, key: "Am", vocal_type: "female lead", is_one_stop: true,
    rooms: ["the-lodge", "the-bar"],
  },
  {
    song_title: "Pale Blue Hour",
    artist_name: "Oris Gray",
    genre: "R&B", sub_genre: "Bedroom Soul",
    moods: ["intimate", "nostalgic"],
    bpm: 68, key: "Fm", vocal_type: "male lead", is_one_stop: true,
    rooms: ["the-lodge"],
  },
  {
    song_title: "Understory",
    artist_name: "Mara Saint",
    genre: "Hip-Hop", sub_genre: "Lo-Fi",
    moods: ["dark", "melancholic", "nostalgic"],
    bpm: 82, key: "Cm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-cellar"],
  },
  {
    song_title: "Dust & Bass",
    artist_name: "The Kiln",
    genre: "Hip-Hop", sub_genre: "Boom Bap",
    moods: ["driving", "dark"],
    bpm: 88, key: "Dm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-cellar", "the-garage"],
  },
  {
    song_title: "Nocturne in Firelight",
    artist_name: "Hollow Bell Ensemble",
    genre: "Orchestral", sub_genre: "Cinematic",
    moods: ["hopeful", "cinematic", "warm"],
    bpm: 64, key: "Bbm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-hall", "the-screening-room"],
  },
  {
    song_title: "The Long Ascent",
    artist_name: "Verdant Choir",
    genre: "Orchestral", sub_genre: "Trailer Build",
    moods: ["uplifting", "cinematic", "tense"],
    bpm: 80, key: "Em", vocal_type: "choir", is_one_stop: false,
    rooms: ["the-hall"],
  },
  {
    song_title: "Neon Radius",
    artist_name: "Axis 89",
    genre: "Electronic", sub_genre: "Synthwave",
    moods: ["driving", "cinematic"],
    bpm: 118, key: "Gm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-garage"],
  },
  {
    song_title: "Arc at Dusk",
    artist_name: "Porsche '83",
    genre: "Electronic", sub_genre: "Retrowave",
    moods: ["driving", "warm", "nostalgic"],
    bpm: 108, key: "Am", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-garage", "the-drive"],
  },
  {
    song_title: "Slow Gin, Tall Window",
    artist_name: "Beau Ellison",
    genre: "Jazz", sub_genre: "Soul Jazz",
    moods: ["intimate", "warm", "nostalgic"],
    bpm: 74, key: "Cm", vocal_type: "male lead", is_one_stop: true,
    rooms: ["the-bar"],
  },
  {
    song_title: "Last Call",
    artist_name: "Cleo Hartman Trio",
    genre: "Jazz", sub_genre: "Classic",
    moods: ["romantic", "warm"],
    bpm: 92, key: "Eb", vocal_type: "female lead", is_one_stop: false,
    rooms: ["the-bar", "the-lodge"],
  },
  {
    song_title: "Banker's Lamp",
    artist_name: "Adler Quin",
    genre: "Noir", sub_genre: "Detective Score",
    moods: ["tense", "dark", "cinematic"],
    bpm: 76, key: "Fm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-study"],
  },
  {
    song_title: "The Letter He Didn't Send",
    artist_name: "Adler Quin",
    genre: "Noir", sub_genre: "Chamber",
    moods: ["melancholic", "tense"],
    bpm: 60, key: "Dm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-study", "the-screening-room"],
  },
  {
    song_title: "Silver Screen Overture",
    artist_name: "Hollow Bell Ensemble",
    genre: "Score", sub_genre: "Cinematic",
    moods: ["cinematic", "nostalgic"],
    bpm: 84, key: "Bbm", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-screening-room", "the-hall"],
  },
  {
    song_title: "Found on a B-Side",
    artist_name: "Cassie True",
    genre: "Indie", sub_genre: "Dream Pop",
    moods: ["nostalgic", "intimate", "warm"],
    bpm: 96, key: "G", vocal_type: "female lead", is_one_stop: true,
    rooms: ["the-library", "the-lodge"],
  },
  {
    song_title: "An Unreleased Thing",
    artist_name: "Peregrine Rowe",
    genre: "Folk", sub_genre: "Contemporary",
    moods: ["hopeful", "warm"],
    bpm: 110, key: "D", vocal_type: "male lead", is_one_stop: true,
    rooms: ["the-library"],
  },
  {
    song_title: "The First Light",
    artist_name: "Weatherwood",
    genre: "Ambient", sub_genre: "Pastoral",
    moods: ["hopeful", "warm", "cinematic"],
    bpm: 70, key: "C", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-overlook"],
  },
  {
    song_title: "Morning Record",
    artist_name: "Kestrel Way",
    genre: "Folk", sub_genre: "Acoustic",
    moods: ["warm", "intimate"],
    bpm: 88, key: "G", vocal_type: "female lead", is_one_stop: false,
    rooms: ["the-overlook", "the-library"],
  },
  {
    song_title: "Silver on Water",
    artist_name: "Weatherwood",
    genre: "Ambient", sub_genre: "Drone",
    moods: ["cinematic", "nostalgic"],
    bpm: 58, key: "Em", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-stargazer"],
  },
  {
    song_title: "Last Sustain",
    artist_name: "Nocturn Field",
    genre: "Ambient", sub_genre: "Post-Rock",
    moods: ["melancholic", "cinematic"],
    bpm: 66, key: "Am", vocal_type: "instrumental", is_one_stop: true,
    rooms: ["the-stargazer", "the-screening-room"],
  },
  {
    song_title: "Closing Hour",
    artist_name: "The Bluriver",
    genre: "R&B", sub_genre: "Dark Cinematic",
    moods: ["intimate", "cinematic", "dark"],
    bpm: 72, key: "Bbm", vocal_type: "male lead", is_one_stop: true,
    rooms: ["the-lodge", "the-bar", "the-study"],
  },
];

async function main() {
  console.log(`→ fetching rooms…`);
  const { data: rooms, error: roomsErr } = await supabase
    .from("library_rooms")
    .select("id, slug");
  if (roomsErr) throw roomsErr;
  const roomBySlug = new Map(rooms.map((r) => [r.slug, r.id]));
  console.log(`✓ ${rooms.length} rooms found`);

  console.log(`→ checking existing catalog…`);
  const { data: existing } = await supabase
    .from("library_deals")
    .select("id, song_title, artist_name");
  const existingKeys = new Set(
    (existing ?? []).map((d) => `${d.song_title}::${d.artist_name}`),
  );
  console.log(`  ${existing?.length ?? 0} existing deals`);

  let created = 0;
  let skipped = 0;
  for (const t of TRACKS) {
    const key = `${t.song_title}::${t.artist_name}`;
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const { rooms: slugs, ...rest } = t;
    const isRev = rest.is_one_stop;
    const { data: deal, error: dealErr } = await supabase
      .from("library_deals")
      .insert({
        ...rest,
        deal_type: isRev ? "rev_share" : "upfront_fee",
        artist_split_pct: isRev ? 60 : 80,
        frvr_split_pct: isRev ? 40 : 20,
        upfront_fee_cents: isRev ? null : 9900,
        upfront_fee_status: isRev ? "not_applicable" : "paid",
        term_months: isRev ? 24 : 12,
        status: "active",
        signed_at: new Date().toISOString(),
        starts_at: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (dealErr) {
      console.log(`  ✗ ${t.song_title}: ${dealErr.message}`);
      continue;
    }

    const roomRows = slugs
      .map((s, i) => ({
        room_id: roomBySlug.get(s),
        deal_id: deal.id,
        sort_order: i * 10,
      }))
      .filter((r) => r.room_id);
    if (roomRows.length > 0) {
      await supabase.from("library_room_songs").insert(roomRows);
    }

    created += 1;
    console.log(`  ✓ ${t.song_title} — ${t.artist_name} → ${slugs.join(", ")}`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
