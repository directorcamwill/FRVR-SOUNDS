"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Activity as ActivityIcon,
  ArrowRight,
  BarChart3,
  Inbox,
  Library as LibraryIcon,
  Megaphone,
  Plus,
  Shield,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PLANS, visiblePricingPlans, type PlanId } from "@/lib/plans";
import { AccountDetailDialog } from "@/components/admin/account-detail-dialog";
import { SparklineBar } from "@/components/admin/sparkline-bar";
import { AutomationControl } from "@/components/admin/automation-control";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";

interface AccountRow {
  id: string;
  artist_name: string;
  profile_id: string;
  created_at: string;
  subscriptions: Array<{
    plan_id: string;
    status: string;
    current_period_ends_at: string | null;
    stripe_customer_id: string | null;
  }> | null;
}

interface Metrics {
  totals: {
    accounts: number;
    paying_accounts: number;
    mrr_cents: number;
    songs: number;
    agent_calls_all_time: number;
    agent_calls_30d: number;
    low_confidence_alerts: number;
    library_submissions: number;
  };
  signups: { last_7d: number; last_30d: number };
  accounts_by_plan: Record<string, number>;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: "info" | "feature" | "warning" | "maintenance";
  target_plan_ids: string[];
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string;
  ends_at: string | null;
  dismissible: boolean;
  created_at: string;
}

const severityStyles: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  feature: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  maintenance: "bg-red-500/10 text-red-400 border-red-500/30",
};

interface TrendSeries {
  days: number;
  signups: Array<{ date: string; count: number }>;
  songs: Array<{ date: string; count: number }>;
  agent_calls: Array<{ date: string; count: number }>;
  alerts: Array<{ date: string; count: number }>;
  library_submissions: Array<{ date: string; count: number }>;
}

interface ActivityRow {
  id: string;
  kind:
    | "signup"
    | "song_added"
    | "agent_run"
    | "alert"
    | "library_submission"
    | "announcement"
    | "subscription_change";
  at: string;
  artist_id?: string | null;
  artist_name?: string | null;
  title: string;
  detail?: string | null;
  href?: string | null;
  severity?: "info" | "warning" | "error";
}

const kindStyles: Record<string, string> = {
  signup: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  song_added: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  agent_run: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30",
  alert: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  library_submission: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  announcement: "bg-[#111] text-white border-[#333]",
  subscription_change: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export default function AdminPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [trends, setTrends] = useState<TrendSeries | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [trendsDays, setTrendsDays] = useState<30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [openArtistId, setOpenArtistId] = useState<string | null>(null);
  const [libraryCounts, setLibraryCounts] = useState<{
    pending: number;
    catalog: number;
    pitches: number;
    placed: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m, ann, t, act, subs, deals, pitches] = await Promise.all([
        fetch("/api/admin/accounts").then((r) => r.json()),
        fetch("/api/admin/metrics").then((r) => r.json()),
        fetch("/api/admin/announcements").then((r) => r.json()),
        fetch(`/api/admin/timeseries?days=${trendsDays}`).then((r) => r.json()),
        fetch("/api/admin/activity?limit=60").then((r) => r.json()),
        fetch("/api/library/submissions").then((r) => r.json()),
        fetch("/api/library/deals").then((r) => r.json()),
        fetch("/api/library/pitches").then((r) => r.json()),
      ]);
      setAccounts(a.accounts ?? []);
      setMetrics(m);
      setAnnouncements(ann.announcements ?? []);
      setTrends(t);
      setActivity(act.activity ?? []);

      const submissions = subs.submissions ?? [];
      const catalog = deals.deals ?? [];
      const allPitches = pitches.pitches ?? [];
      setLibraryCounts({
        pending: submissions.filter(
          (s: { status: string }) =>
            s.status === "pending" || s.status === "reviewing",
        ).length,
        catalog: catalog.length,
        pitches: allPitches.length,
        placed: allPitches.filter((p: { status: string }) => p.status === "placed")
          .length,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [trendsDays]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live feed — poll activity every 30s while the page is open
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/activity?limit=60");
        if (res.ok) {
          const data = await res.json();
          setActivity(data.activity ?? []);
        }
      } catch {
        // ignore
      }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#DC2626]/10 p-2 border border-[#DC2626]/30">
          <Shield className="size-5 text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Operator Console</h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl mt-1">
            Cross-tenant view. Accounts, platform metrics, and broadcast
            announcements. Super-admin only.
          </p>
        </div>
      </div>

      <AutomationControl />

      <Tabs defaultValue="metrics">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="metrics">
            <BarChart3 className="size-3.5 mr-1.5" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="size-3.5 mr-1.5" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="activity">
            <ActivityIcon className="size-3.5 mr-1.5" />
            Activity{" "}
            <span className="ml-1.5 text-[10px] text-[#666]">
              ({activity.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Users className="size-3.5 mr-1.5" />
            Accounts{" "}
            <span className="ml-1.5 text-[10px] text-[#666]">
              ({accounts.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="size-3.5 mr-1.5" />
            Announcements{" "}
            <span className="ml-1.5 text-[10px] text-[#666]">
              ({announcements.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="library">
            <LibraryIcon className="size-3.5 mr-1.5" />
            Library{" "}
            {libraryCounts && libraryCounts.pending > 0 && (
              <span className="ml-1.5 text-[10px] text-[#DC2626]">
                ({libraryCounts.pending})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Megaphone className="size-3.5 mr-1.5" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-4">
          {loading || !metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricTile
                  label="Accounts"
                  value={metrics.totals.accounts}
                  hint={`+${metrics.signups.last_7d} in 7d · +${metrics.signups.last_30d} in 30d`}
                />
                <MetricTile
                  label="Paying"
                  value={metrics.totals.paying_accounts}
                  hint={`${metrics.totals.accounts ? Math.round((metrics.totals.paying_accounts / metrics.totals.accounts) * 100) : 0}% conversion`}
                />
                <MetricTile
                  label="MRR"
                  value={`$${(metrics.totals.mrr_cents / 100).toLocaleString()}`}
                  hint="active + trialing subs"
                />
                <MetricTile
                  label="Songs"
                  value={metrics.totals.songs}
                  hint="across all artists"
                />
                <MetricTile
                  label="Agent Calls"
                  value={metrics.totals.agent_calls_30d}
                  hint={`${metrics.totals.agent_calls_all_time} all-time`}
                />
                <MetricTile
                  label="Low-Conf Alerts"
                  value={metrics.totals.low_confidence_alerts}
                  hint="needs human review"
                />
                <MetricTile
                  label="Library Subs"
                  value={metrics.totals.library_submissions}
                  hint="intake total"
                />
                <MetricTile
                  label="Low-Conf %"
                  value={
                    metrics.totals.agent_calls_all_time
                      ? `${Math.round((metrics.totals.low_confidence_alerts / metrics.totals.agent_calls_all_time) * 100)}%`
                      : "—"
                  }
                  hint="alerts / agent calls"
                />
              </div>

              <Card>
                <CardContent className="py-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#666]">
                    Accounts by plan
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(metrics.accounts_by_plan).map(
                      ([planId, count]) => {
                        const plan = PLANS[planId as PlanId];
                        return (
                          <div
                            key={planId}
                            className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-3"
                          >
                            <p className="text-[10px] uppercase tracking-wider text-[#666]">
                              {plan?.name ?? planId}
                            </p>
                            <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                              {count}
                            </p>
                            {plan?.priceMonthly != null ? (
                              <p className="text-[10px] text-[#A3A3A3]">
                                ${plan.priceMonthly}/mo
                              </p>
                            ) : (
                              <p className="text-[10px] text-[#666]">—</p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <div className="flex items-center justify-end gap-2 mb-3">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setTrendsDays(d as 30 | 60 | 90)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                  trendsDays === d
                    ? "bg-[#DC2626] text-white border-[#DC2626]"
                    : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A]"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          {loading || !trends ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4">
                  <SparklineBar data={trends.signups} label="Signups" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <SparklineBar data={trends.agent_calls} label="Agent calls" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <SparklineBar data={trends.songs} label="Songs added" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <SparklineBar
                    data={trends.library_submissions}
                    label="Library submissions"
                  />
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="py-4">
                  <SparklineBar
                    data={trends.alerts}
                    label="Low-confidence alerts"
                    accent="#f59e0b"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-[#666] mb-2">
            Live feed · last 72 hours · refreshes every 30s
          </p>
          {loading ? (
            <Skeleton className="h-64" />
          ) : activity.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ActivityIcon className="size-8 text-[#333] mx-auto mb-2" />
                <p className="text-sm text-[#A3A3A3]">
                  Nothing happened in the last 72 hours. Quiet platform.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {activity.map((a) => {
                const body = (
                  <div className="flex items-start gap-3 rounded-lg border border-[#1A1A1A] bg-[#0B0B0B] p-2.5 hover:border-[#DC2626]/40 transition-colors">
                    <Badge
                      variant="outline"
                      className={`text-[9px] shrink-0 capitalize ${kindStyles[a.kind] ?? ""}`}
                    >
                      {a.kind.replace(/_/g, " ")}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{a.title}</p>
                      {a.detail && (
                        <p className="text-[11px] text-[#A3A3A3] truncate">
                          {a.detail}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[#555] shrink-0 tabular-nums">
                      {new Date(a.at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
                return a.artist_id && a.kind !== "announcement" ? (
                  <button
                    key={a.id}
                    onClick={() => setOpenArtistId(a.artist_id!)}
                    className="w-full text-left"
                  >
                    {body}
                  </button>
                ) : (
                  <div key={a.id}>{body}</div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          {loading ? (
            <Skeleton className="h-64" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-[#A3A3A3]">No accounts yet.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => {
                const sub = a.subscriptions?.[0];
                const plan = PLANS[(sub?.plan_id ?? "internal") as PlanId];
                return (
                  <button
                    key={a.id}
                    onClick={() => setOpenArtistId(a.id)}
                    className="w-full text-left"
                  >
                    <Card className="hover:border-[#DC2626]/40 transition-colors">
                      <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {a.artist_name}
                          </p>
                          <p className="text-[11px] text-[#A3A3A3]">
                            Joined{" "}
                            {new Date(a.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                          >
                            {plan?.name ?? sub?.plan_id ?? "—"}
                          </Badge>
                          {sub?.status && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-[#111] capitalize"
                            >
                              {sub.status}
                            </Badge>
                          )}
                          {sub?.stripe_customer_id ? (
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
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setComposerOpen(true)}>
              <Plus className="size-3.5 mr-1.5" />
              New announcement
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-32" />
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Megaphone className="size-8 text-[#333] mx-auto mb-2" />
                <p className="text-sm text-[#A3A3A3]">
                  No announcements yet. Broadcast a new feature, maintenance
                  window, or heads-up.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">
                            {a.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] capitalize ${severityStyles[a.severity]}`}
                          >
                            {a.severity}
                          </Badge>
                          {a.target_plan_ids.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-[#111]"
                            >
                              → {a.target_plan_ids.join(", ")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#D4D4D4] mt-1 leading-relaxed">
                          {a.body}
                        </p>
                        <p className="text-[10px] text-[#666] mt-1">
                          {new Date(a.starts_at).toLocaleString()}
                          {a.ends_at
                            ? ` → ${new Date(a.ends_at).toLocaleString()}`
                            : " (no expiry)"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm("Delete this announcement?")) return;
                          await fetch(
                            `/api/admin/announcements/${a.id}`,
                            { method: "DELETE" }
                          );
                          toast.success("Announcement deleted");
                          refresh();
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Pending Review"
              value={libraryCounts?.pending ?? "—"}
              hint="Submissions awaiting decision"
            />
            <MetricTile
              label="Catalog"
              value={libraryCounts?.catalog ?? "—"}
              hint="Signed deals live"
            />
            <MetricTile
              label="Pitches Sent"
              value={libraryCounts?.pitches ?? "—"}
              hint="Across all deals"
            />
            <MetricTile
              label="Placed"
              value={libraryCounts?.placed ?? "—"}
              hint="Sync wins"
            />
          </div>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#DC2626]/10 p-2.5 border border-[#DC2626]/30 shrink-0">
                  <Inbox className="size-5 text-[#DC2626]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    FRVR Sounds Library Inbox
                  </h3>
                  <p className="text-xs text-[#A3A3A3] mt-1 max-w-xl leading-relaxed">
                    Review inbound artist submissions (from the public{" "}
                    <Link
                      href="/submit"
                      target="_blank"
                      className="text-[#DC2626] hover:text-red-300"
                    >
                      /submit
                    </Link>{" "}
                    form), manage the signed catalog, and track pitches sent to
                    supervisors + studios. Operator-only view.
                  </p>
                  {libraryCounts && libraryCounts.pending > 0 && (
                    <p className="text-xs text-[#DC2626] mt-2 font-medium">
                      {libraryCounts.pending} submission
                      {libraryCounts.pending === 1 ? "" : "s"} waiting for review.
                    </p>
                  )}
                </div>
                <Link
                  href="/library"
                  className="shrink-0 inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
                >
                  Open Library
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/library?tab=submissions"
              className="block rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] hover:border-[#DC2626]/40 transition-colors p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Intake
              </p>
              <p className="text-sm font-semibold text-white">Submissions</p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Review artist submissions, accept or reject, sign deals.
              </p>
            </Link>
            <Link
              href="/library?tab=catalog"
              className="block rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] hover:border-[#DC2626]/40 transition-colors p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Catalog
              </p>
              <p className="text-sm font-semibold text-white">Signed Deals</p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Represented songs. Pitch them to supervisors + studios.
              </p>
            </Link>
            <Link
              href="/library?tab=pitches"
              className="block rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] hover:border-[#DC2626]/40 transition-colors p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">
                Outreach
              </p>
              <p className="text-sm font-semibold text-white">Pitches</p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">
                Live brief links, view tracking, pitch status.
              </p>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-4">
          <BroadcastComposer />
        </TabsContent>
      </Tabs>

      <AnnouncementComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onDone={() => {
          setComposerOpen(false);
          refresh();
        }}
      />

      <AccountDetailDialog
        artistId={openArtistId}
        onClose={() => setOpenArtistId(null)}
      />
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-[10px] uppercase tracking-wider text-[#666]">
          {label}
        </p>
        <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
          {value}
        </p>
        {hint && <p className="text-[10px] text-[#A3A3A3] mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function AnnouncementComposer({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<
    "info" | "feature" | "warning" | "maintenance"
  >("feature");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [targetPlans, setTargetPlans] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const togglePlan = (id: string) => {
    setTargetPlans((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!title || !body) {
      toast.error("Title and body required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          severity,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          target_plan_ids: targetPlans,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Announcement sent");
      setTitle("");
      setBody("");
      setCtaLabel("");
      setCtaUrl("");
      setTargetPlans([]);
      onDone();
    } catch {
      toast.error("Could not create announcement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>
            Broadcast to all accounts, or filter to specific plans.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="annTitle">Title</Label>
            <Input
              id="annTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's new?"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="annBody">Body</Label>
            <textarea
              id="annBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Severity</Label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value as "info" | "feature" | "warning" | "maintenance"
                  )
                }
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                <option value="info">Info</option>
                <option value="feature">Feature</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ctaLabel">CTA label (optional)</Label>
              <Input
                id="ctaLabel"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1 col-span-2">
              <Label htmlFor="ctaUrl">CTA URL (optional)</Label>
              <Input
                id="ctaUrl"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="/sync-directory, /placements, etc."
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Target plans (empty = all)</Label>
            <div className="flex flex-wrap gap-1.5">
              {visiblePricingPlans().map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlan(p.id)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                    targetPlans.includes(p.id)
                      ? "bg-[#DC2626] text-white border-[#DC2626]"
                      : "bg-[#111] text-[#A3A3A3] border-[#1A1A1A]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={busy}>
            Broadcast
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
