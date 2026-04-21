import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { computeBrandCompleteness } from "@/lib/agents/brand-director";
import type { BrandWiki } from "@/types/brand";

/**
 * /api/brand-wiki — CRUD for the signed-in artist's brand wiki row.
 * GET returns the wiki (auto-creates an empty row if missing).
 * PUT patches fields; recomputes completeness_pct on every write.
 */

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id, artist_name")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const { data: wiki, error } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (wiki) {
    return NextResponse.json({ wiki, artist_name: artist.artist_name });
  }

  // Bootstrap empty wiki row so later PUTs just UPDATE.
  const admin = createAdminClient();
  const { data: created, error: insertErr } = await admin
    .from("brand_wiki")
    .insert({ artist_id: artist.id })
    .select()
    .single();
  if (insertErr)
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  return NextResponse.json({ wiki: created, artist_name: artist.artist_name });
}

// Fields we accept via PUT. Everything else silently dropped — keeps schema clean.
const WRITABLE_FIELDS: Array<keyof BrandWiki> = [
  "niche",
  "elevator_pitch",
  "origin_story",
  "bio_short",
  "bio_medium",
  "bio_long",
  "primary_audience",
  "secondary_audience",
  "audience_pain_points",
  "tone_descriptors",
  "voice_dos",
  "voice_donts",
  "core_messaging",
  "color_primary",
  "color_secondary",
  "color_accent",
  "font_heading",
  "font_body",
  "texture_keywords",
  "logo_url",
  "icon_url",
  "press_photo_urls",
  "sonic_genre_primary",
  "sonic_genre_secondary",
  "sonic_moods",
  "sonic_bpm_min",
  "sonic_bpm_max",
  "sonic_key_preferences",
  "sonic_texture_keywords",
  "reference_tracks",
  "mix_preferences",
  "sync_format_targets",
  "sync_library_targets",
  "avoid_sync_formats",
];

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const f of WRITABLE_FIELDS) {
    if (f in body) update[f] = body[f];
  }

  // Merge in the current wiki to compute completeness from the full post-write
  // state (not just the patch).
  const { data: current } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const merged = { ...(current ?? {}), ...update } as Partial<BrandWiki>;
  const { pct } = computeBrandCompleteness(merged);
  update.completeness_pct = pct;

  const admin = createAdminClient();
  const { data: saved, error } = await admin
    .from("brand_wiki")
    .upsert({ artist_id: artist.id, ...update }, { onConflict: "artist_id" })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ wiki: saved });
}
