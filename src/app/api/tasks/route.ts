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
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let query = supabase
    .from("daily_tasks")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  if (date) query = query.eq("due_date", date);
  if (status) query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("category", category);

  const { data: tasks, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(tasks);
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
  const { data: task, error } = await supabase
    .from("daily_tasks")
    .insert({
      artist_id: artist.id,
      title: body.title,
      description: body.description || null,
      category: body.category || "general",
      priority: body.priority || "medium",
      due_date: body.due_date || new Date().toISOString().split("T")[0],
      recurring: body.recurring || false,
      recurrence_pattern: body.recurrence_pattern || null,
      notes: body.notes || null,
      time_block: body.time_block || "anytime",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(task);
}
