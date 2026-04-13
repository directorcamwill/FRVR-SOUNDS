import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runOrchestrator(artistId: string) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Gather context
  const [
    { data: artist },
    { data: songs },
    { data: opportunities },
    { data: submissions },
    { data: recentLogs },
    { data: alerts },
  ] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).single(),
    supabase
      .from("songs")
      .select(
        "id, title, status, song_metadata(*), sync_scores(overall_score, created_at)"
      )
      .eq("artist_id", artistId),
    supabase
      .from("opportunities")
      .select("id, title, stage, deadline")
      .eq("artist_id", artistId),
    supabase
      .from("submissions")
      .select("id, submitted_to, status, deadline")
      .eq("artist_id", artistId),
    supabase
      .from("agent_logs")
      .select("agent_type, action, summary, created_at")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("alerts")
      .select("*")
      .eq("artist_id", artistId)
      .eq("read", false)
      .limit(5),
  ]);

  // Build context summary
  const totalSongs = songs?.length || 0;
  const activeSongs =
    songs?.filter((s) => s.status === "active")?.length || 0;
  const songsWithScore =
    songs?.filter((s) => s.sync_scores?.length > 0)?.length || 0;
  const songsWithoutScore = activeSongs - songsWithScore;
  const songsWithoutMetadata =
    songs?.filter(
      (s) => !s.song_metadata?.length || !s.song_metadata[0]?.genre
    )?.length || 0;
  const activeOpps =
    opportunities?.filter((o) => !["won", "lost"].includes(o.stage))?.length ||
    0;
  const pendingSubs =
    submissions?.filter(
      (s) => s.status === "submitted" || s.status === "under_review"
    )?.length || 0;
  const upcomingDeadlines =
    opportunities?.filter(
      (o) =>
        o.deadline &&
        new Date(o.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )?.length || 0;

  const systemPrompt = `You are the AI orchestrator for FRVR SOUNDS, an artist command center for sync licensing. Your job is to analyze the artist's current state and recommend the 3-5 most impactful actions they should take RIGHT NOW.

Prioritize actions that directly lead to income: completing sync-ready tracks, submitting to opportunities, fixing metadata gaps.

Return JSON:
{
  "priority_actions": [
    {
      "title": "short action title",
      "description": "1-2 sentence explanation of why and what to do",
      "urgency": "high" | "medium" | "low",
      "action_url": "/vault" or "/pipeline" or "/submissions" etc,
      "category": "sync_readiness" | "opportunity" | "metadata" | "submission" | "catalog"
    }
  ],
  "health_summary": "1 sentence overall assessment",
  "focus_area": "the single most important thing to focus on"
}`;

  const userMessage = `## ARTIST: ${artist?.artist_name || "Unknown"}
Genres: ${artist?.genres?.join(", ") || "Not set"}

## CATALOG:
- Total songs: ${totalSongs}
- Active songs: ${activeSongs}
- Songs with sync score: ${songsWithScore}
- Songs WITHOUT sync score: ${songsWithoutScore}
- Songs missing metadata: ${songsWithoutMetadata}

## PIPELINE:
- Active opportunities: ${activeOpps}
- Upcoming deadlines (7 days): ${upcomingDeadlines}
- Pending submissions: ${pendingSubs}
- Total submissions: ${submissions?.length || 0}

## RECENT ACTIVITY:
${recentLogs?.map((l) => `- ${l.agent_type}: ${l.summary}`).join("\n") || "No recent activity"}

## UNREAD ALERTS: ${alerts?.length || 0}

What are the top priority actions for this artist right now?`;

  const response = await callLLM({
    systemPrompt,
    userMessage,
    jsonMode: true,
    maxTokens: 1500,
    temperature: 0.4,
  });

  const parsed = JSON.parse(response.content);

  // Create alerts for high-urgency actions
  if (parsed.priority_actions?.length) {
    const urgentActions = parsed.priority_actions.filter(
      (a: { urgency: string }) => a.urgency === "high"
    );
    for (const action of urgentActions) {
      await supabase.from("alerts").insert({
        artist_id: artistId,
        agent_type: "orchestrator",
        severity: "urgent",
        title: action.title,
        message: action.description,
        action_url: action.action_url,
      });
    }
  }

  // Log agent activity
  await supabase.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "orchestrator",
    action: "priority_scan",
    summary: parsed.focus_area || "Scanned artist priorities",
    details: {
      actions_count: parsed.priority_actions?.length,
      focus: parsed.focus_area,
    },
    tokens_used: response.tokensUsed,
    duration_ms: Date.now() - startTime,
  });

  return {
    ...parsed,
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - startTime,
  };
}
