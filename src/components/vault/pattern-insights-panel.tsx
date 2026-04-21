"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { matchPlacements, type SongFeatures } from "@/lib/placement-matcher";
import { analyzeMatches } from "@/lib/pattern-intelligence";

export function PatternInsightsPanel({
  song,
}: {
  song: {
    song_metadata?:
      | { genre: string | null; moods: string[] | null; bpm: number | null; key: string | null; vocal_type?: string | null; sub_genre?: string | null }
      | Array<{ genre: string | null; moods: string[] | null; bpm: number | null; key: string | null; vocal_type?: string | null; sub_genre?: string | null }>
      | null;
  };
}) {
  const insights = useMemo(() => {
    const raw = song.song_metadata;
    const m = Array.isArray(raw) ? raw[0] : raw;
    const features: SongFeatures = {
      genre: m?.genre,
      sub_genre: m?.sub_genre ?? null,
      moods: m?.moods ?? [],
      bpm: m?.bpm,
      key: m?.key,
      vocal_type: m?.vocal_type ?? null,
    };
    const matches = matchPlacements(features, 5);
    return analyzeMatches(matches);
  }, [song.song_metadata]);

  if (insights.count === 0) {
    return (
      <Card>
        <CardContent className="py-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="size-4 text-[#DC2626]" />
            Pattern Intelligence
          </h3>
          <p className="text-[11px] text-[#A3A3A3]">
            Fill song metadata to see what patterns emerge across your closest
            real placements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="size-4 text-[#DC2626]" />
          Pattern Intelligence
          <Badge variant="outline" className="text-[9px] ml-1 bg-[#111]">
            Across {insights.count} matches
          </Badge>
        </h3>

        {insights.takeaways.length > 0 && (
          <div className="space-y-1.5">
            {insights.takeaways.map((t, i) => (
              <div
                key={i}
                className="text-[11px] text-[#D4D4D4] leading-relaxed flex gap-2"
              >
                <span className="text-[#DC2626] shrink-0">·</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1A1A1A]">
          {insights.dominantPlacementType && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#666] mb-0.5">
                Placement Type
              </p>
              <p className="text-xs text-white font-medium">
                {insights.dominantPlacementType.value}
              </p>
              <p className="text-[10px] text-[#A3A3A3]">
                {insights.dominantPlacementType.detail}
              </p>
            </div>
          )}
          {insights.dominantPlatform && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#666] mb-0.5">
                Platform
              </p>
              <p className="text-xs text-white font-medium">
                {insights.dominantPlatform.value}
              </p>
              <p className="text-[10px] text-[#A3A3A3]">
                {insights.dominantPlatform.detail}
              </p>
            </div>
          )}
          {insights.bpmRange && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#666] mb-0.5">
                BPM Range
              </p>
              <p className="text-xs text-white font-medium tabular-nums">
                {insights.bpmRange.min}–{insights.bpmRange.max}
              </p>
              <p className="text-[10px] text-[#A3A3A3]">
                median {insights.bpmRange.median}
              </p>
            </div>
          )}
          {insights.keyModeBreakdown &&
            insights.keyModeBreakdown.minor + insights.keyModeBreakdown.major > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#666] mb-0.5">
                  Key Mode
                </p>
                <p className="text-xs text-white font-medium">
                  {insights.keyModeBreakdown.minor >= insights.keyModeBreakdown.major
                    ? "Minor"
                    : "Major"}{" "}
                  dominant
                </p>
                <p className="text-[10px] text-[#A3A3A3] tabular-nums">
                  {insights.keyModeBreakdown.minor}m · {insights.keyModeBreakdown.major} maj
                </p>
              </div>
            )}
        </div>

        {insights.commonMoods.length > 0 && (
          <div className="pt-2 border-t border-[#1A1A1A]">
            <p className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5">
              Shared moods ({insights.commonMoods.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.commonMoods.map((m) => (
                <Badge
                  key={m.value}
                  variant="outline"
                  className="text-[10px] bg-[#111] capitalize"
                >
                  {m.value}{" "}
                  <span className="text-[#666] ml-1">
                    {Math.round(m.coverage * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
