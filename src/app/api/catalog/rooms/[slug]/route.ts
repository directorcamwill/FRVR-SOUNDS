import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Public — fetch a single room + its assigned catalog songs with signed audio URLs.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: room, error } = await admin
    .from("library_rooms")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: assignments } = await admin
    .from("library_room_songs")
    .select("deal_id, sort_order")
    .eq("room_id", room.id)
    .order("sort_order", { ascending: true });

  const dealIds = (assignments ?? []).map((a) => a.deal_id);
  let songs: unknown[] = [];
  if (dealIds.length > 0) {
    const { data: deals } = await admin
      .from("library_deals")
      .select(
        "id, song_title, artist_name, genre, sub_genre, moods, bpm, key, vocal_type, is_one_stop, song_file_path, deal_type",
      )
      .in("id", dealIds)
      .eq("status", "active");

    const signedByPath = new Map<string, string>();
    for (const d of deals ?? []) {
      if (d.song_file_path && !signedByPath.has(d.song_file_path)) {
        const { data: signed } = await admin.storage
          .from("audio-files")
          .createSignedUrl(d.song_file_path, 60 * 60 * 2);
        if (signed?.signedUrl) signedByPath.set(d.song_file_path, signed.signedUrl);
      }
    }

    const orderMap = new Map<string, number>();
    for (const a of assignments ?? []) orderMap.set(a.deal_id, a.sort_order);

    songs = (deals ?? [])
      .map((d) => ({
        ...d,
        signed_audio_url: d.song_file_path ? signedByPath.get(d.song_file_path) ?? null : null,
        sort_order: orderMap.get(d.id) ?? 999,
      }))
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number));
  }

  return NextResponse.json({ room, songs });
}
