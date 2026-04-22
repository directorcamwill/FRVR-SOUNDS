import { NextResponse } from "next/server";
import { runLLCAgent } from "@/lib/agents/llc-agent";
import { gateAgentQuota } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

export async function POST(request: Request) {
  let useAI = true;
  try {
    const body = await request.json();
    if (body.useAI === false) useAI = false;
  } catch {
    // No body or invalid JSON is fine — default to AI mode
  }

  async function resolveArtistId(): Promise<
    | { ok: true; artistId: string }
    | { ok: false; response: NextResponse }
  > {
    if (useAI) {
      const gate = await gateAgentQuota();
      if (!gate.ok) return { ok: false, response: gate.response };
      if (!gate.access.artist_id)
        return {
          ok: false,
          response: NextResponse.json(
            { error: "No artist profile" },
            { status: 404 }
          ),
        };
      return { ok: true, artistId: gate.access.artist_id };
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    const { data: artist } = await supabase
      .from("artists")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!artist)
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No artist profile" },
          { status: 404 }
        ),
      };
    return { ok: true, artistId: artist.id };
  }

  const resolved = await resolveArtistId();
  if (!resolved.ok) return resolved.response;
  const artistId = resolved.artistId;

  try {
    const result = await runLLCAgent(artistId, useAI);
    if (useAI) await incrementAgentRunCounter(artistId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "LLC agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
