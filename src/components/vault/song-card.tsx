"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { SyncReadinessMeter } from "@/components/vault/sync-readiness-meter";
import { Music, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/song";

interface SongCardProps {
  song: Song;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SongCard({ song }: SongCardProps) {
  const metadata = Array.isArray(song.song_metadata)
    ? song.song_metadata[0]
    : song.song_metadata;
  const latestScore = song.sync_scores?.length
    ? song.sync_scores.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      )
    : null;

  const statusColor =
    song.status === "active"
      ? "bg-emerald-400"
      : song.status === "draft"
        ? "bg-amber-400"
        : "bg-[#555]";

  return (
    <Link href={`/vault/${song.id}`}>
      <Card className="hover:ring-[#DC2626]/30 transition-all cursor-pointer group">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A]">
                <Music className="size-5 text-[#555]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("size-2 rounded-full shrink-0", statusColor)}
                  />
                  <h3 className="font-medium text-white truncate">
                    {song.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {metadata?.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {metadata.genre}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-[#A3A3A3]">
                    <Clock className="size-3" />
                    {formatDuration(song.duration_seconds)}
                  </span>
                </div>
              </div>
            </div>
            {latestScore && (
              <ScoreBadge score={latestScore.overall_score} size="sm" />
            )}
          </div>
          <SyncReadinessMeter song={song} variant="compact" />
        </CardContent>
      </Card>
    </Link>
  );
}
