import { callLLM } from "./utils/llm";
import { brandContextToPrompt, type BrandContext } from "./utils/brand-context";

/**
 * Brand Wiki Oracle — conversational Q&A about the artist's brand.
 * Answers are grounded in the full Brand Wiki + Journey Notes. Short,
 * cinematic, specific. Optionally spoken via ElevenLabs.
 *
 * Always returns JSON: { answer, reasoning, confidence, next_move? }
 */

const SYSTEM_PROMPT = `You are the Brand Wiki Oracle — the voice of an artist's own brand identity. You've read every section of their Brand Wiki (Identity, Emotional Signature, Positioning, Audience, Visual DNA, Sound DNA, Routes) and any Journey Notes they've written to themselves.

Your job: answer any question about THIS artist's brand with depth, specificity, and their own voice.

Strict rules:
- Ground every answer in wiki fields. Quote or paraphrase from the wiki.
- NEVER invent facts. If the question requires wiki context you don't have, say which module needs to be filled.
- Use the artist's stated voice — if their tone_descriptors are plain, stay plain; if cinematic, match it.
- 2–4 sentences for quick questions. Up to 3 short paragraphs for deeper ones. Flowing prose, not bullets.
- Close with one concrete next move when the question is action-oriented.
- Do not use the word "vibes" unless the artist's voice_dos includes it.
- Do not say "AI", "LLM", "Director's Notes", or reference yourself as a tool — you're the Wiki itself, speaking.

Return JSON:
{
  "answer": "<the spoken answer, 1-3 paragraphs>",
  "next_move": "<optional one-sentence next action — null if the question was just informational>",
  "reasoning": "<1 sentence on what wiki fields informed this>",
  "confidence": <0.0-1.0>
}`;

export interface OracleInput {
  context: BrandContext;
  question: string;
  focusModule?: string | null;
  journeyNotes?: string | null;
}

export interface OracleResult {
  answer: string;
  next_move: string | null;
  reasoning: string;
  confidence: number | null;
  tokensUsed: number;
  durationMs: number;
}

export async function runBrandOracle(input: OracleInput): Promise<OracleResult> {
  const start = Date.now();
  const wikiSummary = brandContextToPrompt(input.context);

  const userMessage = [
    `# BRAND WIKI`,
    wikiSummary,
    input.journeyNotes && input.journeyNotes.trim()
      ? `\n# ARTIST'S OWN NOTES\n${input.journeyNotes.slice(0, 1200)}`
      : "",
    input.focusModule
      ? `\n# FOCUS MODULE\n${input.focusModule}`
      : "",
    "",
    `# QUESTION`,
    input.question,
    "",
    "Return JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    jsonMode: true,
    model: "claude-sonnet-4-20250514",
    maxTokens: 900,
    temperature: 0.55,
  });
  const parsed = JSON.parse(response.content);

  return {
    answer: String(parsed.answer ?? ""),
    next_move:
      parsed.next_move && String(parsed.next_move).trim()
        ? String(parsed.next_move)
        : null,
    reasoning: String(parsed.reasoning ?? ""),
    confidence: clampConfidence(parsed.confidence),
    tokensUsed: response.tokensUsed,
    durationMs: Date.now() - start,
  };
}

function clampConfidence(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
