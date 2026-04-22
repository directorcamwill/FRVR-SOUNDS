import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  runBrandDirector,
  runDirectorsNotesRefine,
  runDirectorsNotesCritique,
  runDirectorsNotesFollowUp,
  runDirectorsNotesSummarize,
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
 * All modes are gated by `ai_brand_director` + consume one agent run.
 */

type Mode = "guide" | "refine_field" | "critique" | "follow_up" | "summarize_to_wiki";

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
