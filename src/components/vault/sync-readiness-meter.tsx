"use client";

import { cn } from "@/lib/utils";
import type { SongMetadata, Stem, SyncScore } from "@/types/song";

/**
 * Sync Readiness — pure, deterministic computation over a song + its children.
 *
 * Does not fetch. Safe to call in list views. Accepts any object with the
 * minimum shape below so it can be fed by Song, OpportunityMatch.song, or a
 * custom server projection — whichever the caller has in hand.
 *
 * Surfaces via <SyncReadinessMeter>. The `compact` variant is a tiny strip
 * suitable for list cards; the `full` variant shows the blocker list inline.
 */

export interface ReadinessSubject {
  duration_seconds?: number | null;
  song_metadata?: SongMetadata | SongMetadata[] | null;
  stems?: Stem[];
  sync_scores?: SyncScore[];
}

export interface ReadinessInput {
  song: ReadinessSubject;
  splitsComplete?: boolean | null;
  hasArtifactMaster?: boolean | null;
}

export interface ReadinessResult {
  percent: number;
  tier: "low" | "mid" | "high";
  blockers: string[];
  passed: string[];
}

const WEIGHTS = {
  basicMetadata: 20,
  duration: 5,
  vocalCoverage: 10,
  instrumentalAvailable: 10,
  stemsPresent: 10,
  syncScore: 15,
  sceneTags: 10,
  cutdownPoints: 10,
  dialogueSafe: 5,
  splitsComplete: 5,
} as const;

function firstMetadata(song: ReadinessSubject): SongMetadata | null {
  const meta = song.song_metadata;
  if (!meta) return null;
  if (Array.isArray(meta)) return meta[0] ?? null;
  return meta;
}

export function computeSyncReadiness(input: ReadinessInput): ReadinessResult {
  const { song, splitsComplete, hasArtifactMaster } = input;
  const meta = firstMetadata(song);
  const stems = song.stems ?? [];
  const latestScore = song.sync_scores?.length
    ? song.sync_scores.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      )
    : null;

  let score = 0;
  const blockers: string[] = [];
  const passed: string[] = [];

  const basicMetadataOk = !!(
    meta?.genre &&
    meta.moods.length > 0 &&
    meta.bpm &&
    meta.key
  );
  if (basicMetadataOk) {
    score += WEIGHTS.basicMetadata;
    passed.push("Core metadata (genre / moods / BPM / key)");
  } else {
    blockers.push("Fill core metadata (genre, moods, BPM, key)");
  }

  if (song.duration_seconds != null) {
    score += WEIGHTS.duration;
    passed.push("Duration captured");
  } else {
    blockers.push("Duration missing");
  }

  const vocalCoverageOk = meta
    ? meta.has_vocals
      ? meta.lyrics_themes.length > 0
      : true
    : false;
  if (vocalCoverageOk) {
    score += WEIGHTS.vocalCoverage;
    passed.push(
      meta?.has_vocals ? "Lyrical themes documented" : "Marked instrumental"
    );
  } else {
    blockers.push(
      meta?.has_vocals
        ? "Document at least one lyrical theme"
        : "Set vocals / instrumental flag"
    );
  }

  if (meta?.instrumental_available) {
    score += WEIGHTS.instrumentalAvailable;
    passed.push("Instrumental available");
  } else {
    blockers.push("Instrumental version not marked available");
  }

  if (stems.length > 0 || hasArtifactMaster) {
    score += WEIGHTS.stemsPresent;
    passed.push(hasArtifactMaster ? "Master uploaded" : "Stems uploaded");
  } else {
    blockers.push("Upload stems or a master");
  }

  if (latestScore && latestScore.overall_score >= 70) {
    score += WEIGHTS.syncScore;
    passed.push(`Sync score ${latestScore.overall_score}/100`);
  } else if (latestScore) {
    blockers.push(`Sync score is ${latestScore.overall_score} — raise to 70+`);
  } else {
    blockers.push("Run the sync scoring engine");
  }

  const sceneTags = meta?.scene_tags ?? [];
  if (sceneTags.length >= 3) {
    score += WEIGHTS.sceneTags;
    passed.push("Scene tags set");
  } else {
    blockers.push("Add at least 3 scene tags");
  }

  const cutdowns = meta?.cutdown_points ?? [];
  if (cutdowns.length >= 1) {
    score += WEIGHTS.cutdownPoints;
    passed.push("Cutdown points marked");
  } else {
    blockers.push("Mark at least one cutdown point");
  }

  if (meta?.dialogue_safe_score != null) {
    score += WEIGHTS.dialogueSafe;
    passed.push("Dialogue-safe scored");
  } else {
    blockers.push("Score dialogue-safe passages");
  }

  if (splitsComplete) {
    score += WEIGHTS.splitsComplete;
    passed.push("Split sheet complete");
  } else if (splitsComplete === false) {
    blockers.push("Complete the split sheet");
  }

  const percent = Math.min(100, Math.max(0, Math.round(score)));
  const tier: ReadinessResult["tier"] =
    percent >= 85 ? "high" : percent >= 60 ? "mid" : "low";

  return { percent, tier, blockers, passed };
}

const TIER_STYLES = {
  high: {
    bar: "bg-emerald-500",
    text: "text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
  },
  mid: {
    bar: "bg-[#c0c8d8]",
    text: "text-[#c0c8d8]",
    dot: "bg-[#c0c8d8]",
    border: "border-[#c0c8d8]/30",
    bg: "bg-[#c0c8d8]/5",
  },
  low: {
    bar: "bg-red-500",
    text: "text-red-300",
    dot: "bg-red-500",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
  },
} as const;

export function SyncReadinessMeter({
  song,
  splitsComplete,
  hasArtifactMaster,
  variant = "full",
  className,
}: {
  song: ReadinessSubject;
  splitsComplete?: boolean | null;
  hasArtifactMaster?: boolean | null;
  variant?: "compact" | "full";
  className?: string;
}) {
  const { percent, tier, blockers, passed } = computeSyncReadiness({
    song,
    splitsComplete,
    hasArtifactMaster,
  });

  const styles = TIER_STYLES[tier];

  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        title={`Sync readiness: ${percent}% — ${blockers.length} blocker${blockers.length === 1 ? "" : "s"}`}
      >
        <span className={cn("size-1.5 rounded-full shrink-0", styles.dot)} />
        <div className="h-1 w-16 rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full motion-safe:transition-all motion-safe:duration-500",
              styles.bar
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums uppercase tracking-wider",
            styles.text
          )}
        >
          {percent}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full shrink-0", styles.dot)} />
          <h4 className="text-sm font-medium text-white">Sync Readiness</h4>
        </div>
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            styles.text
          )}
        >
          {percent}%
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full motion-safe:transition-all motion-safe:duration-700",
            styles.bar
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {blockers.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
            {blockers.length} blocker{blockers.length === 1 ? "" : "s"}
          </p>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li
                key={i}
                className="text-xs text-[#A3A3A3] flex items-start gap-2"
              >
                <span className="mt-1 size-1 rounded-full bg-red-500/60 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {blockers.length === 0 && passed.length > 0 && (
        <p className="text-xs text-emerald-400">
          Ready to submit. All readiness checks passing.
        </p>
      )}
    </div>
  );
}
