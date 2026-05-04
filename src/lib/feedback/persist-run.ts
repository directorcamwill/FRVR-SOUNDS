// Persist a Weekly Feedback Loop run to `feedback_runs`.
// Called from the existing `runWeeklyDigest` job (see
// src/lib/agents/automation/weekly-digest.ts) so a Monday tick produces both
// the digest email AND a stored aggregation row the dashboard can read
// historically.
//
// Idempotent on (artist_id, period_start, period_end) — re-running for the
// same window updates `signals` and `model_diff` but never duplicates.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateWeek,
  type ShippedPiece,
  type WeeklyAggregate,
} from "./aggregate";

export interface PersistedFeedbackRun {
  artist_id: string;
  period_start: string;
  period_end: string;
  digest: WeeklyAggregate;
}

export async function persistFeedbackRun(
  artistId: string,
  now: Date = new Date(),
): Promise<PersistedFeedbackRun | null> {
  const admin = createAdminClient();

  // Pull the last 30 days of shipped pieces (covers this + last week).
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 30);

  const { data: pieces, error } = await admin
    .from("content_pieces")
    .select(
      "id, pillar_id, format_id, hook, shipped_at, fit_score, performance",
    )
    .eq("artist_id", artistId)
    .not("shipped_at", "is", null)
    .gte("shipped_at", since.toISOString());

  // Fail soft when migration 00030 isn't applied yet — the digest email
  // still goes out without a persisted run.
  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return null;
    }
    throw error;
  }

  const shipped: ShippedPiece[] = (pieces ?? []).map((p) => ({
    id: p.id,
    pillar_id: p.pillar_id,
    format_id: p.format_id,
    shipped_at: p.shipped_at,
    hook: p.hook,
    fit_score: p.fit_score,
    performance: p.performance,
    emotion: null,
  }));

  const digest = aggregateWeek(shipped, now);

  // Persist the run. Stays idempotent because the table has a unique index
  // on (artist_id, period_start, period_end) declared in 00030.
  const { error: upsertErr } = await admin.from("feedback_runs").upsert(
    {
      artist_id: artistId,
      period_start: digest.period_start,
      period_end: digest.period_end,
      signals: {
        top_signal: digest.top_signal,
        top_anti_signal: digest.top_anti_signal,
        by_pillar: digest.by_pillar,
        by_emotion: digest.by_emotion,
        totals: digest.totals,
        wow: digest.wow,
        baseline_lift: digest.baseline_lift,
        pieces_shipped: digest.pieces_shipped,
        pieces_with_data: digest.pieces_with_data,
      },
      model_diff: {},   // V2 follow-up: actual model_diff comes when audience_model + emotional_model are mutated
      applied: false,
    },
    { onConflict: "artist_id,period_start,period_end" },
  );

  if (upsertErr) {
    if (/relation .* does not exist|schema cache/i.test(upsertErr.message)) {
      return null;
    }
    throw upsertErr;
  }

  return {
    artist_id: artistId,
    period_start: digest.period_start,
    period_end: digest.period_end,
    digest,
  };
}
