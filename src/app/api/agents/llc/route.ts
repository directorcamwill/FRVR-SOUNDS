import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runLLCAgent } from "@/lib/agents/llc-agent";

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

  // Optional: allow disabling AI mode via query param
  let useAI = true;
  try {
    const body = await request.json();
    if (body.useAI === false) useAI = false;
  } catch {
    // No body or invalid JSON is fine — default to AI mode
  }

  try {
    const result = await runLLCAgent(artist.id, useAI);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "LLC agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
