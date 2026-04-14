import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/agents/utils/llm";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  // Get context: songs, existing ideas
  const { data: songs } = await supabase
    .from("songs")
    .select("title, status, song_metadata(genre, moods, tags)")
    .eq("artist_id", artist.id)
    .limit(20);

  const { data: existingIdeas } = await supabase
    .from("ideas")
    .select("title, type")
    .eq("artist_id", artist.id)
    .limit(20);

  const songList =
    songs
      ?.map(
        (s) =>
          `${s.title} (${s.status})${
            s.song_metadata?.[0]?.genre
              ? ` - ${s.song_metadata[0].genre}`
              : ""
          }`
      )
      .join(", ") || "No songs yet";

  const existingList =
    existingIdeas?.map((i) => `${i.title} (${i.type})`).join(", ") ||
    "None";

  const systemPrompt = `You are a creative music industry strategist helping independent artists build their sync licensing career. Generate fresh, actionable, creative ideas personalized to this artist.

Return ONLY valid JSON - an array of exactly 5 idea objects with these fields:
- type: one of "song", "content", "campaign", "brand", "collaboration", "product", "other"
- title: catchy, concise title (max 60 chars)
- description: 1-2 sentences explaining the idea and why it works
- inspiration: what inspired this idea or what trend it taps into
- tags: array of 2-4 relevant tags`;

  const userMessage = `Artist: ${artist.artist_name || "Independent Artist"}
Genre: ${artist.primary_genre || "Various"}
Current catalog: ${songList}
Existing ideas (avoid duplicates): ${existingList}

Generate 5 creative, diverse ideas spanning different types (song concepts, content strategies, campaigns, brand opportunities, collaborations, products). Make them specific, actionable, and tailored to sync licensing success.`;

  try {
    const response = await callLLM({
      systemPrompt,
      userMessage,
      jsonMode: true,
      temperature: 0.8,
      maxTokens: 1500,
    });

    let ideas;
    try {
      const parsed = JSON.parse(response.content);
      ideas = Array.isArray(parsed) ? parsed : parsed.ideas || [];
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Save to database
    const inserts = ideas.map(
      (idea: {
        type: string;
        title: string;
        description: string;
        inspiration: string;
        tags: string[];
      }) => ({
        artist_id: artist.id,
        type: idea.type,
        title: idea.title,
        description: idea.description,
        inspiration: idea.inspiration,
        ai_generated: true,
        tags: idea.tags || [],
      })
    );

    const { data: saved, error: insertError } = await supabase
      .from("ideas")
      .insert(inserts)
      .select();

    if (insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );

    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate ideas",
      },
      { status: 500 }
    );
  }
}
