import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: deal, error } = await admin
    .from("library_deals")
    .select(
      "id, song_title, artist_name, genre, sub_genre, moods, bpm, key, vocal_type, is_one_stop, song_file_path, deal_type, status",
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !deal) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let signed_audio_url: string | null = null;
  if (deal.song_file_path) {
    const { data: signed } = await admin.storage
      .from("audio-files")
      .createSignedUrl(deal.song_file_path, 60 * 60 * 2);
    signed_audio_url = signed?.signedUrl ?? null;
  }

  const { data: analysisRow } = await admin
    .from("audio_analysis")
    .select(
      "waveform_peaks, duration_sec, lufs_integrated, true_peak_db, dynamic_range, detected_bpm, detected_bpm_confidence, detected_key, detected_key_confidence, analyzer_version",
    )
    .eq("deal_id", id)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: rooms } = await admin
    .from("library_room_songs")
    .select("room_id, library_rooms(slug, name, accent_color)")
    .eq("deal_id", id);

  const inRooms =
    (rooms ?? [])
      .flatMap((r) => (r as { library_rooms: unknown }).library_rooms)
      .filter(Boolean) as Array<{ slug: string; name: string; accent_color: string | null }>;

  // Similar tracks — other songs in the same rooms, max 6, excluding this deal.
  const roomIds = (rooms ?? []).map((r) => (r as { room_id: string }).room_id);
  let similar: unknown[] = [];
  if (roomIds.length > 0) {
    const { data: otherAssignments } = await admin
      .from("library_room_songs")
      .select("deal_id")
      .in("room_id", roomIds)
      .neq("deal_id", id)
      .limit(30);
    const otherIds = Array.from(
      new Set((otherAssignments ?? []).map((o) => o.deal_id)),
    ).slice(0, 6);
    if (otherIds.length > 0) {
      const { data: others } = await admin
        .from("library_deals")
        .select("id, song_title, artist_name, genre, bpm, key, is_one_stop")
        .in("id", otherIds)
        .eq("status", "active");
      similar = others ?? [];
    }
  }

  return NextResponse.json(
    {
      song: { ...deal, signed_audio_url, rooms: inRooms, analysis: analysisRow ?? null },
      similar,
    },
    {
      // Edge-cache the public song record for 30s. Signed audio URL is valid
      // for 2h, so a 30s edge cache still serves a URL with > 1h59m left.
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}
