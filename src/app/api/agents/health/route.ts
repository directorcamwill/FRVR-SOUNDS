import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runHealthMonitor } from "@/lib/agents/health-monitor";

export async function POST() {
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

  try {
    const result = await runHealthMonitor(artist.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Health monitor failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

  const { data: score } = await supabase
    .from("health_scores")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(score);
}
