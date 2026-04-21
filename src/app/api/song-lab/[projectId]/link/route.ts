import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

  const { data: linkedRows } = await supabase
    .from("song_lab_projects")
    .select("song_id")
    .not("song_id", "is", null)
    .neq("id", projectId);
  const linkedIds = new Set(
    (linkedRows ?? []).map((r) => r.song_id).filter(Boolean) as string[]
  );

  const { data: songs, error } = await supabase
    .from("songs")
    .select("id, title, status, created_at, song_metadata(genre, moods, bpm, key)")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const linkable = (songs ?? []).filter((s) => !linkedIds.has(s.id));
  return NextResponse.json({ songs: linkable });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

  const body = await request.json().catch(() => ({}));
  const songId = body?.song_id as string | undefined;
  if (!songId)
    return NextResponse.json({ error: "song_id required" }, { status: 400 });

  const { data: project } = await supabase
    .from("song_lab_projects")
    .select("id, song_id")
    .eq("id", projectId)
    .single();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.song_id)
    return NextResponse.json(
      { error: "Project already linked to a vault song" },
      { status: 400 }
    );

  const { data: song } = await supabase
    .from("songs")
    .select("id, artist_id, title")
    .eq("id", songId)
    .single();
  if (!song || song.artist_id !== artist.id)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  const { data: existingLink } = await supabase
    .from("song_lab_projects")
    .select("id")
    .eq("song_id", songId)
    .maybeSingle();
  if (existingLink)
    return NextResponse.json(
      { error: "That song is already linked to another project" },
      { status: 409 }
    );

  const { data: updated, error } = await supabase
    .from("song_lab_projects")
    .update({ song_id: songId })
    .eq("id", projectId)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project: updated, song });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("song_lab_projects")
    .update({ song_id: null })
    .eq("id", projectId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
