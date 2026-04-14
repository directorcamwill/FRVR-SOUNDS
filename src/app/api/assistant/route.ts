import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/agents/utils/llm";

const SYSTEM_PROMPT = `You are the FRVR SOUNDS AI Assistant — a knowledgeable music industry expert embedded in an artist command center platform. You help artists with everything: music business, sync licensing, songwriting, production, marketing, legal questions, career strategy, and using the platform.

You are talking to an independent artist. Be direct, practical, and encouraging. Use plain language. Give specific actionable advice.

You know about:
- Sync licensing (how to get placements, what music supervisors want)
- Royalties (PRO, mechanical, performance, sync fees)
- Publishing (admin deals, self-publishing, rights management)
- Production and mixing (for sync readiness)
- Music business (LLC setup, contracts, splits)
- Content strategy (social media, marketing)
- The FRVR SOUNDS platform features (Song Vault, Pipeline, Sync Score, etc.)

Context: The artist is currently on the "{context_page}" page of the platform.

Keep responses concise but helpful. If they ask about a platform feature, guide them to the right page.`;

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
  const { message, context_page, conversation_id } = body;

  if (!message)
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const systemPrompt = SYSTEM_PROMPT.replace("{context_page}", context_page || "unknown");

  // Build conversation history for context
  let existingMessages: Array<{ role: string; content: string; timestamp: string }> = [];
  let convId = conversation_id;

  if (convId) {
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("id", convId)
      .single();
    if (conv) {
      existingMessages = (conv.messages as typeof existingMessages) || [];
    }
  }

  // Build user message with recent context
  const recentContext = existingMessages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const userMessage = recentContext
    ? `Previous conversation:\n${recentContext}\n\nUser: ${message}`
    : message;

  try {
    const response = await callLLM({
      systemPrompt,
      userMessage,
      maxTokens: 1000,
      temperature: 0.7,
    });

    const now = new Date().toISOString();
    const newMessages = [
      ...existingMessages,
      { role: "user", content: message, timestamp: now },
      { role: "assistant", content: response.content, timestamp: now },
    ];

    // Save or create conversation
    if (convId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: newMessages, context_page })
        .eq("id", convId);
    } else {
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({
          artist_id: artist.id,
          context_page,
          messages: newMessages,
        })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    return NextResponse.json({
      response: response.content,
      conversation_id: convId,
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
