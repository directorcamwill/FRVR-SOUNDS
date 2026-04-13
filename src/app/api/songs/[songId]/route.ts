import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: song, error } = await supabase
    .from("songs")
    .select(`*, song_metadata(*), sync_scores(*), stems(*)`)
    .eq("id", songId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(song);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Separate song fields from metadata fields
  const songFields: Record<string, unknown> = {};
  const metadataFields: Record<string, unknown> = {};

  const songKeys = [
    "title",
    "file_url",
    "file_name",
    "file_size_bytes",
    "duration_seconds",
    "status",
  ];
  const metaKeys = [
    "genre",
    "sub_genre",
    "moods",
    "tags",
    "bpm",
    "key",
    "tempo_feel",
    "energy_level",
    "lyrics",
    "lyrics_themes",
    "has_vocals",
    "vocal_gender",
    "language",
    "explicit_content",
    "one_stop",
    "instrumental_available",
    "similar_artists",
    "description",
  ];

  for (const [k, v] of Object.entries(body)) {
    if (songKeys.includes(k)) songFields[k] = v;
    else if (metaKeys.includes(k)) metadataFields[k] = v;
  }

  if (Object.keys(songFields).length > 0) {
    const { error } = await supabase
      .from("songs")
      .update(songFields)
      .eq("id", songId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Object.keys(metadataFields).length > 0) {
    const { error } = await supabase
      .from("song_metadata")
      .upsert({ song_id: songId, ...metadataFields }, { onConflict: "song_id" });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated song
  const { data: song } = await supabase
    .from("songs")
    .select(`*, song_metadata(*), sync_scores(*), stems(*)`)
    .eq("id", songId)
    .single();

  return NextResponse.json(song);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("songs").delete().eq("id", songId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
