"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Film, Search } from "lucide-react";
import {
  PLACEMENTS,
  PLACEMENT_TYPES,
  PLATFORMS,
  type Placement,
  type PlacementType,
  type PlatformType,
} from "@/lib/placements";

export default function PlacementsPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<PlacementType | "All">("All");
  const [activePlatform, setActivePlatform] = useState<PlatformType | "All">(
    "All"
  );
  const [open, setOpen] = useState<Placement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACEMENTS.filter((p) => {
      if (activeType !== "All" && p.placement_type !== activeType) return false;
      if (activePlatform !== "All" && p.platform !== activePlatform)
        return false;
      if (!q) return true;
      const hay = [
        p.track_title,
        p.artist,
        p.show_or_film,
        p.genre,
        p.scene_description,
        p.why_it_worked,
        p.lesson,
        ...(p.mood ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeType, activePlatform]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of PLACEMENTS) c[p.placement_type] = (c[p.placement_type] ?? 0) + 1;
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#DC2626]/10 p-2 border border-[#DC2626]/30">
          <Film className="size-5 text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Placement Reference</h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mt-1">
            Real sync placements broken down — what got chosen, why it worked,
            and the lesson for your catalog. Each entry teaches a pattern you
            can apply to your own pitches.
          </p>
          <p className="text-[11px] text-[#666] mt-2">
            {PLACEMENTS.length} curated placements across{" "}
            {Object.keys(typeCounts).length} placement types. Click any card
            for the full breakdown.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#666]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artist, show, scene, genre, mood..."
          className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider text-[#666]">
            Placement type:
          </span>
          <button
            onClick={() => setActiveType("All")}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              activeType === "All"
                ? "bg-[#DC2626] text-white border-[#DC2626]"
                : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
            }`}
          >
            All
          </button>
          {PLACEMENT_TYPES.filter((t) => typeCounts[t]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                activeType === t
                  ? "bg-[#DC2626] text-white border-[#DC2626]"
                  : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
              }`}
            >
              {t} ({typeCounts[t]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider text-[#666]">
            Platform:
          </span>
          <button
            onClick={() => setActivePlatform("All")}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              activePlatform === "All"
                ? "bg-[#DC2626] text-white border-[#DC2626]"
                : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
            }`}
          >
            All
          </button>
          {PLATFORMS.filter((p) => PLACEMENTS.some((pl) => pl.platform === p)).map(
            (p) => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                  activePlatform === p
                    ? "bg-[#DC2626] text-white border-[#DC2626]"
                    : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
      </div>

      <div className="text-xs text-[#666]">
        {filtered.length}{" "}
        {filtered.length === 1 ? "placement" : "placements"}
        {query && ` matching "${query}"`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpen(p)}
            className="text-left"
          >
            <Card className="hover:border-[#DC2626]/40 transition-colors h-full cursor-pointer">
              <CardContent className="py-4 space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    {p.track_title}
                  </h3>
                  <p className="text-sm text-[#A3A3A3]">{p.artist}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                  >
                    {p.placement_type}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-[#111]">
                    {p.platform}
                  </Badge>
                  {p.bpm && (
                    <Badge variant="outline" className="text-[9px] bg-[#111]">
                      {p.bpm} BPM
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-0.5">
                    Placed in
                  </p>
                  <p className="text-sm text-white font-medium">
                    {p.show_or_film}
                  </p>
                  {p.episode_or_scene && (
                    <p className="text-[11px] text-[#8892a4]">
                      {p.episode_or_scene}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-0.5">
                    Mood
                  </p>
                  <p className="text-[11px] text-[#A3A3A3]">
                    {p.mood.join(" · ")}
                  </p>
                </div>

                <div className="border-l-2 border-[#DC2626]/50 pl-3 py-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-0.5">
                    Lesson
                  </p>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-3">
                    {p.lesson}
                  </p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-sm text-[#666]">
            No placements match your filters.
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {open.track_title}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#A3A3A3]">
                  {open.artist}
                  {open.year_of_track ? ` (${open.year_of_track})` : ""} ·
                  Placed in {open.year_of_placement}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
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
                    {open.sub_genre ? ` · ${open.sub_genre}` : ""}
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
                  {open.vocal_type && (
                    <Badge variant="outline" className="text-[10px] bg-[#111]">
                      {open.vocal_type}
                    </Badge>
                  )}
                </div>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Placed in
                  </p>
                  <p className="text-base text-white font-semibold">
                    {open.show_or_film}
                  </p>
                  {open.episode_or_scene && (
                    <p className="text-sm text-[#A3A3A3]">
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

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                    Key sync features
                  </p>
                  <ul className="space-y-1">
                    {open.key_sync_features.map((f, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#D4D4D4] leading-relaxed flex gap-2"
                      >
                        <span className="text-[#DC2626]">·</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {(open.structure || open.instrumentation) && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {open.structure && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                          Structure
                        </p>
                        <p className="text-sm text-[#D4D4D4] leading-relaxed">
                          {open.structure}
                        </p>
                      </div>
                    )}
                    {open.instrumentation && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                          Instrumentation
                        </p>
                        <p className="text-sm text-[#D4D4D4] leading-relaxed">
                          {open.instrumentation.join(" · ")}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                <section className="border-l-2 border-[#DC2626] pl-4 py-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-1">
                    Lesson for your catalog
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {open.lesson}
                  </p>
                </section>

                {open.similar_tracks && open.similar_tracks.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                      Similar in spirit
                    </p>
                    <ul className="space-y-0.5">
                      {open.similar_tracks.map((s) => (
                        <li key={s} className="text-sm text-[#A3A3A3]">
                          · {s}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
