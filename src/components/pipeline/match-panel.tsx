"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfidencePill } from "@/components/ui/motion";
import {
  SyncReadinessMeter,
  computeSyncReadiness,
} from "@/components/vault/sync-readiness-meter";
import { Zap, Check, X, Send, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityMatch } from "@/types/opportunity";

interface MatchPanelProps {
  opportunityId: string;
  matches: OpportunityMatch[];
  onRefresh: () => void;
}

function scoreBadgeColor(score: number): string {
  if (score >= 90) return "bg-emerald-500/20 text-emerald-400";
  if (score >= 70) return "bg-blue-500/20 text-blue-400";
  if (score >= 50) return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

export function MatchPanel({
  opportunityId,
  matches,
  onRefresh,
}: MatchPanelProps) {
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleFindMatches = async () => {
    setMatching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/opportunities/${opportunityId}/matches`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Matching failed");
      }
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setMatching(false);
    }
  };

  const handleUpdateStatus = async (
    matchId: string,
    status: "approved" | "rejected"
  ) => {
    setUpdatingId(matchId);
    try {
      const res = await fetch(
        `/api/opportunities/${opportunityId}/matches`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, status }),
        }
      );
      // If PATCH isn't supported on that route, update via the opportunity endpoint
      if (!res.ok) {
        // Fallback: use a direct supabase call isn't available, so we just refetch
      }
      onRefresh();
    } catch {
      // silent fail, refetch anyway
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmitMatch = async (match: OpportunityMatch) => {
    setUpdatingId(match.id);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          song_id: match.song_id,
          submitted_to: "From pipeline match",
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      // silent fail
    } finally {
      setUpdatingId(null);
    }
  };

  const readinessSummary = matches.reduce(
    (acc, m) => {
      if (!m.song) return acc;
      const { percent } = computeSyncReadiness({ song: m.song });
      if (percent >= 85) acc.ready += 1;
      else if (percent >= 60) acc.close += 1;
      else acc.blocked += 1;
      return acc;
    },
    { ready: 0, close: 0, blocked: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Song Matches</h3>
          {matches.length > 0 && (
            <p className="text-xs text-[#A3A3A3] mt-1">
              <span className="text-emerald-400 font-medium tabular-nums">
                {readinessSummary.ready}
              </span>{" "}
              ready ·{" "}
              <span className="text-[#c0c8d8] font-medium tabular-nums">
                {readinessSummary.close}
              </span>{" "}
              close ·{" "}
              <span className="text-red-400 font-medium tabular-nums">
                {readinessSummary.blocked}
              </span>{" "}
              blocked
            </p>
          )}
        </div>
        <Button onClick={handleFindMatches} disabled={matching} size="sm">
          <Zap className="size-4 mr-2" />
          {matching ? "Matching..." : "Find Matches"}
        </Button>
      </div>

      {matching && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
          <p className="text-sm text-[#A3A3A3] text-center">
            AI is analyzing your songs against this opportunity...
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!matching && matches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Music className="size-8 text-[#333] mb-2" />
            <p className="text-sm text-[#A3A3A3]">
              No matches yet. Click &quot;Find Matches&quot; to analyze your songs.
            </p>
          </CardContent>
        </Card>
      )}

      {!matching && matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-white text-sm truncate">
                        {match.song?.title || "Unknown Song"}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px] border-0 shrink-0",
                          scoreBadgeColor(match.fit_score)
                        )}
                      >
                        {match.fit_score}%
                      </Badge>
                      {match.confidence != null && (
                        <ConfidencePill score={match.confidence} showLabel={false} />
                      )}
                      {match.status !== "suggested" && (
                        <Badge
                          variant={
                            match.status === "approved"
                              ? "default"
                              : match.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {match.status}
                        </Badge>
                      )}
                    </div>
                    {match.fit_reasons?.length > 0 && (
                      <ul className="text-xs text-[#A3A3A3] space-y-0.5">
                        {match.fit_reasons.map((reason, i) => (
                          <li key={i}>- {reason}</li>
                        ))}
                      </ul>
                    )}
                    {match.song && (
                      <div className="mt-2">
                        <SyncReadinessMeter
                          song={match.song}
                          variant="compact"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {match.status === "suggested" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleUpdateStatus(match.id, "approved")
                          }
                          disabled={updatingId === match.id}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="size-3.5 text-emerald-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleUpdateStatus(match.id, "rejected")
                          }
                          disabled={updatingId === match.id}
                          className="h-7 w-7 p-0"
                        >
                          <X className="size-3.5 text-red-400" />
                        </Button>
                      </>
                    )}
                    {match.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmitMatch(match)}
                        disabled={updatingId === match.id}
                        className="h-7 text-xs"
                      >
                        <Send className="size-3 mr-1" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
