import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  runBrandDirector,
  runDirectorsNotesRefine,
  runDirectorsNotesCritique,
  runDirectorsNotesFollowUp,
  runDirectorsNotesSummarize,
  runGeneratePillars,
  runGenerateHooks,
  runScoreContent,
  runGenerateOriginScript,
  runGenerateContrarianHooks,
  runGenerateCaptionStarters,
  runGenerateMoodFormatMap,
  runMultiplyPost,
  runMakeMoreViral,
  runMakeMoreNiche,
} from "@/lib/agents/brand-director";
import type { BrandFocus } from "@/types/brand";
import { gateAgentRun } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

/**
 * POST /api/agents/brand-director
 *
 * Modes:
 *   mode?: "guide" (default) — whole-wiki guidance + next_question
 *     Body: { focus?: BrandFocus, generate?: "bio"|"pitch"|"origin_story" }
 *
 *   mode: "refine_field" — Director's Notes per-answer refine
 *     Body: { field_key, user_text, question_prompt? }
 *
 *   mode: "critique" — Director's read / spot-check
 *     Body: { field_key, user_text, question_prompt? }
 *
 *   mode: "follow_up" — one more question from the Director
 *     Body: { field_key, user_text }
 *
 *   mode: "summarize_to_wiki" — commit module answers to the Wiki (e.g. Identity → bios)
 *     Body: { module_id }
 *
 *   mode: "generate_pillars" (V2) — propose 3 content pillars from the wiki
 *     Body: {} — reads the whole wiki
 *     Returns: { pillars: [...], reasoning, confidence }
 *
 *   mode: "generate_hooks" (V2) — propose 10 reusable hook templates
 *     Body: { pillars?: [{id, name}] } — locked pillars improve targeting
 *     Returns: { hooks: [...], reasoning, confidence }
 *
 *   mode: "score_content" (V2) — 4-dim Content Fit Scoring on a piece
 *     Body: { piece: { platform, hook, body, cta, pillar_id?, format_id? } }
 *     Returns: { score: { identity_match, emotional_accuracy, audience_relevance, platform_fit, total, flags[], suggestions[], reasoning, confidence } }
 *
 * summarize_to_wiki is gated by `brand_wiki_activated`. All other modes are
 * gated by `ai_brand_director`. Each call consumes one agent run.
 */

type Mode =
  | "guide"
  | "refine_field"
  | "critique"
  | "follow_up"
  | "summarize_to_wiki"
  | "generate_pillars"
  | "generate_hooks"
  | "score_content"
  | "generate_origin_script"
  | "generate_contrarian_hooks"
  | "generate_caption_starters"
  | "generate_mood_format_map"
  | "multiply_post"
  | "make_more_viral"
  | "make_more_niche";

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => ({}));
  const mode: Mode = (rawBody?.mode as Mode) ?? "guide";
  // summarize_to_wiki is the Brand Wiki Activation reward — Studio-tier only.
  // Every other mode runs on Pro+ via ai_brand_director.
  const gateFeature =
    mode === "summarize_to_wiki" ? "brand_wiki_activated" : "ai_brand_director";
  const gate = await gateAgentRun(gateFeature);
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id, artist_name")
    .eq("id", artistId)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  const body = rawBody;

  const admin = createAdminClient();

  // Auto-create wiki row if none exists.
  let { data: wiki } = await supabase
    .from("brand_wiki")
    .select("*")
    .eq("artist_id", artist.id)
    .maybeSingle();
  if (!wiki) {
    const { data: created, error: createErr } = await admin
      .from("brand_wiki")
      .insert({ artist_id: artist.id })
      .select()
      .single();
    if (createErr)
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    wiki = created;
  }

  try {
    switch (mode) {
      case "refine_field": {
        const slotStructure = Array.isArray(body?.slot_structure)
          ? (body.slot_structure as Array<{ label?: unknown; value?: unknown }>)
              .map((s) => ({
                label: String(s?.label ?? ""),
                value: String(s?.value ?? ""),
              }))
          : undefined;
        const res = await runDirectorsNotesRefine({
          wiki,
          fieldKey: String(body?.field_key ?? ""),
          userText: String(body?.user_text ?? ""),
          questionPrompt: body?.question_prompt
            ? String(body.question_prompt)
            : undefined,
          slotStructure,
          artistName: artist.artist_name,
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "refine_field",
          summary: `Refined ${body?.field_key}`,
          details: {
            field_key: body?.field_key,
            confidence: res.confidence,
            slotted: !!slotStructure,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          refined: {
            refined_text: res.refined_text,
            refined_slots: res.refined_slots,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "critique": {
        const res = await runDirectorsNotesCritique({
          wiki,
          fieldKey: String(body?.field_key ?? ""),
          userText: String(body?.user_text ?? ""),
          questionPrompt: body?.question_prompt
            ? String(body.question_prompt)
            : undefined,
          artistName: artist.artist_name,
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "critique",
          summary: `Critique ${body?.field_key}: ${res.specificity_score.toFixed(2)}`,
          details: {
            field_key: body?.field_key,
            specificity_score: res.specificity_score,
            flags: res.flags,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          critique: {
            specificity_score: res.specificity_score,
            flags: res.flags,
            suggestion: res.suggestion,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "follow_up": {
        const res = await runDirectorsNotesFollowUp({
          wiki,
          fieldKey: String(body?.field_key ?? ""),
          userText: String(body?.user_text ?? ""),
          artistName: artist.artist_name,
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "follow_up",
          summary: `Follow-up for ${body?.field_key}`,
          details: {
            field_key: body?.field_key,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          follow_up: {
            follow_up_question: res.follow_up_question,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "summarize_to_wiki": {
        const moduleId = String(body?.module_id ?? "");
        const res = await runDirectorsNotesSummarize({
          wiki,
          moduleId,
          artistName: artist.artist_name,
        });
        // Only auto-write to wiki when confidence is solid; below that, return as suggestion.
        let wrote = false;
        if ((res.confidence ?? 0) >= 0.75) {
          await admin
            .from("brand_wiki")
            .update({
              bio_short: res.bio_short,
              bio_medium: res.bio_medium,
              bio_long: res.bio_long,
              elevator_pitch: res.elevator_pitch,
            })
            .eq("artist_id", artist.id);
          wrote = true;
        }
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "summarize_to_wiki",
          summary: wrote
            ? `Module ${moduleId} committed to wiki (bios regenerated)`
            : `Module ${moduleId} summary returned as suggestion (low conf)`,
          details: {
            module_id: moduleId,
            confidence: res.confidence,
            auto_wrote: wrote,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          summary: {
            bio_short: res.bio_short,
            bio_medium: res.bio_medium,
            bio_long: res.bio_long,
            elevator_pitch: res.elevator_pitch,
            reasoning: res.reasoning,
            confidence: res.confidence,
            auto_wrote: wrote,
          },
        });
      }

      case "generate_pillars": {
        const res = await runGeneratePillars({
          wiki,
          artistName: artist.artist_name,
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_pillars",
          summary: `Generated ${res.pillars.length} content pillars`,
          details: {
            count: res.pillars.length,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          pillars: res.pillars,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "generate_hooks": {
        const lockedPillars = Array.isArray(body?.pillars)
          ? (body.pillars as Array<Record<string, unknown>>).map((p) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
            }))
          : undefined;
        const res = await runGenerateHooks({
          wiki,
          pillars: lockedPillars,
          artistName: artist.artist_name,
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_hooks",
          summary: `Generated ${res.hooks.length} hook templates`,
          details: {
            count: res.hooks.length,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          hooks: res.hooks,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "generate_origin_script": {
        const res = await runGenerateOriginScript({
          wiki,
          artistName: artist.artist_name,
        });
        await persistModuleOutput(admin, artist.id, wiki, "identity", "origin_script", {
          hook: res.hook,
          moment: res.moment,
          reveal: res.reveal,
          cta: res.cta,
          shot_notes: res.shot_notes,
          reasoning: res.reasoning,
          confidence: res.confidence,
          generated_at: new Date().toISOString(),
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_origin_script",
          summary: `Origin-moment script (conf ${res.confidence?.toFixed(2) ?? "—"})`,
          details: { confidence: res.confidence },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          script: {
            hook: res.hook,
            moment: res.moment,
            reveal: res.reveal,
            cta: res.cta,
            shot_notes: res.shot_notes,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "generate_contrarian_hooks": {
        const res = await runGenerateContrarianHooks({
          wiki,
          artistName: artist.artist_name,
        });
        await persistModuleOutput(admin, artist.id, wiki, "identity", "contrarian_hooks", {
          hooks: res.hooks,
          reasoning: res.reasoning,
          confidence: res.confidence,
          generated_at: new Date().toISOString(),
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_contrarian_hooks",
          summary: `${res.hooks.length} contrarian hooks`,
          details: { count: res.hooks.length, confidence: res.confidence },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          hooks: res.hooks,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "generate_caption_starters": {
        const res = await runGenerateCaptionStarters({
          wiki,
          artistName: artist.artist_name,
        });
        await persistModuleOutput(admin, artist.id, wiki, "emotional", "caption_starters", {
          by_emotion: res.by_emotion,
          reasoning: res.reasoning,
          confidence: res.confidence,
          generated_at: new Date().toISOString(),
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_caption_starters",
          summary: `Caption starters across ${Object.keys(res.by_emotion).length} emotion${Object.keys(res.by_emotion).length === 1 ? "" : "s"}`,
          details: {
            emotion_count: Object.keys(res.by_emotion).length,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          by_emotion: res.by_emotion,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "generate_mood_format_map": {
        const res = await runGenerateMoodFormatMap({
          wiki,
          artistName: artist.artist_name,
        });
        await persistModuleOutput(admin, artist.id, wiki, "emotional", "mood_format_map", {
          by_mood: res.by_mood,
          reasoning: res.reasoning,
          confidence: res.confidence,
          generated_at: new Date().toISOString(),
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "generate_mood_format_map",
          summary: `Mood→format map across ${res.by_mood.length} mood${res.by_mood.length === 1 ? "" : "s"}`,
          details: { mood_count: res.by_mood.length, confidence: res.confidence },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          by_mood: res.by_mood,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "multiply_post": {
        const piece = body?.piece as
          | {
              platform?: unknown;
              hook?: unknown;
              body?: unknown;
              cta?: unknown;
            }
          | undefined;
        if (!piece) {
          return NextResponse.json(
            { error: "multiply_post requires { piece }" },
            { status: 400 },
          );
        }
        const res = await runMultiplyPost({
          wiki,
          artistName: artist.artist_name,
          piece: {
            platform: String(piece.platform ?? ""),
            hook: String(piece.hook ?? ""),
            body: String(piece.body ?? ""),
            cta: String(piece.cta ?? ""),
          },
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "multiply_post",
          summary: `${res.variants.length} platform variants`,
          details: { count: res.variants.length, confidence: res.confidence },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          variants: res.variants,
          reasoning: res.reasoning,
          confidence: res.confidence,
        });
      }

      case "make_more_viral":
      case "make_more_niche": {
        const piece = body?.piece as
          | {
              platform?: unknown;
              hook?: unknown;
              body?: unknown;
              cta?: unknown;
            }
          | undefined;
        if (!piece) {
          return NextResponse.json(
            { error: `${mode} requires { piece }` },
            { status: 400 },
          );
        }
        const runner = mode === "make_more_viral" ? runMakeMoreViral : runMakeMoreNiche;
        const res = await runner({
          wiki,
          artistName: artist.artist_name,
          piece: {
            platform: String(piece.platform ?? ""),
            hook: String(piece.hook ?? ""),
            body: String(piece.body ?? ""),
            cta: String(piece.cta ?? ""),
          },
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: mode,
          summary: `Refined for ${mode === "make_more_viral" ? "viral lift" : "niche fit"} (delta ${res.delta_score?.toFixed(2) ?? "—"})`,
          details: {
            delta_score: res.delta_score,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          refined: {
            hook: res.hook,
            body: res.body,
            cta: res.cta,
            delta_message: res.delta_message,
            delta_score: res.delta_score,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "score_content": {
        const piece = body?.piece as
          | {
              platform?: unknown;
              hook?: unknown;
              body?: unknown;
              cta?: unknown;
              pillar_id?: unknown;
              format_id?: unknown;
            }
          | undefined;
        if (!piece) {
          return NextResponse.json(
            { error: "score_content requires { piece }" },
            { status: 400 },
          );
        }
        const res = await runScoreContent({
          wiki,
          artistName: artist.artist_name,
          piece: {
            platform: String(piece.platform ?? ""),
            hook: String(piece.hook ?? ""),
            body: String(piece.body ?? ""),
            cta: String(piece.cta ?? ""),
            pillar_id: piece.pillar_id ? String(piece.pillar_id) : null,
            format_id: piece.format_id ? String(piece.format_id) : null,
          },
        });
        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "score_content",
          summary: `Scored content piece: total ${res.total.toFixed(2)}`,
          details: {
            scores: {
              identity_match: res.identity_match,
              emotional_accuracy: res.emotional_accuracy,
              audience_relevance: res.audience_relevance,
              platform_fit: res.platform_fit,
              total: res.total,
            },
            flags: res.flags,
            confidence: res.confidence,
          },
          tokens_used: res.tokensUsed,
          duration_ms: res.durationMs,
        });
        await incrementAgentRunCounter(artist.id);
        return NextResponse.json({
          mode,
          score: {
            identity_match: res.identity_match,
            emotional_accuracy: res.emotional_accuracy,
            audience_relevance: res.audience_relevance,
            platform_fit: res.platform_fit,
            total: res.total,
            flags: res.flags,
            suggestions: res.suggestions,
            reasoning: res.reasoning,
            confidence: res.confidence,
          },
        });
      }

      case "guide":
      default: {
        const focus = body?.focus as BrandFocus | undefined;
        const generate =
          (body?.generate as "bio" | "pitch" | "origin_story" | null) ?? null;
        const { guidance, tokensUsed, durationMs } = await runBrandDirector({
          wiki: wiki ?? {},
          focus,
          generate,
          artistName: artist.artist_name,
        });

        const now = new Date().toISOString();
        await admin
          .from("brand_wiki")
          .update({
            last_guided_at: now,
            completeness_pct: guidance.completeness_pct,
          })
          .eq("artist_id", artist.id);

        await admin.from("agent_logs").insert({
          artist_id: artist.id,
          agent_type: "brand_director",
          action: "guide",
          summary: `Brand wiki at ${guidance.completeness_pct}% — ${guidance.missing_critical.length} critical gap${guidance.missing_critical.length === 1 ? "" : "s"}`,
          details: {
            focus,
            generate,
            completeness_pct: guidance.completeness_pct,
            missing_critical_count: guidance.missing_critical.length,
            confidence: guidance.confidence,
          },
          tokens_used: tokensUsed,
          duration_ms: durationMs,
        });

        if (
          guidance.completeness_pct < 40 &&
          guidance.missing_critical.length >= 4
        ) {
          await admin.from("alerts").insert({
            artist_id: artist.id,
            agent_type: "brand_director",
            severity: "warning",
            title: "Brand Wiki needs attention",
            message: `Your Brand Wiki is at ${guidance.completeness_pct}%. Downstream agents (Content, Outreach) will emit generic output until core identity fields are filled.`,
            action_url: "/brand",
          });
        }

        await incrementAgentRunCounter(artist.id);

        return NextResponse.json({ mode, guidance, tokensUsed, durationMs });
      }
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Brand Director failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Read-merge-write a single output bucket on `brand_wiki.module_outputs`.
// Shape: { <module_id>: { <output_key>: { ...payload } } }
// Fails soft when the column is missing (migration 00030 unapplied) so the
// generation still returns its result to the UI even if persistence skips.
async function persistModuleOutput(
  admin: ReturnType<typeof createAdminClient>,
  artistId: string,
  wiki: Record<string, unknown> | null,
  moduleId: string,
  outputKey: string,
  payload: unknown,
): Promise<void> {
  const existing =
    (wiki && typeof wiki === "object" ? (wiki as Record<string, unknown>).module_outputs : null) ??
    null;
  const next: Record<string, Record<string, unknown>> =
    existing && typeof existing === "object"
      ? (JSON.parse(JSON.stringify(existing)) as Record<string, Record<string, unknown>>)
      : {};
  if (!next[moduleId] || typeof next[moduleId] !== "object") next[moduleId] = {};
  next[moduleId][outputKey] = payload as Record<string, unknown>;
  const { error } = await admin
    .from("brand_wiki")
    .update({ module_outputs: next })
    .eq("artist_id", artistId);
  if (error) {
    if (/relation .* does not exist|column .* does not exist|schema cache/i.test(error.message)) {
      return; // migration not applied — skip persistence silently
    }
    // Real error — log so we notice but don't break the API response
    console.error("persistModuleOutput failed:", error.message);
  }
}
