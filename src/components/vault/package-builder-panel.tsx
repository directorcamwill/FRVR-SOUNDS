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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackageStatusSummary } from "@/types/song";

/**
 * PackageBuilderPanel — runs the deterministic Package Builder agent and
 * renders: overall readiness %, checklist, severity-tiered blocker list,
 * copy/download for the one-sheet markdown.
 *
 * This is the capstone P1 surface: everything upstream feeds into it
 * (metadata + splits + registrations + artifacts + sync score). When every
 * row turns green and no high-severity blockers remain, the song is
 * sync-package-ready.
 */

interface PackageBuilderPanelProps {
  songId: string;
  initialStatus?: PackageStatusSummary | null;
  initialCheckedAt?: string | null;
}

const SEVERITY_STYLES = {
  high: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-300",
    dot: "bg-red-500",
  },
  medium: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-300",
    dot: "bg-amber-500",
  },
  low: {
    border: "border-[#c0c8d8]/30",
    bg: "bg-[#c0c8d8]/5",
    text: "text-[#c0c8d8]",
    dot: "bg-[#c0c8d8]",
  },
} as const;

export function PackageBuilderPanel({
  songId,
  initialStatus,
  initialCheckedAt,
}: PackageBuilderPanelProps) {
  const [status, setStatus] = useState<PackageStatusSummary | null>(
    initialStatus ?? null
  );
  const [checkedAt, setCheckedAt] = useState<string | null>(
    initialCheckedAt ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/package-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Package builder failed");
      }
      const data = (await res.json()) as {
        status: PackageStatusSummary;
      };
      setStatus(data.status);
      setCheckedAt(data.status.generated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package builder failed");
    } finally {
      setLoading(false);
    }
  };

  const copyOneSheet = async () => {
    if (!status?.one_sheet_markdown) return;
    try {
      await navigator.clipboard.writeText(status.one_sheet_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy to clipboard failed");
    }
  };

  const downloadOneSheet = () => {
    if (!status?.one_sheet_markdown) return;
    const blob = new Blob([status.one_sheet_markdown], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `one-sheet-${songId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const readinessTone = !status
    ? "bg-[#333]"
    : status.ready
      ? "bg-emerald-500"
      : status.completeness_pct >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4 text-red-500" />
            Package Builder
          </CardTitle>
          {checkedAt && (
            <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
              Checked {new Date(checkedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          onClick={run}
          disabled={loading}
          size="sm"
          variant={status ? "outline" : "default"}
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Package className="size-3.5 mr-1.5" />
          )}
          {loading ? "Checking" : status ? "Re-check" : "Check package"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && !status ? (
          <div className="space-y-2">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !status ? (
          <p className="text-sm text-[#A3A3A3]">
            Run the Package Builder to verify metadata, splits, registrations,
            and artifacts before submitting this song for sync.
          </p>
        ) : (
          <>
            {/* Readiness bar + ready badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status.ready ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      <CheckCircle2 className="size-3 mr-1" />
                      Ready to submit
                    </Badge>
                  ) : (
                    <Badge
                      className={cn(
                        "border",
                        status.completeness_pct >= 60
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-red-500/15 text-red-300 border-red-500/30"
                      )}
                    >
                      <AlertCircle className="size-3 mr-1" />
                      {status.blockers.length} blocker
                      {status.blockers.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
                <span className="text-lg font-bold text-white tabular-nums">
                  {status.completeness_pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full motion-safe:transition-all motion-safe:duration-700",
                    readinessTone
                  )}
                  style={{ width: `${status.completeness_pct}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3] mb-2">
                Checklist
              </p>
              <ul className="space-y-1">
                {status.checklist.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-2 text-xs"
                  >
                    {item.done ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="size-3.5 text-[#444] shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        item.done ? "text-[#A3A3A3]" : "text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Blockers */}
            {status.blockers.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3] mb-2">
                  Blockers
                </p>
                <div className="space-y-1.5">
                  {status.blockers.map((b, i) => {
                    const s = SEVERITY_STYLES[b.severity];
                    return (
                      <Link
                        key={i}
                        href={b.action_url}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded border transition-colors group",
                          s.border,
                          s.bg,
                          "hover:bg-white/[0.02]"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0 mt-1.5",
                            s.dot
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[10px] uppercase tracking-wider font-medium",
                              s.text
                            )}
                          >
                            {b.severity}
                          </p>
                          <p className="text-xs text-white group-hover:text-red-200 transition-colors">
                            {b.message}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* One-sheet actions */}
            <div className="pt-2 border-t border-[#1A1A1A] flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyOneSheet}
                disabled={!status.one_sheet_markdown}
              >
                {copied ? (
                  <Check className="size-3.5 mr-1.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5 mr-1.5" />
                )}
                {copied ? "Copied" : "Copy one-sheet"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadOneSheet}
                disabled={!status.one_sheet_markdown}
              >
                <Download className="size-3.5 mr-1.5" />
                Download .md
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
