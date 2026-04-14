import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/agents/utils/llm";
import { KNOWLEDGE_TOPICS } from "@/lib/knowledge/topics";

const SYSTEM_PROMPT = `You are a music business expert who explains complex industry concepts in simple, plain language. You're advising an independent artist.

Rules:
- No jargon without explanation
- Use specific examples and numbers when possible
- Be direct and actionable
- If they should be careful about something, say so clearly
- Personalize advice based on their situation
- Never use emojis

Here are the knowledge base topics available for reference (use their IDs in related_topics):
${KNOWLEDGE_TOPICS.map((t) => `- ${t.id}: ${t.title}`).join("\n")}

Return valid JSON with this exact structure:
{
  "answer": "your detailed but accessible answer (3-5 paragraphs)",
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "related_topics": ["topic-id-1", "topic-id-2"],
  "action_items": ["specific thing to do"]
}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a valid question" },
        { status: 400 }
      );
    }

    const result = await callLLM({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: question.trim(),
      jsonMode: true,
      maxTokens: 1500,
      temperature: 0.4,
    });

    const parsed = JSON.parse(result.content);

    // Validate related_topics contain real IDs
    const validTopicIds = new Set(KNOWLEDGE_TOPICS.map((t) => t.id));
    parsed.related_topics = (parsed.related_topics || []).filter((id: string) =>
      validTopicIds.has(id)
    );

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
