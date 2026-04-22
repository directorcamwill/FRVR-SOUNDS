import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";
import { runBrandOracle } from "@/lib/agents/brand-oracle";
import {
  isVoiceConfigured,
  synthesizeSpeech,
} from "@/lib/voice/elevenlabs";
import { getBrandContext } from "@/lib/agents/utils/brand-context";

/**
 * POST /api/brand-wiki/ask
 *
 * Body: {
 *   question: string,
 *   focus_module?: string | null,  // optional BrandModuleId
 *   voice?: boolean                 // default true — skip TTS by setting false
 * }
 *
 * Runs the Brand Oracle agent against the artist's full wiki + journey notes.
 * When voice=true (and ELEVENLABS_API_KEY is set), also returns base64 MP3.
 *
 * Gated by `brand_wiki_activated` (Studio + Internal). Consumes one agent run.
 */

export async function POST(request: Request) {
  const gate = await gateAgentRun("brand_wiki_activated");
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const question = String(body?.question ?? "").trim();
  if (!question) {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 },
    );
  }
  const focusModule =
    typeof body?.focus_module === "string" && body.focus_module.trim()
      ? String(body.focus_module)
      : null;
  const wantVoice = body?.voice !== false;

  const admin = createAdminClient();

  // Full context (includes wiki + journey_notes)
  const context = await getBrandContext(artistId);
  if (!context.wiki) {
    return NextResponse.json(
      {
        error:
          "Brand Wiki hasn't been created yet. Finish the Brand Journey first.",
      },
      { status: 422 },
    );
  }

  try {
    const oracle = await runBrandOracle({
      context,
      question,
      focusModule,
      journeyNotes: context.wiki.journey_notes,
    });

    let audioBase64: string | null = null;
    let voiceAvailable = isVoiceConfigured();
    let voiceError: string | null = null;
    if (wantVoice && voiceAvailable) {
      try {
        const tts = await synthesizeSpeech(oracle.answer);
        audioBase64 = tts.audioBase64;
      } catch (err) {
        voiceError = err instanceof Error ? err.message : "TTS failed";
        voiceAvailable = false;
      }
    }

    await admin.from("agent_logs").insert({
      artist_id: artistId,
      agent_type: "brand_oracle",
      action: "ask",
      summary: `Oracle: ${question.slice(0, 60)}${question.length > 60 ? "…" : ""}`,
      details: {
        focus_module: focusModule,
        voice_rendered: !!audioBase64,
        voice_error: voiceError,
        confidence: oracle.confidence,
      },
      tokens_used: oracle.tokensUsed,
      duration_ms: oracle.durationMs,
    });
    await incrementAgentRunCounter(artistId);

    return NextResponse.json({
      answer: oracle.answer,
      next_move: oracle.next_move,
      reasoning: oracle.reasoning,
      confidence: oracle.confidence,
      voice: {
        requested: wantVoice,
        configured: voiceAvailable,
        audio_base64: audioBase64,
        mime: audioBase64 ? "audio/mpeg" : null,
        error: voiceError,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Oracle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
