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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Supervisor as SupervisorType } from "@/lib/supervisors";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function SocialLinks({ s }: { s: SupervisorType }) {
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
  SUPERVISORS,
  SUPERVISOR_FORMATS,
  type Supervisor,
  type SupervisorFormat,
} from "@/lib/supervisors";

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function SupervisorsPage() {
  const [query, setQuery] = useState("");
  const [activeFormat, setActiveFormat] = useState<SupervisorFormat | "All">(
    "All"
  );
  const [open, setOpen] = useState<Supervisor | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPERVISORS.filter((s) => {
      if (activeFormat !== "All" && !s.formats.includes(activeFormat))
        return false;
      if (!q) return true;
      const hay = [
        s.name,
        s.role,
        s.company ?? "",
        s.style_notes,
        ...s.genres,
        ...(s.mood_preferences ?? []),
        ...s.notable_projects.map((p) => p.title),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeFormat]);

  const formatCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of SUPERVISORS)
      for (const f of s.formats) c[f] = (c[f] ?? 0) + 1;
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#DC2626]/10 p-2 border border-[#DC2626]/30">
          <UserRound className="size-5 text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Music Supervisors</h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mt-1">
            Verified supervisors with publicly-documented credits and ethical
            contact paths only. Find who matches your sound, how they work,
            and how to approach them the right way.
          </p>
          <p className="text-[11px] text-[#666] mt-2">
            {SUPERVISORS.length} curated supervisors. All contact paths go
            through published channels (company submission portal, Guild
            profile, agency, professional social). No private emails.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#666]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search supervisor, company, project, genre, mood..."
          className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFormat("All")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeFormat === "All"
              ? "bg-[#DC2626] text-white border-[#DC2626]"
              : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
          }`}
        >
          All ({SUPERVISORS.length})
        </button>
        {SUPERVISOR_FORMATS.filter((f) => formatCounts[f]).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFormat(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeFormat === f
                ? "bg-[#DC2626] text-white border-[#DC2626]"
                : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
            }`}
          >
            {f} ({formatCounts[f]})
          </button>
        ))}
      </div>

      <div className="text-xs text-[#666]">
        {filtered.length}{" "}
        {filtered.length === 1 ? "supervisor" : "supervisors"}
        {query && ` matching "${query}"`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpen(s)}
            className="text-left"
          >
            <Card className="hover:border-[#DC2626]/40 transition-colors h-full cursor-pointer">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar size="lg" className="shrink-0">
                    {s.photo_url && <AvatarImage src={s.photo_url} alt={s.name} />}
                    <AvatarFallback className="bg-[#1A1A1A] text-[#DC2626] text-sm font-semibold">
                      {initialsFor(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-white leading-tight">
                        {s.name}
                      </h3>
                      {s.guild_member && (
                        <ShieldCheck
                          className="size-4 text-emerald-400"
                          aria-label="Guild of Music Supervisors member"
                        />
                      )}
                    </div>
                    <p className="text-sm text-[#A3A3A3] truncate">
                      {s.role}
                      {s.company && s.company !== "Independent"
                        ? ` · ${s.company}`
                        : ""}
                    </p>
                    <div className="mt-1.5">
                      <SocialLinks s={s} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {s.formats.slice(0, 3).map((f) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-0.5">
                    Genres
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] line-clamp-2">
                    {s.genres.slice(0, 6).join(" · ")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-0.5">
                    Notable
                  </p>
                  <p className="text-[11px] text-white line-clamp-2">
                    {s.notable_projects
                      .slice(0, 3)
                      .map((p) => p.title)
                      .join(" · ")}
                  </p>
                </div>

                <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-3">
                  {s.style_notes}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-sm text-[#666]">
            No supervisors match your filters.
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <Avatar size="lg" className="shrink-0 size-14">
                    {open.photo_url && <AvatarImage src={open.photo_url} alt={open.name} />}
                    <AvatarFallback className="bg-[#1A1A1A] text-[#DC2626] text-lg font-semibold">
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
                    <DialogDescription className="text-sm text-[#A3A3A3]">
                      {open.role}
                      {open.company ? ` · ${open.company}` : ""}
                    </DialogDescription>
                    <div className="mt-2">
                      <SocialLinks s={open} />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-2">
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

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Style
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {open.style_notes}
                  </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                      Genres
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {open.genres.map((g) => (
                        <Badge
                          key={g}
                          variant="outline"
                          className="text-[10px] bg-[#111]"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {open.mood_preferences && open.mood_preferences.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                        Mood preferences
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {open.mood_preferences.map((m) => (
                          <Badge
                            key={m}
                            variant="outline"
                            className="text-[10px] bg-[#111] capitalize"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                    Notable projects
                  </p>
                  <ul className="space-y-1.5">
                    {open.notable_projects.map((p, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#D4D4D4] flex gap-2"
                      >
                        <span className="text-[#DC2626] shrink-0">·</span>
                        <div className="min-w-0">
                          <p className="text-white">
                            {p.title}{" "}
                            {p.year && (
                              <span className="text-[#666] text-[11px]">
                                ({p.year})
                              </span>
                            )}
                          </p>
                          {p.notable_placement && (
                            <p className="text-[11px] text-[#8892a4]">
                              {p.notable_placement}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                    Placement tendencies
                  </p>
                  <ul className="space-y-1">
                    {open.placement_tendencies.map((t, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#D4D4D4] flex gap-2"
                      >
                        <span className="text-[#DC2626]">·</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold">
                    Contact paths (public, ethical channels only)
                  </p>
                  <div className="space-y-2">
                    {open.contact_paths.map((cp, i) => (
                      <div
                        key={i}
                        className="rounded border border-[#1A1A1A] bg-[#111] p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
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
                          {cp.url && (
                            <Link
                              href={cp.url}
                              target="_blank"
                              className="text-[11px] text-[#DC2626] hover:text-red-300 flex items-center gap-1"
                            >
                              Open{" "}
                              <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                          {cp.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Do
                    </p>
                    <ul className="space-y-1">
                      {open.approach_do.map((d, i) => (
                        <li
                          key={i}
                          className="text-xs text-[#D4D4D4] leading-relaxed flex gap-2"
                        >
                          <span className="text-emerald-400">·</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">
                      Don&apos;t
                    </p>
                    <ul className="space-y-1">
                      {open.approach_dont.map((d, i) => (
                        <li
                          key={i}
                          className="text-xs text-[#D4D4D4] leading-relaxed flex gap-2"
                        >
                          <span className="text-red-400">·</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <p className="text-[10px] text-[#666] italic leading-relaxed border-t border-[#1A1A1A] pt-3">
                  Source: {open.source_notes}. Confidence:{" "}
                  {Math.round(open.confidence_score * 100)}%.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
