// One-shot: populate the user's brand_wiki with an example identity so the
// downstream agents (Content Director, etc.) can be exercised immediately.
// Edit any field through the /brand UI after seeing it.
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

// Find the sole artist on this dev DB (single-user assumption for seeding).
const { data: artists, error: artistsErr } = await supabase
  .from("artists")
  .select("id, artist_name")
  .limit(1);
if (artistsErr) {
  console.error("artists fetch failed:", artistsErr.message);
  process.exit(1);
}
if (!artists || artists.length === 0) {
  console.error("No artist found. Finish onboarding in /onboarding first.");
  process.exit(1);
}
const artist = artists[0];
const artistId = artist.id;
const artistName = artist.artist_name ?? "the artist";

const EXAMPLE = {
  artist_id: artistId,

  // Identity
  niche: "Dark cinematic R&B for prestige TV + indie film",
  elevator_pitch:
    "I make the sound of 2 a.m. in a half-empty hotel bar — moody, slow-burning R&B built for prestige dramas and indie films that want emotional weight without cliché.",
  origin_story:
    "Grew up on Sade, Portishead, and late Miles Davis. Started producing in college bedrooms with a Tascam interface and a stack of vinyl, chasing the feeling of an unanswered voicemail. Released the first EP independently in 2022 after three years of private demos. The catalog has been building quietly since, with a focus on placements over playlists — every track is written with picture in mind.",
  bio_short:
    "Dark cinematic R&B for prestige TV and indie film. Based in Atlanta. Available one-stop for sync.",
  bio_medium:
    "Dark cinematic R&B for prestige TV and indie film. Warm tape, sub-heavy bass, measured vocals — the sound of 2 a.m. in a half-empty hotel bar. Based in Atlanta. Available one-stop for sync across TV, film, trailers, and premium ads.",
  bio_long:
    "Building quietly since 2022, this project sits at the intersection of late-night R&B and modern score — Sade's restraint meeting Portishead's space, filtered through a tape saturation workflow and a writer who thinks in scenes. Every track is written with picture in mind, and the catalog is fully one-stop for sync. Placements so far have skewed toward indie drama and documentary. Based in Atlanta. Represented by no one — direct contact available for music supervisors.",

  // Audience
  primary_audience:
    "Indie film and prestige-TV music supervisors, 30–45, who want tracks with emotional weight and clean edit points",
  secondary_audience:
    "Streaming-era R&B listeners 25–40 who follow taste-maker playlists and artist-run Patreons",
  audience_pain_points: [
    "budgets shrinking faster than needs",
    "AI-generated library saturation making real voices valuable again",
    "too few one-stop tracks at the intersection of R&B and cinematic",
    "supervisors can't find dialogue-safe R&B with genuine dynamic range",
  ],

  // Tone + voice
  tone_descriptors: ["cinematic", "measured", "confident", "dark", "intimate"],
  voice_dos: [
    "let lines breathe",
    "reference real placements and scenes",
    "use concrete imagery (rooms, weather, time of day)",
    "lead with craft, not hype",
    "name the collaborators who matter",
  ],
  voice_donts: [
    "exclamation points",
    "generic 'vibes' language",
    "hustle-culture hashtags",
    "AI-inflected adjectives (game-changing, next-level)",
    "emoji in every line",
  ],
  core_messaging:
    "Music as scene-writing. Every track is built to live with picture. No filler, no overproduction — just the right temperature for the moment supervisors are trying to score.",

  // Visual
  color_primary: "#0A0A0A",
  color_secondary: "#DC2626",
  color_accent: "#C0C8D8",
  font_heading: "Inter",
  font_body: "Inter",
  texture_keywords: ["film grain", "warm tape", "chrome on black", "dark gloss", "low-light"],
  logo_url: null,
  icon_url: null,
  press_photo_urls: [],

  // Sonic
  sonic_genre_primary: "Dark R&B",
  sonic_genre_secondary: "Cinematic / ambient soul",
  sonic_moods: ["tense", "moody", "late-night", "cinematic", "yearning", "restrained"],
  sonic_bpm_min: 72,
  sonic_bpm_max: 96,
  sonic_key_preferences: ["C minor", "F# minor", "A minor", "E minor"],
  sonic_texture_keywords: [
    "warm tape saturation",
    "sub-bass heavy",
    "airy reverb",
    "close-mic'd vocal",
    "sparse drums",
    "analog keys",
  ],
  reference_tracks: [
    {
      artist: "Sade",
      title: "By Your Side",
      why: "Restraint + intimacy — the blueprint for vocal weight without force.",
    },
    {
      artist: "Portishead",
      title: "Glory Box",
      why: "Cinematic space + tape saturation. Dialogue-safe dynamic range.",
    },
    {
      artist: "FKA Twigs",
      title: "Two Weeks",
      why: "Modern production inside a slow-burn arrangement.",
    },
    {
      artist: "The Weeknd",
      title: "Wicked Games",
      why: "Late-night register, picture-ready tempo (~85 BPM).",
    },
  ],

  // Mix prefs
  mix_preferences: {
    lufs_target: -14,
    true_peak_target: -1,
    stereo_width: "balanced",
    vocal_character: "close, warm, minimal compression",
    compression_style: "light",
  },

  // Sync positioning
  sync_format_targets: ["tv_episode", "film", "trailer", "library"],
  sync_library_targets: [
    "Heavy Hitters",
    "Audiio",
    "Musicbed",
    "APM",
    "Extreme Music",
  ],
  avoid_sync_formats: ["game"],
};

const { data, error } = await supabase
  .from("brand_wiki")
  .upsert(EXAMPLE, { onConflict: "artist_id" })
  .select()
  .single();

if (error) {
  console.error("upsert failed:", error.message);
  process.exit(1);
}

console.log(`Seeded brand_wiki for ${artistName}.`);
console.log(`Completeness: ${data.completeness_pct}%`);
console.log("\nReload /brand in your browser to see the populated tabs.");
