import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/agents/utils/llm";
import { OPPORTUNITY_MATCH_PROMPT } from "@/lib/agents/utils/prompts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: matches, error } = await supabase
    .from("opportunity_matches")
    .select(
      `
      *,
      song:songs(
        id,
        title,
        duration_seconds,
        status,
        song_metadata(*),
        stems(*),
        sync_scores(*)
      )
    `
    )
    .eq("opportunity_id", opportunityId)
    .order("fit_score", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(matches);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
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

  // Get the opportunity
  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single();
  if (oppError || !opportunity)
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  // Get all active songs with metadata
  const { data: songs, error: songsError } = await supabase
    .from("songs")
    .select(`*, song_metadata(*), sync_scores(overall_score)`)
    .eq("artist_id", artist.id)
    .eq("status", "active");
  if (songsError)
    return NextResponse.json({ error: songsError.message }, { status: 500 });

  if (!songs || songs.length === 0)
    return NextResponse.json(
      { error: "No active songs to match against" },
      { status: 400 }
    );

  // Delete existing AI matches for this opportunity before re-matching
  await supabase
    .from("opportunity_matches")
    .delete()
    .eq("opportunity_id", opportunityId)
    .eq("matched_by", "ai");

  const matches = [];

  for (const song of songs) {
    const metadata = Array.isArray(song.song_metadata)
      ? song.song_metadata[0]
      : song.song_metadata;

    const briefText = buildBriefText(opportunity);
    const songText = buildSongText(song.title, metadata);

    try {
      const response = await callLLM({
        systemPrompt: OPPORTUNITY_MATCH_PROMPT,
        userMessage: `## OPPORTUNITY BRIEF:\n${briefText}\n\n## SONG:\n${songText}`,
        jsonMode: true,
        maxTokens: 500,
        temperature: 0.3,
      });

      const parsed = JSON.parse(response.content);
      const fitScore = Math.min(100, Math.max(0, parsed.fit_score || 0));
      const fitReasons = parsed.fit_reasons || [];
      const confidence = clampConfidence(parsed.confidence);

      const { data: match, error: matchError } = await supabase
        .from("opportunity_matches")
        .insert({
          opportunity_id: opportunityId,
          song_id: song.id,
          fit_score: fitScore,
          fit_reasons: fitReasons,
          confidence,
          status: "suggested",
          matched_by: "ai",
        })
        .select(
          `
          *,
          song:songs(
        id,
        title,
        duration_seconds,
        status,
        song_metadata(*),
        stems(*),
        sync_scores(*)
      )
        `
        )
        .single();

      if (!matchError && match) {
        matches.push(match);
      }
    } catch {
      // Skip songs that fail matching — don't break the whole batch
      continue;
    }
  }

  // Sort by fit_score descending
  matches.sort((a, b) => b.fit_score - a.fit_score);

  return NextResponse.json(matches);
}

function buildBriefText(opportunity: Record<string, unknown>): string {
  let text = `Title: ${opportunity.title}\n`;
  if (opportunity.description) text += `Description: ${opportunity.description}\n`;
  if (opportunity.opportunity_type) text += `Type: ${opportunity.opportunity_type}\n`;
  if (opportunity.company) text += `Company: ${opportunity.company}\n`;
  const genres = opportunity.genres_needed as string[] | undefined;
  if (genres?.length) text += `Genres Needed: ${genres.join(", ")}\n`;
  const moods = opportunity.moods_needed as string[] | undefined;
  if (moods?.length) text += `Moods Needed: ${moods.join(", ")}\n`;
  if (opportunity.budget_range) text += `Budget: ${opportunity.budget_range}\n`;
  if (opportunity.exclusive) text += `Exclusive: Yes\n`;
  return text;
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function buildSongText(
  title: string,
  metadata: Record<string, unknown> | null
): string {
  let text = `Title: "${title}"\n`;
  if (!metadata) {
    text += "(No metadata available)\n";
    return text;
  }
  if (metadata.genre) text += `Genre: ${metadata.genre}${metadata.sub_genre ? ` / ${metadata.sub_genre}` : ""}\n`;
  if ((metadata.moods as string[])?.length) text += `Moods: ${(metadata.moods as string[]).join(", ")}\n`;
  if (metadata.bpm) text += `BPM: ${metadata.bpm}\n`;
  if (metadata.key) text += `Key: ${metadata.key}\n`;
  if (metadata.energy_level) text += `Energy Level: ${metadata.energy_level}/10\n`;
  if (metadata.has_vocals !== undefined)
    text += `Vocals: ${metadata.has_vocals ? "Yes" : "Instrumental"}\n`;
  if ((metadata.tags as string[])?.length) text += `Tags: ${(metadata.tags as string[]).join(", ")}\n`;
  if (metadata.description) text += `Description: ${metadata.description}\n`;
  return text;
}
