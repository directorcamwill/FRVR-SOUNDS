"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandFitStatusSummary } from "@/types/song";

/**
 * BrandFitPanel — grades a vault song against the artist's brand_wiki.
 * Complement to SyncScoreDisplay (which grades sync-readiness).
 *
 * Used on /vault/[songId] as a sibling panel, and on /song-lab/[projectId]
 * (read-only) when the project is linked to a vault song via song_lab_projects.song_id.
 */

interface BrandFitPanelProps {
  songId: string;
  initialStatus?: BrandFitStatusSummary | null;
  initialCheckedAt?: string | null;
  readOnly?: boolean; // in song-lab, hide the Run button
  linkToVault?: boolean; // in song-lab, link back to the song detail
}

const STATUS_ICON = {
  aligned: CheckCircle2,
  partial: MinusCircle,
  deviation: XCircle,
} as const;

const STATUS_COLOR = {
  aligned: "text-emerald-400",
  partial: "text-amber-300",
  deviation: "text-red-400",
} as const;

const TIER_STYLES = {
  high: { text: "text-emerald-300", bar: "bg-emerald-500", border: "border-emerald-500/30" },
  mid: { text: "text-amber-300", bar: "bg-amber-500", border: "border-amber-500/30" },
  low: { text: "text-red-300", bar: "bg-red-500", border: "border-red-500/30" },
} as const;

export function BrandFitPanel({
  songId,
  initialStatus,
  initialCheckedAt,
  readOnly,
  linkToVault,
}: BrandFitPanelProps) {
  const [status, setStatus] = useState<BrandFitStatusSummary | null>(
    initialStatus ?? null
  );
  const [checkedAt, setCheckedAt] = useState<string | null>(
    initialCheckedAt ?? null
  );
  const [loading, setLoading] = useState(false);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setGateMessage(null);
    try {
      const res = await fetch("/api/agents/brand-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json();
      if (res.status === 422 && data?.gated) {
        setGateMessage(data.message);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Brand Fit failed");
      setStatus(data.status);
      setCheckedAt(data.status.generated_at);
      toast.success(`Brand Fit: ${data.status.overall_score}/100`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Brand Fit failed");
    } finally {
      setLoading(false);
    }
  };

  const tier = status?.alignment_tier;
  const tierStyles = tier ? TIER_STYLES[tier] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-red-500" />
            Brand Fit
            {linkToVault && (
              <Link
                href={`/vault/${songId}`}
                className="text-[10px] font-medium uppercase tracking-wider text-red-400 hover:text-red-300 ml-2"
              >
                open in vault →
              </Link>
            )}
          </CardTitle>
          {checkedAt && (
            <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
              Checked {new Date(checkedAt).toLocaleString()}
            </p>
          )}
        </div>
        {!readOnly && (
          <Button
            onClick={run}
            disabled={loading}
            size="sm"
            variant={status ? "outline" : "default"}
          >
            {loading ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Palette className="size-3.5 mr-1.5" />
            )}
            {loading ? "Grading" : status ? "Re-check" : "Check brand fit"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {gateMessage && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p>{gateMessage}</p>
              <Link
                href="/brand"
                className="text-xs font-medium underline underline-offset-2 hover:text-amber-100"
              >
                Open Brand Wiki →
              </Link>
            </div>
          </div>
        )}

        {!status && !gateMessage && !loading && (
          <p className="text-sm text-[#A3A3A3]">
            {readOnly
              ? "No brand fit grade yet. Open the song in the vault and click Check brand fit."
              : "Grade this song against your brand wiki — sonic identity, references, mix prefs, and sync targets."}
          </p>
        )}

        {status && tierStyles && (
          <>
            {/* Overall badge + bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-[10px] border",
                      tierStyles.border,
                      tierStyles.text
                    )}
                  >
                    {status.alignment_tier.toUpperCase()} ALIGNMENT
                  </Badge>
                  {status.confidence != null && (
                    <ConfidencePill
                      score={status.confidence}
                      showLabel={false}
                    />
                  )}
                </div>
                <span className="text-2xl font-bold tabular-nums text-white">
                  {status.overall_score}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full motion-safe:transition-all motion-safe:duration-700",
                    tierStyles.bar
                  )}
                  style={{ width: `${status.overall_score}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            {status.reasoning && (
              <p className="text-xs italic text-[#8892a4] leading-relaxed">
                {status.reasoning}
              </p>
            )}

            {/* Dimensions */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3] mb-2">
                Dimensions
              </p>
              <div className="space-y-1.5">
                {status.dimensions.map((d) => {
                  const Icon = STATUS_ICON[d.status];
                  return (
                    <div
                      key={d.key}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0 mt-0.5",
                          STATUS_COLOR[d.status]
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white font-medium">
                            {d.label}
                          </span>
                          <span className="tabular-nums text-[#A3A3A3]">
                            {d.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                          {d.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths */}
            {status.strengths.length > 0 && (
              <Section
                label="Strengths"
                color="emerald"
                items={status.strengths}
              />
            )}

            {/* Deviations */}
            {status.deviations.length > 0 && (
              <Section
                label="Deviations from brand"
                color="red"
                items={status.deviations}
              />
            )}

            {/* Suggestions */}
            {status.suggestions.length > 0 && (
              <Section
                label="Suggestions"
                color="chrome"
                items={status.suggestions}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  label,
  color,
  items,
}: {
  label: string;
  color: "emerald" | "red" | "chrome";
  items: string[];
}) {
  const toneClass = {
    emerald: "text-emerald-300",
    red: "text-red-300",
    chrome: "text-[#c0c8d8]",
  }[color];
  const dotClass = {
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    chrome: "bg-[#c0c8d8]",
  }[color];
  return (
    <div>
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-wider mb-1",
          toneClass
        )}
      >
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0 mt-1.5",
                dotClass
              )}
            />
            <span className="text-[#D4D4D4]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
