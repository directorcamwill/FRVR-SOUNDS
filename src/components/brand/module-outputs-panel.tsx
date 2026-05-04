"use client";

// V2 Module Output Layer — renders generated artifacts for the Identity
// and Emotional Signature modules. Each section has a "Generate" button
// that calls the corresponding Director mode and persists the result to
// brand_wiki.module_outputs. Reads back from the wiki on every render
// so already-generated outputs persist across navigation.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Film,
  Flame,
  MessageSquare,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { BrandModuleId, BrandWiki } from "@/types/brand";

interface OriginScript {
  hook: string;
  moment: string;
  reveal: string;
  cta: string;
  shot_notes: string;
  reasoning?: string;
  confidence?: number | null;
  generated_at?: string;
}

interface ContrarianHooks {
  hooks: Array<{ id: string; text: string; belief: string; enemy: string }>;
  reasoning?: string;
  confidence?: number | null;
  generated_at?: string;
}

interface CaptionStarters {
  by_emotion: Record<string, string[]>;
  reasoning?: string;
  confidence?: number | null;
  generated_at?: string;
}

interface MoodFormatMap {
  by_mood: Array<{
    mood: string;
    formats: Array<{ name: string; structure: string }>;
  }>;
  reasoning?: string;
  confidence?: number | null;
  generated_at?: string;
}

interface ModuleOutputsBlob {
  identity?: {
    origin_script?: OriginScript;
    contrarian_hooks?: ContrarianHooks;
  };
  emotional?: {
    caption_starters?: CaptionStarters;
    mood_format_map?: MoodFormatMap;
  };
}

interface ModuleOutputsPanelProps {
  moduleId: BrandModuleId;
  wiki: BrandWiki;
  onWikiUpdated: () => Promise<void>;
}

export function ModuleOutputsPanel({
  moduleId,
  wiki,
  onWikiUpdated,
}: ModuleOutputsPanelProps) {
  // Only Identity and Emotional have output layers in this slice.
  if (moduleId !== "identity" && moduleId !== "emotional") return null;

  const outputs = (wiki.module_outputs ?? {}) as ModuleOutputsBlob;

  return (
    <Card className="border-white/10 bg-zinc-950/40">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
          <Sparkles className="size-4" />
          Module outputs
          <span className="ml-auto text-[10px] uppercase tracking-wider text-white/40">
            Generated from your wiki
          </span>
        </div>

        {moduleId === "identity" && (
          <>
            <OriginScriptSection
              script={outputs.identity?.origin_script ?? null}
              onWikiUpdated={onWikiUpdated}
            />
            <ContrarianHooksSection
              hooks={outputs.identity?.contrarian_hooks ?? null}
              onWikiUpdated={onWikiUpdated}
            />
          </>
        )}

        {moduleId === "emotional" && (
          <>
            <CaptionStartersSection
              starters={outputs.emotional?.caption_starters ?? null}
              onWikiUpdated={onWikiUpdated}
            />
            <MoodFormatSection
              map={outputs.emotional?.mood_format_map ?? null}
              onWikiUpdated={onWikiUpdated}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section helpers ─────────────────────────────────────────────────────

function OriginScriptSection({
  script,
  onWikiUpdated,
}: {
  script: OriginScript | null;
  onWikiUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const generate = useGenerator(
    "generate_origin_script",
    setLoading,
    onWikiUpdated,
  );
  return (
    <Section
      icon={<Film className="size-3.5" />}
      title="Origin-moment script"
      subtitle="A 45-second short you can shoot tomorrow."
      generated={!!script}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-1.5" />
          )}
          {script ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {script && (
        <div className="space-y-2 text-sm">
          <Beat label="HOOK" value={script.hook} />
          <Beat label="MOMENT" value={script.moment} />
          <Beat label="REVEAL" value={script.reveal} />
          <Beat label="CTA" value={script.cta} />
          {script.shot_notes && (
            <p className="text-xs text-white/50 italic pt-2 border-t border-white/5">
              Shot notes: {script.shot_notes}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

function ContrarianHooksSection({
  hooks,
  onWikiUpdated,
}: {
  hooks: ContrarianHooks | null;
  onWikiUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const generate = useGenerator(
    "generate_contrarian_hooks",
    setLoading,
    onWikiUpdated,
  );
  return (
    <Section
      icon={<Flame className="size-3.5" />}
      title="Contrarian hook seeds"
      subtitle="5 hooks that dramatize a stance you'd lose generic fans for."
      generated={!!hooks?.hooks?.length}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-1.5" />
          )}
          {hooks?.hooks?.length ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {hooks?.hooks?.length ? (
        <ul className="space-y-2">
          {hooks.hooks.map((h) => (
            <li
              key={h.id}
              className="rounded-md border border-white/5 bg-white/[0.02] p-3"
            >
              <p className="text-sm text-[#D4D4D4] leading-snug">
                &ldquo;{h.text}&rdquo;
              </p>
              {(h.belief || h.enemy) && (
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-white/40">
                  {h.belief && (
                    <Badge className="bg-white/5 border-white/10 text-white/60 text-[10px]">
                      {h.belief}
                    </Badge>
                  )}
                  {h.enemy && (
                    <span className="italic">vs. {h.enemy}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

function CaptionStartersSection({
  starters,
  onWikiUpdated,
}: {
  starters: CaptionStarters | null;
  onWikiUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const generate = useGenerator(
    "generate_caption_starters",
    setLoading,
    onWikiUpdated,
  );
  const emotions = starters?.by_emotion
    ? Object.entries(starters.by_emotion)
    : [];
  return (
    <Section
      icon={<MessageSquare className="size-3.5" />}
      title="Caption starters per emotion"
      subtitle="3 caption openings per desired emotion. Drop in front of any post."
      generated={emotions.length > 0}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-1.5" />
          )}
          {emotions.length > 0 ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {emotions.length > 0 && (
        <div className="space-y-3">
          {emotions.map(([emotion, lines]) => (
            <div key={emotion}>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                {emotion}
              </p>
              <ul className="space-y-1">
                {lines.map((l, i) => (
                  <li
                    key={i}
                    className="text-xs text-[#D4D4D4] rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function MoodFormatSection({
  map,
  onWikiUpdated,
}: {
  map: MoodFormatMap | null;
  onWikiUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const generate = useGenerator(
    "generate_mood_format_map",
    setLoading,
    onWikiUpdated,
  );
  const moods = map?.by_mood ?? [];
  return (
    <Section
      icon={<Layers className="size-3.5" />}
      title="Mood → content format map"
      subtitle="Concrete formats that emotionally rhyme with each of your moods."
      generated={moods.length > 0}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-1.5" />
          )}
          {moods.length > 0 ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {moods.length > 0 && (
        <div className="space-y-3">
          {moods.map((m) => (
            <div key={m.mood}>
              <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                {m.mood}
              </p>
              <ul className="space-y-1">
                {m.formats.map((f, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <p className="text-sm text-white">{f.name}</p>
                    <p className="text-xs text-white/50">{f.structure}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Section({
  icon,
  title,
  subtitle,
  generated,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  generated: boolean;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/5 bg-black/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
            {icon}
            {title}
          </div>
          <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {generated && <div className="pt-1 border-t border-white/5">{children}</div>}
    </div>
  );
}

function Beat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-mono text-[#DC2626] tracking-wider">
        {label}
      </span>
      <p className="text-sm text-[#D4D4D4] leading-snug">{value}</p>
    </div>
  );
}

// Hook-style helper that returns a click handler — runs the API call,
// shows toasts, and triggers a wiki re-fetch after success so the
// just-generated output renders without a manual reload.
function useGenerator(
  mode: string,
  setLoading: (b: boolean) => void,
  onWikiUpdated: () => Promise<void>,
): () => Promise<void> {
  return async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/brand-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      await onWikiUpdated();
      toast.success("Generated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };
}
