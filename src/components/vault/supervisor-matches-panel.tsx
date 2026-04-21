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
import { ExternalLink, ShieldCheck, UserRound } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Supervisor as SupervisorType } from "@/lib/supervisors";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function SocialPills({ s }: { s: SupervisorType }) {
  const links: Array<{ href: string; label: string; pill: string }> = [];
  if (s.company_url)
    links.push({ href: s.company_url, label: "Website", pill: "Web" });
  if (s.instagram_url)
    links.push({ href: s.instagram_url, label: "Instagram", pill: "IG" });
  if (s.linkedin_url)
    links.push({ href: s.linkedin_url, label: "LinkedIn", pill: "LI" });
  if (s.twitter_url)
    links.push({ href: s.twitter_url, label: "Twitter / X", pill: "X" });
  if (s.guild_profile_url)
    links.push({
      href: s.guild_profile_url,
      label: "Guild profile",
      pill: "Guild",
    });
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={l.label}
          title={l.label}
          className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#1A1A1A] bg-[#111] text-[#A3A3A3] hover:text-white hover:border-[#DC2626]/50 transition-colors"
        >
          {l.pill}
        </Link>
      ))}
    </div>
  );
}
import {
  matchSupervisors,
  type SupervisorMatch,
} from "@/lib/supervisor-matcher";
import type { Supervisor } from "@/lib/supervisors";
import type { SongFeatures } from "@/lib/placement-matcher";

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function SupervisorMatchesPanel({
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
  const [open, setOpen] = useState<Supervisor | null>(null);

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

  const hasSignal = !!features.genre || (features.moods?.length ?? 0) > 0;

  const matches: SupervisorMatch[] = useMemo(
    () =>
      hasSignal
        ? matchSupervisors({ features, placement_intent: "sync" }, 5)
        : [],
    [features, hasSignal]
  );

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserRound className="size-4 text-[#DC2626]" />
            Matching Music Supervisors
          </h3>
          <Link
            href="/supervisors"
            className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold hover:text-red-300"
          >
            Browse all →
          </Link>
        </div>

        {!hasSignal && (
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
            Add genre or moods in the Metadata panel to surface matching
            supervisors based on their known taste + formats.
          </p>
        )}

        {hasSignal && matches.length === 0 && (
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
            No strong matches in the current supervisor set. Try broader genre
            tags or expand the curated list.
          </p>
        )}

        {matches.length > 0 && (
          <div className="space-y-2">
            {matches.map((m) => (
              <button
                key={m.supervisor.id}
                onClick={() => setOpen(m.supervisor)}
                className="w-full text-left rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3 hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Avatar size="default" className="shrink-0">
                    {m.supervisor.photo_url && (
                      <AvatarImage
                        src={m.supervisor.photo_url}
                        alt={m.supervisor.name}
                      />
                    )}
                    <AvatarFallback className="bg-[#1A1A1A] text-[#DC2626] text-[10px] font-semibold">
                      {initialsFor(m.supervisor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-white">
                        {m.supervisor.name}
                      </p>
                      {m.supervisor.guild_member && (
                        <ShieldCheck className="size-3 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#A3A3A3] truncate">
                      {m.supervisor.notable_projects
                        .slice(0, 2)
                        .map((p) => p.title)
                        .join(" · ")}
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
                  {m.supervisor.formats.slice(0, 2).map((f) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>

                <div className="mt-2 space-y-0.5">
                  {m.reasons.map((r, i) => (
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
                <div className="flex items-start gap-3">
                  <Avatar size="lg" className="shrink-0 size-12">
                    {open.photo_url && <AvatarImage src={open.photo_url} alt={open.name} />}
                    <AvatarFallback className="bg-[#1A1A1A] text-[#DC2626] text-base font-semibold">
                      {initialsFor(open.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                      {open.name}
                      {open.guild_member && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 pl-1.5"
                        >
                          <ShieldCheck className="size-3" />
                          Guild Verified
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      {open.role}
                      {open.company ? ` · ${open.company}` : ""}
                    </DialogDescription>
                    <div className="mt-2">
                      <SocialPills s={open} />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {open.formats.map((f) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-[#D4D4D4] leading-relaxed">
                  {open.style_notes}
                </p>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Contact paths
                  </p>
                  <div className="space-y-1.5">
                    {open.contact_paths.map((cp, i) => (
                      <div
                        key={i}
                        className="rounded border border-[#1A1A1A] bg-[#0B0B0B] p-2 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-[#111]"
                            >
                              {cp.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize ${difficultyColor[cp.difficulty]}`}
                            >
                              {cp.difficulty}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#A3A3A3] mt-1">
                            {cp.note}
                          </p>
                        </div>
                        {cp.url && (
                          <Link
                            href={cp.url}
                            target="_blank"
                            className="text-[11px] text-[#DC2626] hover:text-red-300 flex items-center gap-1 shrink-0"
                          >
                            Open <ExternalLink className="size-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <Link
                  href="/supervisors"
                  className="text-xs text-[#DC2626] hover:text-red-300 inline-flex items-center gap-1"
                >
                  Open full supervisor profile →
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
