"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Sparkles,
  Dna,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Opportunity,
  SyncBriefDetails,
  PlacementDnaCache,
} from "@/types/opportunity";

/**
 * Brief Intelligence panel — exposes the Sync Brief + Placement DNA agents
 * on the opportunity detail page. Caches land on
 * opportunities.brief_details / placement_dna_cache via their respective
 * API routes; this component just runs + renders.
 */

interface BriefIntelligenceProps {
  opportunity: Opportunity;
  onRefresh: () => void;
}

export function BriefIntelligence({
  opportunity,
  onRefresh,
}: BriefIntelligenceProps) {
  const [briefRunning, setBriefRunning] = useState(false);
  const [dnaRunning, setDnaRunning] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [dnaError, setDnaError] = useState<string | null>(null);

  const brief = opportunity.brief_details ?? null;
  const dna = opportunity.placement_dna_cache ?? null;

  const runBrief = async () => {
    setBriefRunning(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/agents/sync-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync brief failed");
      }
      onRefresh();
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Sync brief failed");
    } finally {
      setBriefRunning(false);
    }
  };

  const runDna = async () => {
    setDnaRunning(true);
    setDnaError(null);
    try {
      const res = await fetch("/api/agents/placement-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Placement DNA failed");
      }
      onRefresh();
    } catch (err) {
      setDnaError(err instanceof Error ? err.message : "Placement DNA failed");
    } finally {
      setDnaRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-red-500" />
              Structured Brief
            </CardTitle>
            {brief?.generated_at && (
              <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
                Structured {new Date(brief.generated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            onClick={runBrief}
            disabled={briefRunning}
            size="sm"
            variant={brief ? "outline" : "default"}
          >
            {briefRunning ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5 mr-1.5" />
            )}
            {briefRunning ? "Structuring" : brief ? "Re-structure" : "Structure"}
          </Button>
        </CardHeader>
        <CardContent>
          {briefError && (
            <div className="flex items-start gap-2 text-sm text-red-400 mb-3">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{briefError}</span>
            </div>
          )}
          {briefRunning ? (
            <BriefSkeleton />
          ) : brief ? (
            <BriefView brief={brief} />
          ) : (
            <EmptyState
              icon={<FileText className="size-8 text-[#333]" />}
              label="No structured brief yet"
              hint="Run the Sync Brief agent to extract format family, mood, BPM, cutdowns, and vocal policy from the free-text brief."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dna className="size-4 text-cyan-400" />
              Placement DNA
            </CardTitle>
            {dna?.generated_at && (
              <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
                Cached {new Date(dna.generated_at).toLocaleDateString()} · n=
                {dna.sample_size}
              </p>
            )}
          </div>
          <Button
            onClick={runDna}
            disabled={dnaRunning}
            size="sm"
            variant={dna ? "outline" : "default"}
          >
            {dnaRunning ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Dna className="size-3.5 mr-1.5" />
            )}
            {dnaRunning ? "Analyzing" : dna ? "Re-generate" : "Generate"}
          </Button>
        </CardHeader>
        <CardContent>
          {dnaError && (
            <div className="flex items-start gap-2 text-sm text-red-400 mb-3">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{dnaError}</span>
            </div>
          )}
          {dnaRunning ? (
            <BriefSkeleton />
          ) : dna ? (
            <DnaView dna={dna} />
          ) : (
            <EmptyState
              icon={<Dna className="size-8 text-[#333]" />}
              label="No placement DNA yet"
              hint="Run the Placement DNA agent to distill heuristics (BPM band, intro max, density) from your historical submissions for this format family."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BriefView({ brief }: { brief: SyncBriefDetails }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-red-500/15 text-red-300 border-red-500/30">
          {brief.format_family.replace(/_/g, " ")}
        </Badge>
        {brief.mood_primary && (
          <Badge variant="secondary">{brief.mood_primary}</Badge>
        )}
        {brief.mood_secondary && (
          <Badge variant="secondary">{brief.mood_secondary}</Badge>
        )}
        {brief.confidence != null && (
          <ConfidencePill score={brief.confidence} showLabel={false} />
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {brief.bpm_range && (
          <Field
            label="BPM"
            value={`${brief.bpm_range.min}–${brief.bpm_range.max}`}
          />
        )}
        {brief.energy_target != null && (
          <Field label="Energy" value={`${brief.energy_target}/10`} />
        )}
        {brief.key_preference && (
          <Field label="Key" value={brief.key_preference} />
        )}
        {brief.vocal_policy && (
          <Field
            label="Vocals"
            value={brief.vocal_policy.replace(/_/g, " ")}
          />
        )}
        {brief.dialogue_safe_required && (
          <Field label="Dialogue safe" value="required" highlight />
        )}
        {brief.one_stop_required && (
          <Field label="One-stop" value="required" highlight />
        )}
        {brief.exclusivity_acceptable === false && (
          <Field label="Exclusivity" value="not acceptable" highlight />
        )}
        {brief.explicit_allowed === false && (
          <Field label="Explicit" value="not allowed" />
        )}
      </dl>

      {brief.cutdowns_needed && brief.cutdowns_needed.length > 0 && (
        <ChipRow label="Cutdowns" items={brief.cutdowns_needed} tone="red" />
      )}
      {brief.lyric_themes_preferred &&
        brief.lyric_themes_preferred.length > 0 && (
          <ChipRow
            label="Lyric themes (preferred)"
            items={brief.lyric_themes_preferred}
            tone="chrome"
          />
        )}
      {brief.lyric_themes_avoid && brief.lyric_themes_avoid.length > 0 && (
        <ChipRow
          label="Lyric themes (avoid)"
          items={brief.lyric_themes_avoid}
          tone="red"
        />
      )}
      {brief.similar_placements && brief.similar_placements.length > 0 && (
        <ChipRow
          label="Similar placements"
          items={brief.similar_placements}
          tone="chrome"
        />
      )}
      {brief.target_libraries && brief.target_libraries.length > 0 && (
        <ChipRow
          label="Target libraries"
          items={brief.target_libraries}
          tone="cyan"
        />
      )}

      {brief.notes && (
        <p className="text-xs text-[#A3A3A3] leading-relaxed">{brief.notes}</p>
      )}
      {brief.reasoning && (
        <p className="text-[10px] text-[#555] italic leading-relaxed">
          {brief.reasoning}
        </p>
      )}
    </div>
  );
}

function DnaView({ dna }: { dna: PlacementDnaCache }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
          {dna.format_family.replace(/_/g, " ")}
        </Badge>
        <Badge variant="secondary">n = {dna.sample_size}</Badge>
        {dna.confidence != null && (
          <ConfidencePill score={dna.confidence} showLabel={false} />
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {dna.bpm_band && (
          <Field
            label="BPM band"
            value={`${dna.bpm_band.min}–${dna.bpm_band.max}`}
          />
        )}
        {dna.intro_max_seconds != null && (
          <Field label="Intro max" value={`${dna.intro_max_seconds}s`} />
        )}
        {dna.impact_point_seconds != null && (
          <Field
            label="Impact point"
            value={`${dna.impact_point_seconds}s`}
          />
        )}
        {dna.density && <Field label="Density" value={dna.density} />}
        {dna.win_rate_estimate != null && (
          <Field
            label="Win rate"
            value={`${Math.round(dna.win_rate_estimate * 100)}%`}
          />
        )}
      </dl>

      {dna.arrangement_priorities && dna.arrangement_priorities.length > 0 && (
        <ChipRow
          label="Arrangement priorities"
          items={dna.arrangement_priorities}
          tone="cyan"
        />
      )}
      {dna.dominant_moods && dna.dominant_moods.length > 0 && (
        <ChipRow
          label="Dominant moods"
          items={dna.dominant_moods}
          tone="chrome"
        />
      )}
      {dna.common_tags_in_wins && dna.common_tags_in_wins.length > 0 && (
        <ChipRow
          label="Common tags in wins"
          items={dna.common_tags_in_wins}
          tone="chrome"
        />
      )}

      {dna.reasoning && (
        <p className="text-[10px] text-[#555] italic leading-relaxed">
          {dna.reasoning}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-wider text-[#555]">
        {label}
      </dt>
      <dd
        className={cn(
          "text-xs tabular-nums",
          highlight ? "text-red-300" : "text-white"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ChipRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "red" | "cyan" | "chrome";
}) {
  const toneClass = {
    red: "bg-red-500/10 text-red-300 border-red-500/30",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    chrome: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/30",
  }[tone];
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px]",
              toneClass
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {icon}
      <p className="text-sm font-medium text-white mt-2">{label}</p>
      <p className="text-xs text-[#666] mt-1 max-w-sm">{hint}</p>
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
