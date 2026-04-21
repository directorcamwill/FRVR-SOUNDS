"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Radio, Target, Film } from "lucide-react";
import type { Song, SongMetadata, BrandFitStatusSummary } from "@/types/song";
import { matchPlacements, type SongFeatures } from "@/lib/placement-matcher";

type SongWithJoins = Song & {
  song_metadata?: SongMetadata | SongMetadata[] | null;
  brand_fit_status?: BrandFitStatusSummary | null;
};

function firstMetadata(
  meta: SongMetadata | SongMetadata[] | null | undefined
): SongMetadata | null {
  if (!meta) return null;
  if (Array.isArray(meta)) return meta[0] ?? null;
  return meta;
}

function latestSyncScore(
  scores:
    | Array<{ overall_score: number; created_at: string }>
    | null
    | undefined
) {
  if (!scores || scores.length === 0) return null;
  return scores.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b
  );
}

function Meter({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint?: string;
}) {
  const display = value == null ? "—" : value.toString();
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`size-3.5 ${accent}`} />
        <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white tabular-nums">
          {display}
        </span>
        {value != null && (
          <span className="text-[10px] text-[#666]">/ 100</span>
        )}
      </div>
      <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden mt-1.5">
        <div
          className={`h-full transition-all ${
            accent.includes("red")
              ? "bg-[#DC2626]"
              : accent.includes("emerald")
                ? "bg-emerald-500"
                : accent.includes("amber")
                  ? "bg-amber-500"
                  : "bg-[#DC2626]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && (
        <p className="text-[10px] text-[#666] mt-1 truncate" title={hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TrackAnalysisHeader({ song }: { song: SongWithJoins }) {
  const meta = firstMetadata(song.song_metadata);
  const syncScore = latestSyncScore(song.sync_scores);
  const brandFit = song.brand_fit_status;

  const topMatch = useMemo(() => {
    const features: SongFeatures = {
      genre: meta?.genre,
      sub_genre: (meta as { sub_genre?: string | null })?.sub_genre ?? null,
      moods: meta?.moods ?? [],
      bpm: meta?.bpm,
      key: meta?.key,
      vocal_type: (meta as { vocal_type?: string | null })?.vocal_type ?? null,
    };
    const ms = matchPlacements(features, 5);
    return ms[0] ?? null;
  }, [meta]);

  const syncValue = syncScore ? Math.round(syncScore.overall_score) : null;
  const brandValue = brandFit?.overall_score ?? null;
  const placementValue = topMatch ? topMatch.score : null;

  const metadataTags: string[] = [];
  if (meta?.genre) metadataTags.push(meta.genre);
  if (meta?.bpm) metadataTags.push(`${meta.bpm} BPM`);
  if (meta?.key) metadataTags.push(meta.key);
  if (meta?.moods && meta.moods.length > 0)
    metadataTags.push(`${meta.moods.length} moods`);

  return (
    <Card className="bg-gradient-to-br from-[#0B0B0B] to-[#111]">
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#666]">
              Track Analysis
            </p>
            <h2 className="text-lg font-bold text-white">{song.title}</h2>
          </div>
          {metadataTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {metadataTags.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-[10px] bg-[#111]"
                >
                  {t}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30"
            >
              Metadata missing
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <Meter
            label="Brand Fit"
            value={brandValue}
            icon={Palette}
            accent="text-[#DC2626]"
            hint={
              brandFit
                ? `${brandFit.alignment_tier ?? ""} alignment`
                : "Run Brand Fit"
            }
          />
          <Meter
            label="Sync Readiness"
            value={syncValue}
            icon={Radio}
            accent="text-[#DC2626]"
            hint={
              syncScore
                ? `Last scored ${new Date(syncScore.created_at).toLocaleDateString()}`
                : "Not yet scored"
            }
          />
          <Meter
            label="Top Placement Match"
            value={placementValue}
            icon={Film}
            accent="text-[#DC2626]"
            hint={
              topMatch
                ? `${topMatch.placement.track_title} · ${topMatch.placement.show_or_film}`
                : "No matches yet"
            }
          />
          <Meter
            label="Metadata Depth"
            value={
              metadataTags.length > 0
                ? Math.min(
                    100,
                    metadataTags.length * 25 +
                      ((meta?.moods?.length ?? 0) >= 3 ? 10 : 0)
                  )
                : 0
            }
            icon={Target}
            accent="text-[#DC2626]"
            hint={`${metadataTags.length} tags filled`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
