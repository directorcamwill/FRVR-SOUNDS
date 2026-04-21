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
import { BookOpen, ChevronRight, Search, Sparkles } from "lucide-react";
import {
  SYNC_TERMS,
  SYNC_CATEGORIES,
  type SyncCategory,
  type SyncTerm,
  type DifficultyLevel,
} from "@/lib/sync-terms";

const difficultyStyles: Record<DifficultyLevel, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function SyncDirectoryPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SyncCategory | "All">(
    "All"
  );
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyLevel | "All">("All");
  const [openTerm, setOpenTerm] = useState<SyncTerm | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYNC_TERMS.filter((t) => {
      if (activeCategory !== "All" && t.category !== activeCategory)
        return false;
      if (activeDifficulty !== "All" && t.difficulty !== activeDifficulty)
        return false;
      if (!q) return true;
      const haystack = [
        t.term,
        t.definition,
        t.advancedDefinition ?? "",
        t.realWorldExample ?? "",
        t.artistTip,
        ...(t.aliases ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeCategory, activeDifficulty]);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of SYNC_TERMS) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const enrichedCount = useMemo(
    () => SYNC_TERMS.filter((t) => t.advancedDefinition).length,
    []
  );

  const findByTerm = (term: string) =>
    SYNC_TERMS.find(
      (t) => t.term.toLowerCase() === term.toLowerCase()
    ) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#DC2626]/10 p-2 border border-[#DC2626]/30">
          <BookOpen className="size-5 text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sync Directory</h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mt-1">
            Plain-English answers on every sync term — structure, deliverables,
            licensing, royalties. Each entry includes a{" "}
            <span className="text-[#DC2626] font-medium">placement tip</span>{" "}
            on how to maximize your chances when the term comes up.
          </p>
          <p className="text-[11px] text-[#666] mt-2">
            {SYNC_TERMS.length} terms · {enrichedCount} with deep dives (real
            examples + advanced context). Click any card for the full breakdown.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#666]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms, aliases, definitions, or examples..."
          className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
        />
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[#666]">
          Level:
        </span>
        {(["All", "beginner", "intermediate", "advanced"] as const).map(
          (lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveDifficulty(lvl)}
              className={`text-[10px] px-2.5 py-1 rounded-full border capitalize transition-colors ${
                activeDifficulty === lvl
                  ? "bg-[#DC2626] text-white border-[#DC2626]"
                  : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
              }`}
            >
              {lvl}
            </button>
          )
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("All")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeCategory === "All"
              ? "bg-[#DC2626] text-white border-[#DC2626]"
              : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
          }`}
        >
          All ({SYNC_TERMS.length})
        </button>
        {SYNC_CATEGORIES.map((cat) => {
          const count = categoriesWithCounts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-[#DC2626] text-white border-[#DC2626]"
                  : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A] hover:border-[#333]"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="text-xs text-[#666]">
        {filtered.length} {filtered.length === 1 ? "term" : "terms"}
        {query && ` matching "${query}"`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((term) => (
          <button
            key={term.term}
            onClick={() => setOpenTerm(term)}
            className="text-left"
          >
            <Card className="hover:border-[#DC2626]/40 transition-colors cursor-pointer">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      {term.term}
                      {term.advancedDefinition && (
                        <Sparkles className="size-3 text-[#DC2626]" />
                      )}
                    </h3>
                    {term.aliases && term.aliases.length > 0 && (
                      <p className="text-[10px] text-[#666] uppercase tracking-wider mt-0.5 truncate">
                        Also: {term.aliases.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-[#111]"
                    >
                      {term.category}
                    </Badge>
                    {term.difficulty && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize ${difficultyStyles[term.difficulty]}`}
                      >
                        {term.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#D4D4D4] leading-relaxed line-clamp-3">
                  {term.definition}
                </p>
                <div className="border-l-2 border-[#DC2626]/50 pl-3 py-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-0.5">
                    Placement Tip
                  </p>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2">
                    {term.artistTip}
                  </p>
                </div>
                {term.advancedDefinition && (
                  <div className="flex items-center gap-1 text-[10px] text-[#DC2626] font-medium uppercase tracking-wider">
                    Deep dive <ChevronRight className="size-3" />
                  </div>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-[#666]">
            No terms match your search. Try a broader query or clear the
            category filter.
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!openTerm}
        onOpenChange={(v) => !v && setOpenTerm(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openTerm && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl">
                      {openTerm.term}
                    </DialogTitle>
                    {openTerm.aliases && openTerm.aliases.length > 0 && (
                      <p className="text-[11px] text-[#666] uppercase tracking-wider mt-0.5">
                        Also: {openTerm.aliases.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 mr-6">
                    <Badge variant="outline" className="text-[10px] bg-[#111]">
                      {openTerm.category}
                    </Badge>
                    {openTerm.difficulty && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize ${difficultyStyles[openTerm.difficulty]}`}
                      >
                        {openTerm.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <DialogDescription className="sr-only">
                  Details for {openTerm.term}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                    Quick definition
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {openTerm.definition}
                  </p>
                </section>

                {openTerm.advancedDefinition && (
                  <section>
                    <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                      Advanced
                    </p>
                    <p className="text-sm text-[#D4D4D4] leading-relaxed">
                      {openTerm.advancedDefinition}
                    </p>
                  </section>
                )}

                {openTerm.realWorldExample && (
                  <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                      Real-world example
                    </p>
                    <p className="text-sm text-[#D4D4D4] leading-relaxed">
                      {openTerm.realWorldExample}
                    </p>
                  </section>
                )}

                {openTerm.usageContext && (
                  <section>
                    <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                      When this comes up
                    </p>
                    <p className="text-sm text-[#D4D4D4] leading-relaxed">
                      {openTerm.usageContext}
                    </p>
                  </section>
                )}

                <section className="border-l-2 border-[#DC2626] pl-4 py-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold mb-1">
                    Placement Tip
                  </p>
                  <p className="text-sm text-[#D4D4D4] leading-relaxed">
                    {openTerm.artistTip}
                  </p>
                </section>

                {openTerm.related && openTerm.related.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
                      Related terms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {openTerm.related.map((relTerm) => {
                        const rel = findByTerm(relTerm);
                        return rel ? (
                          <button
                            key={relTerm}
                            onClick={() => setOpenTerm(rel)}
                            className="text-xs px-2.5 py-1 rounded-full bg-[#111] text-[#A3A3A3] border border-[#1A1A1A] hover:border-[#DC2626]/50 hover:text-white transition-colors"
                          >
                            {relTerm}
                          </button>
                        ) : (
                          <span
                            key={relTerm}
                            className="text-xs px-2.5 py-1 rounded-full bg-[#111] text-[#666] border border-[#1A1A1A]"
                          >
                            {relTerm}
                          </span>
                        );
                      })}
                    </div>
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
