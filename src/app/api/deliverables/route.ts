import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_DELIVERABLES = [
  {
    category: "music_production",
    title: "Sync-Ready Tracks",
    description: "Produce 15 fully mixed, mastered, sync-ready tracks",
    target_count: 15,
    current_count: 0,
    priority: "critical",
  },
  {
    category: "sync_submissions",
    title: "Sync Submissions",
    description: "Submit tracks to 100 sync opportunities",
    target_count: 100,
    current_count: 0,
    priority: "high",
  },
  {
    category: "content",
    title: "Content Created",
    description: "Create 50 pieces of content across platforms",
    target_count: 50,
    current_count: 0,
    priority: "high",
  },
  {
    category: "brand_assets",
    title: "Brand Assets",
    description: "Logo, EPK, one-sheet, website, social kit, press photos",
    target_count: 6,
    current_count: 0,
    priority: "medium",
  },
  {
    category: "growth_systems",
    title: "Growth Systems",
    description:
      "Email list, social strategy, sync pipeline, content calendar, revenue tracking",
    target_count: 5,
    current_count: 0,
    priority: "medium",
  },
];

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
  const summary = searchParams.get("summary");

  // Check for existing deliverables
  let { data: deliverables, error } = await supabase
    .from("deliverables")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create defaults if empty
  if (!deliverables || deliverables.length === 0) {
    const inserts = DEFAULT_DELIVERABLES.map((d) => ({
      ...d,
      artist_id: artist.id,
    }));
    const { data: created, error: insertError } = await supabase
      .from("deliverables")
      .insert(inserts)
      .select();
    if (insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    deliverables = created;
  }

  if (summary === "true") {
    const total = deliverables!.length;
    const completed = deliverables!.filter(
      (d) => d.status === "completed"
    ).length;
    const totalProgress = deliverables!.reduce((acc, d) => {
      const pct =
        d.target_count > 0
          ? Math.min(100, Math.round((d.current_count / d.target_count) * 100))
          : 0;
      return acc + pct;
    }, 0);
    const overallPct = total > 0 ? Math.round(totalProgress / total) : 0;
    return NextResponse.json({
      total,
      completed,
      overall_percentage: overallPct,
      deliverables,
    });
  }

  return NextResponse.json(deliverables);
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
  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .insert({
      artist_id: artist.id,
      category: body.category,
      title: body.title,
      description: body.description || null,
      target_count: body.target_count || 1,
      target_date: body.target_date || null,
      priority: body.priority || "medium",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(deliverable);
}
