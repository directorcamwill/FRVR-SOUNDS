import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public — filter the signed catalog. Supervisors on a brief deadline land here
// when the room browse isn't what they need. Returns deals with signed audio URLs.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const genre = url.searchParams.get("genre")?.trim() ?? "";
  const moods = (url.searchParams.get("moods") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bpmMin = Number(url.searchParams.get("bpm_min") ?? "") || 0;
  const bpmMax = Number(url.searchParams.get("bpm_max") ?? "") || 0;
  const vocal = url.searchParams.get("vocal")?.trim() ?? "";
  const oneStop = url.searchParams.get("one_stop") === "true";

  const admin = createAdminClient();
  let query = admin
    .from("library_deals")
    .select(
      "id, song_title, artist_name, genre, sub_genre, moods, bpm, key, vocal_type, is_one_stop, song_file_path, deal_type, created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`song_title.ilike.%${q}%,artist_name.ilike.%${q}%`);
  }
  if (genre) query = query.ilike("genre", `%${genre}%`);
  if (moods.length > 0) query = query.overlaps("moods", moods);
  if (bpmMin > 0) query = query.gte("bpm", bpmMin);
  if (bpmMax > 0) query = query.lte("bpm", bpmMax);
  if (vocal === "vocal") query = query.not("vocal_type", "ilike", "%instrumental%");
  if (vocal === "instrumental") query = query.ilike("vocal_type", "%instrumental%");
  if (oneStop) query = query.eq("is_one_stop", true);

  const { data: deals, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const signedByPath = new Map<string, string>();
  for (const d of deals ?? []) {
    if (d.song_file_path && !signedByPath.has(d.song_file_path)) {
      const { data: signed } = await admin.storage
        .from("audio-files")
        .createSignedUrl(d.song_file_path, 60 * 60 * 2);
      if (signed?.signedUrl) signedByPath.set(d.song_file_path, signed.signedUrl);
    }
  }

  const songs = (deals ?? []).map((d) => ({
    ...d,
    signed_audio_url: d.song_file_path ? signedByPath.get(d.song_file_path) ?? null : null,
  }));

  return NextResponse.json({ songs, count: songs.length });
}
