"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { PackageStatus } from "@/lib/agents/package-builder";

/**
 * Content + Sync Loop — the one-click fan-out on a sync-ready song.
 * Only renders when package_status.ready is true; otherwise stays hidden
 * to keep the vault sidebar quiet until there's something to do.
 */

interface LoopResult {
  ok: true;
  batch_id: string;
  content_moments_planned: number;
  release_plan_id: string;
}

interface LoopGated {
  ok: false;
  reason:
    | "song_not_found"
    | "package_not_ready"
    | "brand_wiki_incomplete"
    | "already_running";
  message: string;
  completeness_pct?: number;
}

export function ContentSyncLoopPanel({
  songId,
  packageStatus,
}: {
  songId: string;
  packageStatus: PackageStatus | null;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LoopResult | null>(null);
  const [gated, setGated] = useState<LoopGated | null>(null);

  if (!packageStatus?.ready) return null;

  const run = async () => {
    setRunning(true);
    setResult(null);
    setGated(null);
    try {
      const res = await fetch("/api/agents/content-sync-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data?.reason) {
          setGated(data as LoopGated);
          return;
        }
        if (res.status === 403) {
          throw new Error(
            data.error || "Unlocks on Pro Catalog.",
          );
        }
        if (res.status === 429) {
          throw new Error(
            data.error ||
              "You've used all your agent runs this cycle. Resets next period.",
          );
        }
        throw new Error(data.error || "Loop failed");
      }
      setResult(data as LoopResult);
      toast.success(`Drafted ${data.content_moments_planned} release moment${data.content_moments_planned === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Loop failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/[0.03] via-zinc-950 to-zinc-950">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-400/80">
            Ready for release
          </p>
          <h3 className="text-base font-semibold text-white">
            Content + Sync Loop
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            One click → a launch-day caption set, a 30-day release checklist,
            and a release plan pinned to this song. Uses one agent run.
          </p>
        </div>

        <Button
          onClick={run}
          disabled={running}
          className="w-full bg-red-600 hover:bg-red-500 text-white"
        >
          {running ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-1.5" />
          )}
          {running ? "Orchestrating…" : result ? "Re-run loop" : "Run Content + Sync Loop"}
        </Button>

        {result && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Loop complete
              </p>
            </div>
            <p className="text-xs text-white/80">
              <span className="text-white font-semibold">
                {result.content_moments_planned}
              </span>{" "}
              release moment{result.content_moments_planned === 1 ? "" : "s"} drafted.
              Release plan pinned to this song.
            </p>
            <div className="flex gap-2 pt-1">
              <Link href="/content" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-white/10 hover:bg-white/5"
                >
                  Review drafts
                </Button>
              </Link>
            </div>
          </div>
        )}

        {gated && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  {gated.reason === "brand_wiki_incomplete"
                    ? "Brand Wiki needed"
                    : gated.reason === "package_not_ready"
                      ? "Song not ready"
                      : "Blocked"}
                </p>
                <p className="text-xs text-white/80 leading-snug">
                  {gated.message}
                </p>
              </div>
            </div>
            {gated.reason === "brand_wiki_incomplete" && (
              <Link href="/brand">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs border-amber-500/30 hover:bg-amber-500/10"
                >
                  Open Brand Journey
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
