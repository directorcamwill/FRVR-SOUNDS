"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandWiki } from "@/types/brand";

/**
 * Live Brand Wiki — the right-side read-only reflection of the artist's
 * canonical brand data. Sectioned, pulsing-field-on-update, scrollable.
 */

export function LiveWikiPanel({
  wiki,
  highlightFieldKey,
}: {
  wiki: BrandWiki;
  highlightFieldKey: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-500/60">
          Brand Wiki
        </p>
        <span className="text-[10px] tabular-nums text-white/40">
          {wiki.completeness_pct}%
        </span>
      </div>

      <Section title="Identity" accent="red">
        <Field label="Niche" value={wiki.niche} fieldKey="niche" highlight={highlightFieldKey} />
        <Field label="Core pain resolved" value={wiki.core_pain} fieldKey="core_pain" highlight={highlightFieldKey} />
        <Field label="Origin story" value={wiki.origin_story} fieldKey="origin_story" truncate highlight={highlightFieldKey} />
        <PairField
          label="Transformation"
          before={wiki.transformation_before}
          after={wiki.transformation_after}
          fieldKeys={["transformation_before", "transformation_after"]}
          highlight={highlightFieldKey}
        />
        <ArrayField label="Core beliefs" value={wiki.core_beliefs} fieldKey="core_beliefs" highlight={highlightFieldKey} />
        <ArrayField label="Key themes" value={wiki.key_themes} fieldKey="key_themes" highlight={highlightFieldKey} />
      </Section>

      <Section title="Emotional Signature">
        <ArrayField label="Desired" value={wiki.desired_emotions} fieldKey="desired_emotions" highlight={highlightFieldKey} />
        <ArrayField label="Natural" value={wiki.natural_emotions} fieldKey="natural_emotions" highlight={highlightFieldKey} />
        <ArrayField label="Tags" value={wiki.emotional_tags} fieldKey="emotional_tags" highlight={highlightFieldKey} />
        <DialField
          label="Energy / Intensity"
          energy={wiki.energy_marker}
          intensity={wiki.intensity_marker}
          notes={wiki.intensity_notes}
          fieldKeys={["energy_marker", "intensity_marker", "intensity_notes"]}
          highlight={highlightFieldKey}
        />
      </Section>

      <Section title="Positioning">
        <Field label="Statement" value={wiki.positioning_statement} fieldKey="positioning_statement" highlight={highlightFieldKey} />
        <Field label="Lane" value={wiki.category_lane} fieldKey="category_lane" highlight={highlightFieldKey} />
        <ArrayField label="Differentiators" value={wiki.differentiators} fieldKey="differentiators" highlight={highlightFieldKey} />
        <WhatNotField value={wiki.what_not} fieldKey="what_not" highlight={highlightFieldKey} />
        <CompetitiveField value={wiki.competitive_contrast} fieldKey="competitive_contrast" highlight={highlightFieldKey} />
      </Section>

      <Section title="Audience">
        <Field label="Primary" value={wiki.primary_audience} fieldKey="primary_audience" highlight={highlightFieldKey} />
        <ArrayField label="Pain" value={wiki.audience_pain_points} fieldKey="audience_pain_points" highlight={highlightFieldKey} />
        <ArrayField label="Desires" value={wiki.audience_desires} fieldKey="audience_desires" highlight={highlightFieldKey} />
        <ArrayField label="Context" value={wiki.audience_lifestyle_context} fieldKey="audience_lifestyle_context" highlight={highlightFieldKey} />
        <Field
          label="Identity goals"
          value={wiki.audience_identity_goals}
          fieldKey="audience_identity_goals"
          truncate
          highlight={highlightFieldKey}
        />
      </Section>

      <Section title="Visual DNA">
        <PaletteField
          primary={wiki.color_primary}
          secondary={wiki.color_secondary}
          accent={wiki.color_accent}
          fieldKeys={["color_primary", "color_secondary", "color_accent"]}
          highlight={highlightFieldKey}
        />
        <ArrayField label="Textures" value={wiki.texture_keywords} fieldKey="texture_keywords" highlight={highlightFieldKey} />
        <PairField
          label="Typography"
          before={wiki.font_heading}
          after={wiki.font_body}
          fieldKeys={["font_heading", "font_body"]}
          highlight={highlightFieldKey}
        />
        <ArrayField
          label="Press photos"
          value={wiki.press_photo_urls}
          fieldKey="press_photo_urls"
          highlight={highlightFieldKey}
        />
      </Section>

      <Section title="Sound DNA">
        <PairField
          label="Genre"
          before={wiki.sonic_genre_primary}
          after={wiki.sonic_genre_secondary}
          fieldKeys={["sonic_genre_primary", "sonic_genre_secondary"]}
          highlight={highlightFieldKey}
        />
        <ArrayField label="Moods" value={wiki.sonic_moods} fieldKey="sonic_moods" highlight={highlightFieldKey} />
        <BpmField
          min={wiki.sonic_bpm_min}
          max={wiki.sonic_bpm_max}
          highlight={highlightFieldKey}
        />
        <ArrayField label="Textures" value={wiki.sonic_texture_keywords} fieldKey="sonic_texture_keywords" highlight={highlightFieldKey} />
        <ReferenceTracksField
          value={wiki.reference_tracks}
          highlight={highlightFieldKey}
        />
      </Section>

      <Section title="Routes">
        <ArrayField
          label="Format targets"
          value={wiki.sync_format_targets}
          fieldKey="sync_format_targets"
          highlight={highlightFieldKey}
        />
        <ArrayField
          label="Formats to avoid"
          value={wiki.avoid_sync_formats}
          fieldKey="avoid_sync_formats"
          highlight={highlightFieldKey}
        />
        <ArrayField
          label="Library targets"
          value={wiki.sync_library_targets}
          fieldKey="sync_library_targets"
          highlight={highlightFieldKey}
        />
      </Section>
    </div>
  );
}

function PaletteField({
  primary,
  secondary,
  accent,
  fieldKeys,
  highlight,
}: {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  fieldKeys: string[];
  highlight: string | null;
}) {
  const ref = usePulse(
    fieldKeys.includes(highlight ?? "") ? (highlight as string) : "__none__",
    highlight,
  );
  if (!primary && !secondary && !accent)
    return <EmptyField label="Palette" />;
  return (
    <div ref={ref} className="space-y-1 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        Palette
      </p>
      <div className="flex items-center gap-2">
        {[primary, secondary, accent].map((c, i) =>
          c ? (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className="size-4 rounded border border-white/10"
                style={{ backgroundColor: c }}
                aria-hidden
              />
              <span className="text-[10px] font-mono text-white/70">{c}</span>
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function BpmField({
  min,
  max,
  highlight,
}: {
  min: number | null;
  max: number | null;
  highlight: string | null;
}) {
  const ref = usePulse(
    highlight === "sonic_bpm_min" || highlight === "sonic_bpm_max"
      ? (highlight as string)
      : "__none__",
    highlight,
  );
  if (min == null && max == null) return <EmptyField label="BPM range" />;
  return (
    <div ref={ref} className="space-y-0.5 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        BPM range
      </p>
      <p className="text-xs text-white/90 font-mono">
        {min ?? "—"} – {max ?? "—"}
      </p>
    </div>
  );
}

function ReferenceTracksField({
  value,
  highlight,
}: {
  value: BrandWiki["reference_tracks"] | null | undefined;
  highlight: string | null;
}) {
  const ref = usePulse("reference_tracks", highlight);
  if (!value || value.length === 0) return <EmptyField label="References" />;
  return (
    <div ref={ref} className="space-y-1 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        References
      </p>
      <ul className="space-y-1 text-xs text-white/90">
        {value.map((t, i) => (
          <li key={i}>
            <span className="text-white/90">{t.artist}</span>
            <span className="text-white/40"> — </span>
            <span className="italic">{t.title}</span>
            {t.why && (
              <span className="block text-white/50 text-[11px]">{t.why}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section + Fields ─────────────────────────────────────────────────────

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "red";
}) {
  return (
    <Card className={cn("border-white/10 bg-zinc-950/60")}>
      <CardContent className="p-4 space-y-3">
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.25em]",
            accent === "red" ? "text-red-500/70" : "text-white/40",
          )}
        >
          {title}
        </p>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function usePulse(fieldKey: string, highlight: string | null) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlight === fieldKey && ref.current) {
      ref.current.animate(
        [
          { backgroundColor: "rgba(220,38,38,0.12)" },
          { backgroundColor: "transparent" },
        ],
        { duration: 900, easing: "ease-out" },
      );
    }
  }, [highlight, fieldKey]);
  return ref;
}

function Field({
  label,
  value,
  fieldKey,
  truncate,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  fieldKey: string;
  truncate?: boolean;
  highlight: string | null;
}) {
  const ref = usePulse(fieldKey, highlight);
  if (!value || !value.trim()) return <EmptyField label={label} />;
  return (
    <div ref={ref} className="space-y-0.5 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p
        className={cn(
          "text-xs text-white/90 leading-relaxed",
          truncate && "line-clamp-4",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ArrayField({
  label,
  value,
  fieldKey,
  highlight,
}: {
  label: string;
  value: string[] | null | undefined;
  fieldKey: string;
  highlight: string | null;
}) {
  const ref = usePulse(fieldKey, highlight);
  if (!value || value.length === 0) return <EmptyField label={label} />;
  return (
    <div ref={ref} className="space-y-1 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/80"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function PairField({
  label,
  before,
  after,
  fieldKeys,
  highlight,
}: {
  label: string;
  before: string | null | undefined;
  after: string | null | undefined;
  fieldKeys: string[];
  highlight: string | null;
}) {
  const ref = usePulse(
    fieldKeys.includes(highlight ?? "") ? (highlight as string) : "__none__",
    highlight,
  );
  if (!before && !after) return <EmptyField label={label} />;
  return (
    <div ref={ref} className="space-y-0.5 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="text-xs text-white/90 leading-relaxed">
        <span className="text-white/50">{before ?? "—"}</span>
        <span className="text-white/30 mx-1.5">→</span>
        <span>{after ?? "—"}</span>
      </p>
    </div>
  );
}

function DialField({
  label,
  energy,
  intensity,
  notes,
  fieldKeys,
  highlight,
}: {
  label: string;
  energy: number | null;
  intensity: number | null;
  notes: string | null;
  fieldKeys: string[];
  highlight: string | null;
}) {
  const ref = usePulse(
    fieldKeys.includes(highlight ?? "") ? (highlight as string) : "__none__",
    highlight,
  );
  if (energy == null && intensity == null)
    return <EmptyField label={label} />;
  return (
    <div ref={ref} className="space-y-0.5 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="text-xs text-white/90">
        Energy <span className="font-semibold">{energy ?? "—"}</span> · Intensity{" "}
        <span className="font-semibold">{intensity ?? "—"}</span>
        {notes && (
          <span className="block text-white/50 italic mt-0.5">{notes}</span>
        )}
      </p>
    </div>
  );
}

function WhatNotField({
  value,
  fieldKey,
  highlight,
}: {
  value: BrandWiki["what_not"] | null | undefined;
  fieldKey: string;
  highlight: string | null;
}) {
  const ref = usePulse(fieldKey, highlight);
  if (!value || value.length === 0) return <EmptyField label="What they're NOT" />;
  return (
    <div ref={ref} className="space-y-1 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        What they&apos;re NOT
      </p>
      <ul className="space-y-1 text-xs text-white/90">
        {value.map((item, i) => (
          <li key={i}>
            <span className="text-white/50">not {item.confused_with}</span>
            <span className="text-white/30"> — </span>
            <span>{item.difference}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompetitiveField({
  value,
  fieldKey,
  highlight,
}: {
  value: BrandWiki["competitive_contrast"] | null | undefined;
  fieldKey: string;
  highlight: string | null;
}) {
  const ref = usePulse(fieldKey, highlight);
  if (!value || value.length === 0)
    return <EmptyField label="Competitive contrast" />;
  return (
    <div ref={ref} className="space-y-1 rounded-md px-1 -mx-1">
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        Competitive contrast
      </p>
      <ul className="space-y-1 text-xs text-white/90">
        {value.map((item, i) => (
          <li key={i}>
            <span className="text-white/50">vs {item.artist}</span>
            <span className="text-white/30"> — </span>
            <span>{item.difference}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyField({ label }: { label: string }) {
  return (
    <div className="space-y-0.5 opacity-50">
      <p className="text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </p>
      <p className="text-xs text-white/20 italic">empty</p>
    </div>
  );
}
