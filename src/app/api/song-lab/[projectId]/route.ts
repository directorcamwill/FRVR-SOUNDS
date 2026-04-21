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

  const { data: project, error } = await supabase
    .from("song_lab_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(project);
}

export async function PATCH(
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

  const body = await request.json();
  const updateFields: Record<string, unknown> = {};
  const allowed = [
    "title",
    "status",
    "bpm",
    "key",
    "genre",
    "mood",
    "lyrics",
    "notes",
    "structure",
    "reference_tracks",
    "checklist",
    "writing_ideas",
    "producer_ideas",
    "metaphors",
    "brand_connection",
    "project_mode",
    "placement_intent",
    "album_context",
  ];
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateFields[k] = v;
  }

  const { data: project, error } = await supabase
    .from("song_lab_projects")
    .update(updateFields)
    .eq("id", projectId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(project);
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
    .delete()
    .eq("id", projectId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
