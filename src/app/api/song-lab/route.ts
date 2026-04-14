import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("song_lab_projects")
    .select("*")
    .eq("artist_id", artist.id)
    .order("updated_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data: projects, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(projects);
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
  const { data: project, error } = await supabase
    .from("song_lab_projects")
    .insert({
      artist_id: artist.id,
      title: body.title || "Untitled Project",
      status: body.status || "idea",
      bpm: body.bpm || null,
      key: body.key || null,
      genre: body.genre || null,
      mood: body.mood || null,
      lyrics: body.lyrics || null,
      notes: body.notes || null,
      structure: body.structure || null,
      reference_tracks: body.reference_tracks || [],
      checklist: body.checklist || [],
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(project);
}
