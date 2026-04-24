"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS, type PlanId } from "@/lib/plans";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface AccountDetail {
  artist: {
    id: string;
    artist_name: string;
    created_at: string;
    profile_id: string;
  } | null;
  subscription: {
    plan_id: string;
    status: string;
    current_period_ends_at: string | null;
    stripe_customer_id: string | null;
    created_at: string;
  } | null;
  brand_wiki?: { updated_at: string; artist_description: string | null } | null;
  songs: Array<{
    id: string;
    title: string;
    status: string;
    brand_fit_status: {
      overall_score?: number;
      alignment_tier?: string;
    } | null;
    created_at: string;
  }>;
  song_lab_projects: Array<{
    id: string;
    title: string;
    status: string;
    updated_at: string;
  }>;
  agent_logs: Array<{
    agent_type: string;
    action: string;
    summary: string;
    tokens_used: number | null;
    created_at: string;
  }>;
  agent_usage_by_type: Record<string, { count: number; tokens: number }>;
  alerts: Array<{
    id: string;
    agent_type: string;
    severity: string;
    title: string;
    message: string;
    created_at: string;
  }>;
  summary: {
    total_songs: number;
    total_song_lab_projects: number;
    total_agent_runs: number;
    total_alerts: number;
    last_agent_run: string | null;
    last_song_added: string | null;
  };
}

export function AccountDetailDialog({
  artistId,
  onClose,
}: {
  artistId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (!artistId) {
      setData(null);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/accounts/${artistId}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId]);

  const open = !!artistId;
  const plan = data?.subscription?.plan_id
    ? PLANS[data.subscription.plan_id as PlanId]
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        {loading || !data ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{data.artist?.artist_name ?? "Account"}</DialogTitle>
              <DialogDescription>
                Joined{" "}
                {data.artist
                  ? new Date(data.artist.created_at).toLocaleDateString()
                  : "—"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {plan && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                  >
                    {plan.name}
                  </Badge>
                )}
                {data.subscription?.status && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#111] capitalize"
                  >
                    {data.subscription.status}
                  </Badge>
                )}
                {data.subscription?.stripe_customer_id ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  >
                    Stripe linked
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#111] text-[#666]"
                  >
                    No Stripe
                  </Badge>
                )}
              </div>

              {artistId && (
                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] p-2.5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 shrink-0">
                    Change plan
                  </span>
                  <select
                    disabled={planSaving}
                    value={data.subscription?.plan_id ?? "starter"}
                    onChange={async (e) => {
                      const planId = e.target.value as PlanId;
                      if (planId === data.subscription?.plan_id) return;
                      setPlanSaving(true);
                      try {
                        const res = await fetch(
                          `/api/admin/accounts/${artistId}/plan`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ plan_id: planId }),
                          },
                        );
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(body?.error ?? "Update failed");
                        toast.success(`Plan → ${PLANS[planId].name}`);
                        const refreshed = await fetch(
                          `/api/admin/accounts/${artistId}`,
                        );
                        if (refreshed.ok) setData(await refreshed.json());
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Update failed",
                        );
                      } finally {
                        setPlanSaving(false);
                      }
                    }}
                    className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    {Object.keys(PLANS).map((id) => (
                      <option key={id} value={id}>
                        {PLANS[id as PlanId].name}
                      </option>
                    ))}
                  </select>
                  {planSaving && (
                    <Loader2 className="size-3.5 animate-spin text-white/50" />
                  )}
                  <button
                    type="button"
                    disabled={impersonating}
                    onClick={async () => {
                      setImpersonating(true);
                      try {
                        const res = await fetch("/api/admin/impersonate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ artist_id: artistId }),
                        });
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok)
                          throw new Error(body?.error ?? "Failed to start");
                        toast.success("Now viewing as this artist.");
                        window.location.href = "/command-center";
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Failed to start",
                        );
                      } finally {
                        setImpersonating(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-100 hover:bg-amber-500/20 disabled:opacity-50 shrink-0"
                  >
                    {impersonating ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Eye className="size-3" />
                    )}
                    View as
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <SummaryTile label="Songs" value={data.summary.total_songs} />
                <SummaryTile
                  label="Song Lab"
                  value={data.summary.total_song_lab_projects}
                />
                <SummaryTile
                  label="Agent runs"
                  value={data.summary.total_agent_runs}
                />
                <SummaryTile
                  label="Alerts"
                  value={data.summary.total_alerts}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#A3A3A3]">
                <div>
                  Last agent run:{" "}
                  <span className="text-white">
                    {data.summary.last_agent_run
                      ? new Date(data.summary.last_agent_run).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div>
                  Last song added:{" "}
                  <span className="text-white">
                    {data.summary.last_song_added
                      ? new Date(data.summary.last_song_added).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>

              {Object.keys(data.agent_usage_by_type).length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1.5">
                    Agent usage
                  </p>
                  <div className="space-y-1">
                    {Object.entries(data.agent_usage_by_type)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([agent, stats]) => (
                        <div
                          key={agent}
                          className="flex items-center justify-between text-xs border-b border-[#151515] py-1"
                        >
                          <span className="text-white">{agent}</span>
                          <span className="text-[#A3A3A3] tabular-nums">
                            {stats.count} runs · {stats.tokens.toLocaleString()}{" "}
                            tokens
                          </span>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {data.songs.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1.5">
                    Songs ({data.songs.length})
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {data.songs.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs border-b border-[#151515] py-1"
                      >
                        <div className="min-w-0 truncate">
                          <span className="text-white">{s.title}</span>
                          <span className="text-[#666] ml-2">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-[#111] capitalize"
                          >
                            {s.status}
                          </Badge>
                          {s.brand_fit_status?.overall_score != null && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                            >
                              BF {s.brand_fit_status.overall_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.alerts.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1.5">
                    Recent alerts
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {data.alerts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded border border-[#1A1A1A] bg-[#0B0B0B] p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-white font-medium truncate">
                            {a.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30 capitalize"
                          >
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                          {a.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.agent_logs.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1.5">
                    Recent agent runs
                  </p>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {data.agent_logs.map((l, i) => (
                      <div
                        key={`${l.created_at}-${i}`}
                        className="text-[11px] text-[#A3A3A3] flex justify-between gap-2 border-b border-[#151515] py-0.5"
                      >
                        <span className="truncate">
                          <span className="text-white">{l.agent_type}</span>{" "}
                          · {l.summary}
                        </span>
                        <span className="shrink-0 text-[#555] tabular-nums">
                          {new Date(l.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-2">
      <p className="text-[10px] uppercase tracking-wider text-[#666]">
        {label}
      </p>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}
