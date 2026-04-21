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

  const { data: rooms } = await admin
    .from("library_room_songs")
    .select("library_rooms(slug, name, accent_color)")
    .eq("deal_id", id);

  const inRooms =
    (rooms ?? [])
      .flatMap((r) => (r as { library_rooms: unknown }).library_rooms)
      .filter(Boolean) as Array<{ slug: string; name: string; accent_color: string | null }>;

  return NextResponse.json({
    song: { ...deal, signed_audio_url, rooms: inRooms },
  });
}
