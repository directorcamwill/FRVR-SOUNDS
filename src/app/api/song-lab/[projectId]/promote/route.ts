import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  // Get the lab project
  const { data: project, error: projectError } = await supabase
    .from("song_lab_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.song_id)
    return NextResponse.json(
      { error: "Project already promoted to vault" },
      { status: 400 }
    );

  // Create song in vault
  const { data: song, error: songError } = await supabase
    .from("songs")
    .insert({
      artist_id: artist.id,
      title: project.title,
      status: "draft",
    })
    .select()
    .single();

  if (songError)
    return NextResponse.json({ error: songError.message }, { status: 500 });

  // Create metadata from lab project fields
  const metadataFields: Record<string, unknown> = { song_id: song.id };
  if (project.genre) metadataFields.genre = project.genre;
  if (project.mood) metadataFields.moods = [project.mood];
  if (project.bpm) metadataFields.bpm = project.bpm;
  if (project.key) metadataFields.key = project.key;
  if (project.lyrics) metadataFields.lyrics = project.lyrics;

  await supabase.from("song_metadata").insert(metadataFields);

  // Link song back to lab project
  await supabase
    .from("song_lab_projects")
    .update({ song_id: song.id })
    .eq("id", projectId);

  return NextResponse.json({ song, project_id: projectId });
}
