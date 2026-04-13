import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runMarketIntel(artistId: string) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", artistId)
    .single();
  const { data: songs } = await supabase
    .from("songs")
    .select("title, song_metadata(genre, moods, tags)")
    .eq("artist_id", artistId)
    .eq("status", "active");

  const genres = artist?.genres?.join(", ") || "Not specified";
  const songGenres = [
    ...new Set(
      songs
        ?.map((s) => {
          const meta = Array.isArray(s.song_metadata)
            ? s.song_metadata[0]
            : s.song_metadata;
          return meta?.genre;
        })
        .filter(Boolean)
    ),
  ].join(", ");

  const systemPrompt = `You are a music industry market intelligence analyst specializing in sync licensing. Generate a brief for an independent artist about current sync market conditions relevant to their genre and catalog.

Return JSON:
{
  "title": "brief title",
  "summary": "2-3 sentence overview",
  "sections": [
    { "heading": "section name", "content": "detailed analysis (2-3 sentences)" }
  ],
  "trending_genres": ["genre1", "genre2"],
  "opportunity_types": ["type of placement to target"],
  "action_items": ["specific thing to do"]
}

Be specific to their genres. Reference real types of placements (TV shows, ad categories, film genres). Don't be generic.`;

  const userMessage = `Artist: ${artist?.artist_name}
Genres: ${genres}
Catalog genres: ${songGenres || "No songs yet"}
Number of songs: ${songs?.length || 0}
Goals: ${artist?.goals?.join(", ") || "Sync licensing"}

Generate a market intelligence brief for this artist.`;

  const response = await callLLM({
    systemPrompt,
    userMessage,
    jsonMode: true,
    maxTokens: 1500,
    temperature: 0.5,
  });

  const parsed = JSON.parse(response.content);

  // Save brief
  const { data: brief } = await supabase
    .from("intelligence_briefs")
    .insert({
      artist_id: artistId,
      brief_type: "weekly",
      title: parsed.title || "Weekly Market Intelligence",
      summary: parsed.summary,
      sections: parsed.sections || [],
    })
    .select()
    .single();

  // Log
  await supabase.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "market_intel",
    action: "generate_brief",
    summary: `Generated: ${parsed.title}`,
    tokens_used: response.tokensUsed,
    duration_ms: Date.now() - startTime,
  });

  return { brief, parsed, tokensUsed: response.tokensUsed };
}
