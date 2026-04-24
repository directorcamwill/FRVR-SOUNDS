import { createAdminClient } from "@/lib/supabase/admin";
import {
  runContentDirector,
  type ContentMomentType,
  type ContentPlatform,
} from "./content-director";
import type { PackageStatus } from "./package-builder";

/**
 * Content + Sync Loop — thin orchestrator (not a new LLM agent).
 *
 * Takes a ready song and fans it out:
 *   1. Reads song + package_status + brand_wiki.
 *   2. Calls Content Director for a `song_release` content batch across
 *      IG / TikTok / X / email.
 *   3. Upserts a `release_plan` row with the default release checklist,
 *      counters, and the director's batch_id.
 *
 * Hard-gates:
 *   - song must belong to the artist
 *   - package_status.ready must be true
 *   - brand_wiki completeness ≥ 60% (enforced inside Content Director)
 *
 * Returns a structured result the UI can render (or a gated reason).
 */

export type LoopGatedReason =
  | "song_not_found"
  | "package_not_ready"
  | "brand_wiki_incomplete"
  | "already_running";

export interface LoopGatedResult {
  ok: false;
  reason: LoopGatedReason;
  message: string;
  completeness_pct?: number;
  missing_critical?: string[];
}

export interface LoopSuccessResult {
  ok: true;
  batch_id: string;
  content_moments_planned: number;
  release_plan_id: string;
  tokensUsed: number;
  durationMs: number;
}

export type LoopResult = LoopGatedResult | LoopSuccessResult;

const DEFAULT_PLATFORMS: ContentPlatform[] = [
  "instagram",
  "tiktok",
  "x",
  "email",
];

const DEFAULT_CHECKLIST = [
  { key: "distribute", label: "Lock distributor + release date", done: false, due_offset_days: -21 },
  { key: "pre_save", label: "Ship pre-save link", done: false, due_offset_days: -14 },
  { key: "one_sheet", label: "Send one-sheet to supervisors", done: false, due_offset_days: -10 },
  { key: "launch_post", label: "Publish launch-day post", done: false, due_offset_days: 0 },
  { key: "follow_up", label: "Fire 30-day follow-up content", done: false, due_offset_days: 30 },
];

export async function runContentSyncLoop({
  artistId,
  songId,
}: {
  artistId: string;
  songId: string;
}): Promise<LoopResult> {
  const admin = createAdminClient();
  const start = Date.now();

  const { data: song } = await admin
    .from("songs")
    .select("id, artist_id, package_status")
    .eq("id", songId)
    .eq("artist_id", artistId)
    .maybeSingle();
  if (!song) {
    return {
      ok: false,
      reason: "song_not_found",
      message: "Song not found in your vault.",
    };
  }

  const pkg = song.package_status as PackageStatus | null;
  if (!pkg?.ready) {
    return {
      ok: false,
      reason: "package_not_ready",
      message:
        "Run the Package Builder first — this song still has blockers. The loop only runs on sync-ready tracks.",
    };
  }

  // Content Director runs its own brand-wiki hard-gate (< 60%) and returns
  // a gated result. Forward it so the caller can surface the same CTA.
  const director = await runContentDirector({
    artistId,
    momentType: "song_release" as ContentMomentType,
    songId,
    platforms: DEFAULT_PLATFORMS,
    customNote:
      "This is a streaming release launch. Emit one variant per target platform. Keep captions usable day-of.",
  });

  if (director.gated) {
    return {
      ok: false,
      reason: "brand_wiki_incomplete",
      message: director.message,
      completeness_pct: director.completeness_pct,
      missing_critical: director.missing_critical,
    };
  }

  // Persist the content_moments batch the director just drafted.
  const rows = director.variants.map((v) => ({
    artist_id: artistId,
    trigger_event: "song_release",
    content_type: v.content_type,
    title: v.title,
    content: v.content,
    platform_suggestions: v.platforms,
    hashtags: v.hashtags,
    hook_ideas: v.hook_ideas,
    confidence: v.confidence,
    reasoning: v.reasoning,
    source_agent: "content_sync_loop",
    source_moment_type: "song_release",
    source_song_id: songId,
    batch_id: director.batch_id,
    status: "suggested" as const,
  }));
  if (rows.length > 0) {
    await admin.from("content_moments").insert(rows);
  }

  // Upsert the release_plan — preserve existing user-entered fields
  // (distributor, release_date, isrc, etc.) if the row already exists.
  const { data: existing } = await admin
    .from("release_plan")
    .select("id, checklist")
    .eq("song_id", songId)
    .maybeSingle();

  const now = new Date().toISOString();
  let releasePlanId: string;
  if (existing) {
    releasePlanId = existing.id;
    await admin
      .from("release_plan")
      .update({
        checklist:
          Array.isArray(existing.checklist) && existing.checklist.length > 0
            ? existing.checklist
            : DEFAULT_CHECKLIST,
        content_moments_planned: rows.length,
        last_orchestrated_at: now,
        last_batch_id: director.batch_id,
      })
      .eq("id", releasePlanId);
  } else {
    const { data: inserted, error } = await admin
      .from("release_plan")
      .insert({
        song_id: songId,
        checklist: DEFAULT_CHECKLIST,
        content_moments_planned: rows.length,
        last_orchestrated_at: now,
        last_batch_id: director.batch_id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    releasePlanId = inserted!.id;
  }

  return {
    ok: true,
    batch_id: director.batch_id,
    content_moments_planned: rows.length,
    release_plan_id: releasePlanId,
    tokensUsed: director.tokensUsed,
    durationMs: Date.now() - start,
  };
}
