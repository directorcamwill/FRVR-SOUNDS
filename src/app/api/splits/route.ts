import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

  const { data: splits, error } = await supabase
    .from("song_splits")
    .select(`
      *,
      split_participants(*),
      songs(title, status)
    `)
    .in(
      "song_id",
      (
        await supabase
          .from("songs")
          .select("id")
          .eq("artist_id", artist.id)
      ).data?.map((s) => s.id) || []
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(splits);
}

export async function POST(request: Request) {
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

  // Verify song belongs to artist
  const { data: song } = await supabase
    .from("songs")
    .select("id")
    .eq("id", body.song_id)
    .eq("artist_id", artist.id)
    .single();
  if (!song)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  const { data: split, error } = await supabase
    .from("song_splits")
    .insert({
      song_id: body.song_id,
      notes: body.notes || null,
    })
    .select(`*, split_participants(*)`)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(split);
}
