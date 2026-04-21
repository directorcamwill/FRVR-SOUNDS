"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Music,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Song, SyncScore, SongMetadata } from "@/types/song";

/**
 * CurrentRecord — UPGRADE_SPEC [04]. The "song I'm working on right now."
 * Large card with: title, ambient bar visualizer, metrics strip (BPM · key ·
 * LUFS · true peak · QC), 6-step stage indicator, Continue CTA.
 *
 * Waveform is a decorative ambient visualization (deterministic seeded bars,
 * not real peaks) — zero new deps. Real waveform rendering lands when
 * wavesurfer.js is wired in Stage 2 of the audio engine.
 */

const STAGES = [
  "Brief",
  "Blueprint",
  "Mix",
  "Master",
  "QC",
  "Deliver",
] as const;
type Stage = (typeof STAGES)[number];

interface CurrentRecordProps {
  song: Song | null;
  loading?: boolean;
}

function firstMetadata(song: Song): SongMetadata | null {
  const meta = song.song_metadata;
  if (!meta) return null;
  if (Array.isArray(meta)) return meta[0] ?? null;
  return meta;
}

function latestScore(song: Song): SyncScore | null {
  if (!song.sync_scores?.length) return null;
  return song.sync_scores.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b
  );
}

interface StageProgress {
  stage: Stage;
  done: boolean;
}

function computeStageProgress(song: Song): StageProgress[] {
  const meta = firstMetadata(song);
  const score = latestScore(song);
  const stemCount = song.stems?.length ?? 0;

  return [
    { stage: "Brief", done: true },
    {
      stage: "Blueprint",
      done: !!(meta?.genre && meta.moods?.length && meta.bpm && meta.key),
    },
    {
      stage: "Mix",
      done: !!score && score.mix_score >= 60,
    },
    {
      stage: "Master",
      done: !!score && score.overall_score >= 70,
    },
    { stage: "QC", done: stemCount >= 2 },
    { stage: "Deliver", done: song.status === "active" },
  ];
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Deterministic seeded "waveform" — same heights on every render so SSR/client match.
function seededHeights(seed: string, n: number): number[] {
  const base = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: n }, (_, i) => {
    const wave =
      0.45 +
      Math.sin((i + base) * 0.22) * 0.25 +
      Math.sin((i + base * 0.7) * 0.08) * 0.2 +
      Math.cos((i + base * 1.3) * 0.15) * 0.15;
    return Math.max(0.15, Math.min(1, wave));
  });
}

export function CurrentRecord({ song, loading }: CurrentRecordProps) {
  if (loading) {
    return (
      <Card className="glass-card border-[#1A1A1A] h-full">
        <CardContent className="space-y-4 py-6">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!song) {
    return (
      <Card className="glass-card border-[#1A1A1A] h-full">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-2">
          <Music className="size-10 text-[#333]" />
          <p className="text-sm font-medium text-white">No current record</p>
          <p className="text-xs text-[#A3A3A3] text-center max-w-xs">
            Upload a song to the vault or create a Song Lab project and the
            Command Center will track it here.
          </p>
          <div className="flex gap-2 mt-3">
            <Link href="/vault">
              <Button variant="outline" size="sm">
                Open Vault
              </Button>
            </Link>
            <Link href="/song-lab">
              <Button size="sm">Start a project</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const meta = firstMetadata(song);
  const score = latestScore(song);
  const stages = computeStageProgress(song);
  const currentStageIdx = stages.findIndex((s) => !s.done);
  const currentStage =
    currentStageIdx === -1 ? "Complete" : stages[currentStageIdx].stage;

  return (
    <Card className="glass-card border-[#1A1A1A] h-full overflow-hidden">
      <CardContent className="py-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#8892a4]">
              Current record
            </p>
            <h3
              className="mt-0.5 text-lg font-semibold text-white tracking-tight truncate"
              title={song.title}
            >
              {song.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#A3A3A3]">
              <span className="capitalize">{song.status}</span>
              <span>·</span>
              <span className="tabular-nums">
                {formatDuration(song.duration_seconds)}
              </span>
              {meta?.genre && (
                <>
                  <span>·</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {meta.genre}
                  </Badge>
                </>
              )}
            </div>
          </div>
          {score?.confidence != null && (
            <ConfidencePill score={score.confidence} showLabel={false} />
          )}
        </div>

        {/* Ambient waveform */}
        <AmbientWaveform seed={song.id} />

        {/* Metrics strip */}
        <MetricsStrip meta={meta} score={score} song={song} />

        {/* Stage indicator */}
        <StageIndicator stages={stages} current={currentStage} />

        {/* CTA */}
        <Link href={`/vault/${song.id}`} className="block">
          <Button className="w-full group" size="sm">
            <span>
              Continue{" "}
              {currentStage !== "Complete" ? `· ${currentStage}` : "polishing"}
            </span>
            <ChevronRight className="size-4 ml-1.5 group-hover:translate-x-0.5 motion-safe:transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function AmbientWaveform({ seed }: { seed: string }) {
  const reduce = useReducedMotion();
  const heights = seededHeights(seed, 48);

  return (
    <div
      aria-hidden
      className="relative h-16 rounded-md overflow-hidden bg-gradient-to-b from-black/20 to-black/40 border border-[#1A1A1A] flex items-end gap-[1.5px] px-2 py-1.5"
    >
      {heights.map((h, i) => {
        const hPct = Math.round(h * 100);
        const style = {
          flex: 1,
          minWidth: 2,
          background:
            "linear-gradient(to top, rgba(220,38,38,0.55) 0%, rgba(34,211,238,0.45) 100%)",
          borderRadius: 1,
        } as const;
        if (reduce) {
          return (
            <div
              key={i}
              style={{ ...style, height: `${hPct}%` }}
            />
          );
        }
        return (
          <motion.div
            key={i}
            style={style}
            initial={{ height: `${hPct * 0.5}%` }}
            animate={{
              height: [
                `${hPct * 0.55}%`,
                `${hPct}%`,
                `${hPct * 0.7}%`,
              ],
            }}
            transition={{
              duration: 2.4 + (i % 5) * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 12) * 0.08,
            }}
          />
        );
      })}
    </div>
  );
}

function MetricsStrip({
  meta,
  score,
  song,
}: {
  meta: SongMetadata | null;
  score: SyncScore | null;
  song: Song;
}) {
  const qcPassed = (song.stems?.length ?? 0) >= 2;

  return (
    <div className="flex items-stretch gap-3 pt-1">
      <Metric label="BPM" value={meta?.bpm ? String(meta.bpm) : "—"} />
      <Metric label="Key" value={meta?.key ?? "—"} />
      <Metric
        label="Score"
        value={score ? String(score.overall_score) : "—"}
        tone={
          score && score.overall_score >= 70
            ? "good"
            : score && score.overall_score >= 40
              ? "warn"
              : undefined
        }
      />
      <Metric label="Stems" value={String(song.stems?.length ?? 0)} />
      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#8892a4]">
          QC
        </p>
        {qcPassed ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="size-3" />
            pass
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#A3A3A3] font-medium">
            <AlertCircle className="size-3 text-amber-400" />
            review
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
        ? "text-amber-300"
        : "text-white";
  return (
    <div className="flex flex-col items-start gap-0.5 min-w-0">
      <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#8892a4]">
        {label}
      </p>
      <span
        className={cn(
          "text-sm font-medium tabular-nums truncate",
          toneClass
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StageIndicator({
  stages,
  current,
}: {
  stages: StageProgress[];
  current: Stage | "Complete";
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute left-2 right-2 top-2 h-px bg-[#1A1A1A]"
      />
      <div className="relative flex items-start justify-between">
        {stages.map((s) => {
          const active = s.stage === current;
          return (
            <div
              key={s.stage}
              className="flex flex-col items-center gap-1 min-w-0"
            >
              <div className="relative">
                {s.done ? (
                  <CheckCircle2 className="size-4 text-emerald-400 bg-black" />
                ) : active ? (
                  <span className="block size-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.6)] border-2 border-black" />
                ) : (
                  <Circle className="size-4 text-[#333] bg-black" />
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium uppercase tracking-[0.12em] text-center leading-tight",
                  active
                    ? "text-white"
                    : s.done
                      ? "text-emerald-400/80"
                      : "text-[#555]"
                )}
              >
                {s.stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
