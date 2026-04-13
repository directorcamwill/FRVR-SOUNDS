import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runCatalogMarketing(artistId: string) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Get recent activity
  const { data: recentLogs } = await supabase
    .from("agent_logs")
    .select("agent_type, action, summary, created_at")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: artist } = await supabase
    .from("artists")
    .select("artist_name, genres")
    .eq("id", artistId)
    .single();

  const { data: recentScores } = await supabase
    .from("sync_scores")
    .select("overall_score, song_id, songs(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  const systemPrompt = `You are a content strategist for musicians. Based on the artist's recent activity on their sync licensing platform, generate 3 content ideas they can post on social media.

Each idea should be derived from REAL activity — not generic advice. Reference specific songs, scores, or milestones.

Return JSON:
{
  "content_moments": [
    {
      "trigger_event": "what happened that inspired this",
      "content_type": "social_post" | "story" | "reel",
      "title": "short title for the content idea",
      "content": "the actual caption/script (2-3 sentences)",
      "platform_suggestions": ["instagram", "tiktok", "twitter"]
    }
  ]
}`;

  const userMessage = `Artist: ${artist?.artist_name}
Genres: ${artist?.genres?.join(", ")}

Recent activity:
${
  recentLogs
    ?.map(
      (l) =>
        `- ${l.summary} (${new Date(l.created_at).toLocaleDateString()})`
    )
    .join("\n") || "No recent activity"
}

Recent sync scores:
${
  recentScores
    ?.map(
      (s) =>
        `- "${(s as Record<string, unknown> & { songs?: { title?: string } }).songs?.title || "Track"}" scored ${s.overall_score}/100`
    )
    .join("\n") || "No scores yet"
}

Generate 3 content moments based on this real activity.`;

  const response = await callLLM({
    systemPrompt,
    userMessage,
    jsonMode: true,
    maxTokens: 1200,
    temperature: 0.6,
  });

  const parsed = JSON.parse(response.content);

  // Save content moments
  if (parsed.content_moments?.length) {
    for (const moment of parsed.content_moments) {
      await supabase.from("content_moments").insert({
        artist_id: artistId,
        trigger_event: moment.trigger_event,
        content_type: moment.content_type,
        title: moment.title,
        content: moment.content,
        platform_suggestions: moment.platform_suggestions || [],
      });
    }
  }

  await supabase.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "catalog_marketing",
    action: "generate_content",
    summary: `Generated ${parsed.content_moments?.length || 0} content ideas`,
    tokens_used: response.tokensUsed,
    duration_ms: Date.now() - startTime,
  });

  return parsed;
}
