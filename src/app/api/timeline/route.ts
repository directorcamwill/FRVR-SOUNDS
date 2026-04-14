import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_PHASES = [
  {
    phase_number: 1,
    title: "Foundation",
    description: "Set up business, define brand, create first 3 tracks",
    start_month: 1,
    end_month: 2,
    status: "active",
    goals: [],
  },
  {
    phase_number: 2,
    title: "Build",
    description:
      "Expand catalog to 8 tracks, start sync submissions, build content pipeline",
    start_month: 3,
    end_month: 4,
    status: "upcoming",
    goals: [],
  },
  {
    phase_number: 3,
    title: "Launch",
    description:
      "Hit 15 sync-ready tracks, launch content strategy, first revenue targets",
    start_month: 5,
    end_month: 6,
    status: "upcoming",
    goals: [],
  },
  {
    phase_number: 4,
    title: "Growth",
    description:
      "Scale submissions, optimize what's working, explore brand deals",
    start_month: 7,
    end_month: 8,
    status: "upcoming",
    goals: [],
  },
  {
    phase_number: 5,
    title: "Expansion",
    description:
      "Diversify revenue, build audience, advanced sync targeting",
    start_month: 9,
    end_month: 10,
    status: "upcoming",
    goals: [],
  },
  {
    phase_number: 6,
    title: "Scale",
    description:
      "Systematize everything, set next year goals, evaluate catalog value",
    start_month: 11,
    end_month: 12,
    status: "upcoming",
    goals: [],
  },
];

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

  // Check for existing phases
  let { data: phases, error } = await supabase
    .from("timeline_phases")
    .select("*")
    .eq("artist_id", artist.id)
    .order("phase_number", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create defaults if empty
  if (!phases || phases.length === 0) {
    const inserts = DEFAULT_PHASES.map((p) => ({
      ...p,
      artist_id: artist.id,
    }));
    const { data: created, error: insertError } = await supabase
      .from("timeline_phases")
      .insert(inserts)
      .select();
    if (insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    phases = created;
  }

  return NextResponse.json(phases);
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
  const { data: phase, error } = await supabase
    .from("timeline_phases")
    .insert({
      artist_id: artist.id,
      phase_number: body.phase_number,
      title: body.title,
      description: body.description || null,
      start_month: body.start_month,
      end_month: body.end_month,
      status: body.status || "upcoming",
      goals: body.goals || [],
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(phase);
}
