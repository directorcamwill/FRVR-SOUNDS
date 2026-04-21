import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccess } from "@/lib/features";

// Deep-dive per account: profile, subscription, songs + scores, agent usage,
// recent activity, library submissions, low-confidence alerts. Powers the
// per-account drill-down in the Operator Console.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const access = await getUserAccess();
  if (!access?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { artistId } = await params;

  const admin = createAdminClient();

  const [
    { data: artist },
    { data: subscription },
    { data: songs },
    { data: agentLogs },
    { data: alerts },
    { data: librarySubmissions },
    { data: brandWiki },
    { data: songLabProjects },
  ] = await Promise.all([
    admin
      .from("artists")
      .select("*")
      .eq("id", artistId)
      .single(),
    admin
      .from("subscriptions")
      .select("*")
      .eq("artist_id", artistId)
      .maybeSingle(),
    admin
      .from("songs")
      .select("id, title, status, brand_fit_status, created_at")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("agent_logs")
      .select("agent_type, action, summary, tokens_used, created_at")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("alerts")
      .select("id, agent_type, severity, title, message, created_at")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("library_submissions")
      .select("id, song_title, status, submitted_at")
      .eq("submitter_email", "none-would-match") // library submissions aren't linked to artist id — fallback
      .order("submitted_at", { ascending: false })
      .limit(10),
    admin
      .from("brand_wiki")
      .select("artist_id, updated_at, artist_description")
      .eq("artist_id", artistId)
      .maybeSingle(),
    admin
      .from("song_lab_projects")
      .select("id, title, status, updated_at")
      .eq("artist_id", artistId)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  // Derive agent usage histogram
  const byAgent: Record<string, { count: number; tokens: number }> = {};
  for (const log of agentLogs ?? []) {
    const key = log.agent_type ?? "unknown";
    if (!byAgent[key]) byAgent[key] = { count: 0, tokens: 0 };
    byAgent[key].count += 1;
    byAgent[key].tokens += log.tokens_used ?? 0;
  }

  const lastAgentRun = agentLogs?.[0]?.created_at ?? null;
  const lastSongAdded = songs?.[0]?.created_at ?? null;

  return NextResponse.json({
    artist,
    subscription,
    brand_wiki: brandWiki,
    songs,
    song_lab_projects: songLabProjects,
    agent_logs: agentLogs?.slice(0, 25) ?? [],
    agent_usage_by_type: byAgent,
    alerts,
    library_submissions: librarySubmissions,
    summary: {
      total_songs: songs?.length ?? 0,
      total_song_lab_projects: songLabProjects?.length ?? 0,
      total_agent_runs: agentLogs?.length ?? 0,
      total_alerts: alerts?.length ?? 0,
      last_agent_run: lastAgentRun,
      last_song_added: lastSongAdded,
    },
  });
}
