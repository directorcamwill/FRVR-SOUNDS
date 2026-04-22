"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  NotebookPen,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandWiki } from "@/types/brand";

/**
 * Collective Journey Notes — a running scratchpad under the QuestionCard.
 * Autosaves to brand_wiki.journey_notes. Persists across modules + sessions.
 * Collapsible; remembers open/closed state in localStorage.
 */

const STORAGE_KEY = "frvr.brand.journey_notes.open";

export function JourneyNotes({
  wiki,
  onSave,
}: {
  wiki: BrandWiki;
  onSave: (patch: Partial<BrandWiki>) => Promise<void>;
}) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [draft, setDraft] = useState<string>(wiki.journey_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<string>(wiki.journey_notes ?? "");

  // Reseed when the wiki changes externally (e.g., another tab saved).
  useEffect(() => {
    const remote = wiki.journey_notes ?? "";
    if (remote !== lastSaved.current) {
      setDraft(remote);
      lastSaved.current = remote;
    }
  }, [wiki.journey_notes]);

  const commit = async (value: string) => {
    if (value === lastSaved.current) return;
    setSaving(true);
    try {
      await onSave({ journey_notes: value || null });
      lastSaved.current = value;
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (v: string) => {
    setDraft(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commit(v);
    }, 1200);
  };

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const hasContent = (wiki.journey_notes ?? "").trim().length > 0;

  return (
    <Card className="border-white/10 bg-zinc-950/60">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <NotebookPen className="size-4 text-red-500/80" />
          <div className="flex flex-col items-start">
            <span className="text-[11px] uppercase tracking-[0.2em] text-red-500/70 font-semibold">
              Journey Notes
            </span>
            <span className="text-[11px] text-white/40">
              {hasContent
                ? `${(wiki.journey_notes ?? "").length} chars saved`
                : "A collective scratchpad for the whole Journey."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Loader2 className="size-3 animate-spin" />
              Saving
            </span>
          ) : justSaved ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="size-3" />
              Saved
            </span>
          ) : null}
          {open ? (
            <ChevronUp className="size-4 text-white/50" />
          ) : (
            <ChevronDown className="size-4 text-white/50" />
          )}
        </div>
      </button>

      {open && (
        <CardContent className="pt-0 pb-4 px-5 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => commit(draft)}
            rows={6}
            placeholder="Thoughts, tangents, references, lyrics, half-formed theories. Anything that comes up while you're working through the Journey. Autosaves."
            className={cn(
              "bg-zinc-950 border-white/10 text-white leading-relaxed",
              "placeholder:text-white/25 text-sm",
            )}
          />
          <p className="text-[10px] text-white/30 italic">
            Private to your account. Persists across sessions. Every agent
            can read this as optional context.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
