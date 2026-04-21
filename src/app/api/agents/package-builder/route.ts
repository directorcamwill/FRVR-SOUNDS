import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { runPackageBuilder } from "@/lib/agents/package-builder";

/**
 * POST /api/agents/package-builder
 *
 * Body: { songId: string }
 *
 * Runs the deterministic Package Builder agent for one song, caches the
 * result to songs.package_status + songs.package_checked_at (migration 00012),
 * logs to agent_logs, and writes an alert when there are high-severity blockers.
 *
 * GET is also exposed as a read-through: returns the cached status (if any).
 */

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
  const songId: string | undefined = body?.songId;
  if (!songId)
    return NextResponse.json(
      { error: "songId is required" },
      { status: 400 }
    );

  // Ensure the song belongs to this artist before running.
  const { data: song } = await supabase
    .from("songs")
    .select("id, title, artist_id")
    .eq("id", songId)
    .single();
  if (!song || song.artist_id !== artist.id)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  const start = Date.now();

  try {
    const status = await runPackageBuilder(songId);
    const durationMs = Date.now() - start;

    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin
      .from("songs")
      .update({
        package_status: status,
        package_checked_at: now,
      })
      .eq("id", songId);

    await admin.from("agent_logs").insert({
      artist_id: artist.id,
      agent_type: "package_builder",
      action: "check_package_readiness",
      summary: `Package check for "${song.title}" — ${status.completeness_pct}% complete · ${status.blockers.length} blocker${status.blockers.length === 1 ? "" : "s"}`,
      details: {
        song_id: songId,
        ready: status.ready,
        completeness_pct: status.completeness_pct,
        blocker_count: status.blockers.length,
      },
      tokens_used: 0,
      duration_ms: durationMs,
    });

    const highBlockers = status.blockers.filter((b) => b.severity === "high");
    if (highBlockers.length > 0) {
      await admin.from("alerts").insert({
        artist_id: artist.id,
        agent_type: "package_builder",
        severity: "warning",
        title: `"${song.title}" sync package blocked`,
        message: `${highBlockers.length} high-severity item${highBlockers.length === 1 ? "" : "s"} blocking submission. ${highBlockers[0].message}`,
        action_url: `/vault/${songId}`,
      });
    }

    return NextResponse.json({
      status,
      durationMs,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Package builder failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("songId");
  if (!songId)
    return NextResponse.json(
      { error: "songId is required" },
      { status: 400 }
    );

  const { data: song, error } = await supabase
    .from("songs")
    .select("id, package_status, package_checked_at")
    .eq("id", songId)
    .single();
  if (error || !song)
    return NextResponse.json({ error: "Song not found" }, { status: 404 });

  return NextResponse.json({
    status: song.package_status,
    checkedAt: song.package_checked_at,
  });
}
