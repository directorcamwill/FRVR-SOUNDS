"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Film, Target } from "lucide-react";
import {
  matchPlacements,
  type PlacementMatch,
  type SongFeatures,
} from "@/lib/placement-matcher";
import type { Placement } from "@/lib/placements";

// Surfaces the closest real placements to a vault song — a concrete
// "your song lives here" signal driven entirely by metadata similarity.
// No LLM. If the song has no metadata, renders a prompt to fill it.

export function PlacementMatchesPanel({
  song,
}: {
  song: {
    id: string;
    title: string;
    song_metadata?:
      | { genre: string | null; sub_genre?: string | null; moods: string[] | null; bpm: number | null; key: string | null; vocal_type?: string | null }
      | Array<{ genre: string | null; sub_genre?: string | null; moods: string[] | null; bpm: number | null; key: string | null; vocal_type?: string | null }>
      | null;
  };
}) {
  const [open, setOpen] = useState<Placement | null>(null);

  const features: SongFeatures = useMemo(() => {
    const raw = song.song_metadata;
    const m = Array.isArray(raw) ? raw[0] : raw;
    if (!m) return {};
    return {
      genre: m.genre,
      sub_genre: m.sub_genre ?? null,
      moods: m.moods ?? [],
      bpm: m.bpm,
      key: m.key,
      vocal_type: m.vocal_type ?? null,
    };
  }, [song.song_metadata]);

  const hasSignal =
    !!features.genre ||
    (features.moods?.length ?? 0) > 0 ||
    !!features.bpm ||
    !!features.key;

  const matches: PlacementMatch[] = useMemo(
    () => (hasSignal ? matchPlacements(features, 5) : []),
    [features, hasSignal]
  );

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="size-4 text-[#DC2626]" />
            Closest Real Placements
          </h3>
          <Link
            href="/placements"
            className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold hover:text-red-300"
          >
            Browse all →
          </Link>
        </div>

        {!hasSignal && (
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
            Add genre, moods, BPM, or key in the Metadata panel above to match
            this song against real placements.
          </p>
        )}

        {hasSignal && matches.length === 0 && (
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
            No close matches yet — try broader moods or confirm the genre tag
            is one the industry uses (e.g. &quot;Indie Folk&quot; vs
            &quot;Folk&quot;).
          </p>
        )}

        {matches.length > 0 && (
          <div className="space-y-2">
            {matches.map((m) => (
              <button
                key={m.placement.id}
                onClick={() => setOpen(m.placement)}
                className="w-full text-left rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3 hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {m.placement.track_title}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3] truncate">
                      {m.placement.artist} · {m.placement.show_or_film}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold text-[#DC2626] tabular-nums leading-none">
                      {m.score}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[#666]">
                      match
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                  >
                    {m.placement.placement_type}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-[#111]">
                    {m.placement.platform}
                  </Badge>
                </div>

                <div className="mt-2 space-y-0.5">
                  {m.reasons.slice(0, 3).map((r, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-[#A3A3A3] flex gap-2"
                    >
                      <span className="text-[#DC2626]">·</span>
                      <span>{r.detail}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Film className="size-4 text-[#DC2626]" />
                  {open.track_title}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#A3A3A3]">
                  {open.artist}
                  {open.year_of_track ? ` (${open.year_of_track})` : ""} ·
                  Placed in {open.year_of_placement}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                  >
                    {open.placement_type}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-[#111]">
                    {open.platform}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-[#111]">
                    {open.genre}
                  </Badge>
                  {open.bpm && (
                    <Badge variant="outline" className="text-[10px] bg-[#111]">
                      {open.bpm} BPM
                    </Badge>
                  )}
                  {open.key && (
                    <Badge variant="outline" className="text-[10px] bg-[#111]">
                      {open.key}
                    </Badge>
                  )}
                </div>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Placed in
                  </p>
                  <p className="text-sm text-white font-medium">
                    {open.show_or_film}
                  </p>
                  {open.episode_or_scene && (
                    <p className="text-[11px] text-[#A3A3A3]">
                      {open.episode_or_scene}
                    </p>
                  )}
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Scene
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {open.scene_description}
                  </p>
                </section>

                <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                    Why it worked
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {open.why_it_worked}
                  </p>
                </section>

                <section className="border-l-2 border-[#DC2626] pl-4 py-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-1">
                    Lesson for your catalog
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {open.lesson}
                  </p>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
