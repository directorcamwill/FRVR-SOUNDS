"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Handshake,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { KnowledgeLink } from "@/components/learn/knowledge-link";
import type { RevenueSummary, Deal, RevenueGoal, RevenueStream } from "@/types/financial";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MissingInfo {
  missing_count: number;
  total_songs: number;
  songs: {
    song: { id: string; title: string };
    missing_types: string[];
    is_complete: boolean;
  }[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

const REVENUE_TYPE_LABELS: Record<string, string> = {
  streaming: "Streaming",
  sync: "Sync Licensing",
  pro_royalties: "PRO Royalties",
  publishing: "Publishing",
  brand_deal: "Brand Deals",
  touring: "Touring",
  merch: "Merch",
  other: "Other",
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  exclusive: "Exclusive",
  non_exclusive: "Non-Exclusive",
  sync_placement: "Sync Placement",
  brand_deal: "Brand Deal",
  other: "Other",
};

export default function MoneyPage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [missing, setMissing] = useState<MissingInfo | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [goals, setGoals] = useState<RevenueGoal[]>([]);
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Dialog states
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, missingRes, dealsRes, goalsRes, streamsRes] =
        await Promise.all([
          fetch("/api/revenue"),
          fetch("/api/registrations"),
          fetch("/api/deals"),
          fetch("/api/revenue/goals"),
          fetch("/api/revenue/streams"),
        ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (missingRes.ok) setMissing(await missingRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (streamsRes.ok) setStreams(await streamsRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleRoyaltyScan() {
    setScanning(true);
    try {
      await fetch("/api/agents/royalty-scan", { method: "POST" });
      const res = await fetch("/api/registrations");
      if (res.ok) setMissing(await res.json());
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  }

  async function handleAddIncome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/revenue/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream_id: fd.get("stream_id"),
          amount: Number(fd.get("amount")),
          received_date: fd.get("received_date"),
          source: fd.get("source") || null,
          notes: fd.get("notes") || null,
        }),
      });
      setShowAddIncome(false);
      fetchAll();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_type: fd.get("deal_type"),
          partner: fd.get("partner"),
          description: fd.get("description") || null,
          fee_amount: fd.get("fee_amount") ? Number(fd.get("fee_amount")) : null,
          status: "active",
        }),
      });
      setShowAddDeal(false);
      fetchAll();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleAddGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/revenue/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          goal_amount: Number(fd.get("goal_amount")),
          target_date: fd.get("target_date") || null,
        }),
      });
      setShowAddGoal(false);
      fetchAll();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStream(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/revenue/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fd.get("type"),
          platform: fd.get("platform") || null,
          description: fd.get("description") || null,
        }),
      });
      setShowAddStream(false);
      fetchAll();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const activeDeals = deals.filter((d) => d.status === "active" || d.status === "pending");
  const activeGoals = goals.filter((g) => g.status === "active");
  const trendPercent =
    summary && summary.last_month > 0
      ? ((summary.this_month - summary.last_month) / summary.last_month) * 100
      : 0;
  const trendUp = trendPercent >= 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-[#1A1A1A]" />
          ))}
        </div>
        <Skeleton className="h-64 bg-[#1A1A1A]" />
        <Skeleton className="h-48 bg-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">Total Income</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
                <p className="text-xs text-[#666] mt-1">All time</p>
              </div>
              <div className="size-10 rounded-full bg-emerald-400/10 flex items-center justify-center">
                <DollarSign className="size-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(summary?.this_month || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {trendUp ? (
                    <TrendingUp className="size-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="size-3 text-red-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs",
                      trendUp ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {trendPercent === 0 ? "--" : `${Math.abs(trendPercent).toFixed(0)}%`}
                  </span>
                  <span className="text-xs text-[#666]">vs last month</span>
                </div>
              </div>
              <div className="size-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center">
                <TrendingUp className="size-5 text-[#DC2626]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">Missing Registrations</p>
                <p
                  className={cn(
                    "text-2xl font-bold mt-1",
                    (missing?.missing_count || 0) > 0 ? "text-red-400" : "text-emerald-400"
                  )}
                >
                  {missing?.missing_count || 0}
                </p>
                <p className="text-xs text-[#666] mt-1">
                  of {missing?.total_songs || 0} songs
                </p>
              </div>
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center",
                  (missing?.missing_count || 0) > 0
                    ? "bg-red-400/10"
                    : "bg-emerald-400/10"
                )}
              >
                {(missing?.missing_count || 0) > 0 ? (
                  <AlertTriangle className="size-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">Active Deals</p>
                <p className="text-2xl font-bold text-white mt-1">{activeDeals.length}</p>
                <p className="text-xs text-[#666] mt-1">{deals.length} total</p>
              </div>
              <div className="size-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center">
                <Handshake className="size-5 text-[#DC2626]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-[#111111] border-[#1A1A1A]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Revenue Overview</CardTitle>
            <Dialog open={showAddStream} onOpenChange={setShowAddStream}>
              <DialogTrigger render={<Button variant="ghost" size="sm" className="text-[#DC2626] hover:text-[#DC2626]/80"><Plus className="size-4 mr-1" /> Add Stream</Button>} />
              <DialogContent className="bg-[#111111] border-[#1A1A1A]">
                <DialogHeader>
                  <DialogTitle className="text-white">Set Up Revenue Stream</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStream} className="space-y-4">
                  <div>
                    <Label className="text-[#A3A3A3]">Type</Label>
                    <Select name="type" required>
                      <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REVENUE_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Platform</Label>
                    <Input name="platform" className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. Spotify, ASCAP" />
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Description</Label>
                    <Input name="description" className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Create Stream"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {summary && summary.monthly.some((m) => m.total > 0) ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly}>
                  <XAxis dataKey="month" tick={{ fill: "#A3A3A3", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A3A3A3", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {summary.monthly.map((_, i) => (
                      <Cell key={i} fill={i === summary.monthly.length - 1 ? "#DC2626" : "#333"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-[#666]">
              <div className="text-center">
                <DollarSign className="size-8 mx-auto mb-2 opacity-50" />
                <p>No revenue data yet</p>
                <p className="text-sm mt-1">Add income entries to see your chart</p>
              </div>
            </div>
          )}

          {/* Revenue by Type */}
          {summary && summary.by_type.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {summary.by_type.map((item) => (
                <div key={item.type} className="bg-black rounded-lg p-3">
                  <p className="text-xs text-[#A3A3A3]">{REVENUE_TYPE_LABELS[item.type] || item.type}</p>
                  <p className="text-sm font-semibold text-white mt-1">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Royalties Alert */}
      <Card
        className={cn(
          "border-2",
          (missing?.missing_count || 0) > 0
            ? "bg-red-950/20 border-red-500/40"
            : "bg-emerald-950/20 border-emerald-500/40"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle
              className={cn(
                "text-base flex items-center gap-2",
                (missing?.missing_count || 0) > 0 ? "text-red-400" : "text-emerald-400"
              )}
            >
              {(missing?.missing_count || 0) > 0 ? (
                <>
                  <AlertTriangle className="size-5" />
                  You May Be Losing Money
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5" />
                  All Registrations Complete
                </>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRoyaltyScan}
              disabled={scanning}
              className="text-[#A3A3A3] hover:text-white"
            >
              {scanning ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              {scanning ? "Scanning..." : "Re-scan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(missing?.missing_count || 0) > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-red-300/70">
                {missing?.missing_count} of {missing?.total_songs} songs have missing registrations.
                Every missing registration means potential royalties you are not collecting.
              </p>
              <KnowledgeLink topicId="royalties-overview" label="How Royalties Work" className="mt-1" />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {missing?.songs
                  .filter((s) => !s.is_complete)
                  .slice(0, 10)
                  .map((s) => (
                    <div
                      key={s.song.id}
                      className="flex items-center justify-between bg-black/50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-white">{s.song.title}</p>
                        <div className="flex gap-1 mt-1">
                          {s.missing_types.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 uppercase"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link href="/money/registrations">
                        <Button variant="ghost" size="sm" className="text-[#DC2626]">
                          Fix <ArrowRight className="size-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
              </div>
              <Link href="/money/registrations">
                <Button variant="ghost" size="sm" className="text-[#DC2626]">
                  View All Registrations <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-emerald-300/70">
              All your songs have complete registrations across PRO, MLC, SoundExchange, Publishing Admin, and ISRC. Great job!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Deals */}
      <Card className="bg-[#111111] border-[#1A1A1A]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Active Deals</CardTitle>
            <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
              <DialogTrigger render={<Button variant="ghost" size="sm" className="text-[#DC2626] hover:text-[#DC2626]/80"><Plus className="size-4 mr-1" /> Add Deal</Button>} />
              <DialogContent className="bg-[#111111] border-[#1A1A1A]">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Deal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDeal} className="space-y-4">
                  <div>
                    <Label className="text-[#A3A3A3]">Partner</Label>
                    <Input name="partner" required className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Type</Label>
                    <Select name="deal_type" required>
                      <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEAL_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Fee Amount ($)</Label>
                    <Input name="fee_amount" type="number" step="0.01" className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Description</Label>
                    <Input name="description" className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Add Deal"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activeDeals.length > 0 ? (
            <div className="space-y-2">
              {activeDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between bg-black rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{deal.partner}</p>
                    <p className="text-xs text-[#A3A3A3]">
                      {DEAL_TYPE_LABELS[deal.deal_type] || deal.deal_type}
                      {deal.description && ` - ${deal.description}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {deal.fee_amount && (
                      <p className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(deal.fee_amount)}
                      </p>
                    )}
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full uppercase font-medium",
                        deal.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      )}
                    >
                      {deal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[#666]">
              <Handshake className="size-8 mx-auto mb-2 opacity-50" />
              <p>No active deals yet</p>
              <p className="text-sm mt-1">Track your sync placements, brand deals, and partnerships</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Goals */}
      <Card className="bg-[#111111] border-[#1A1A1A]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Revenue Goals</CardTitle>
            <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
              <DialogTrigger render={<Button variant="ghost" size="sm" className="text-[#DC2626] hover:text-[#DC2626]/80"><Plus className="size-4 mr-1" /> Add Goal</Button>} />
              <DialogContent className="bg-[#111111] border-[#1A1A1A]">
                <DialogHeader>
                  <DialogTitle className="text-white">Set Revenue Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div>
                    <Label className="text-[#A3A3A3]">Title</Label>
                    <Input name="title" required className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. Q2 Sync Income" />
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Goal Amount ($)</Label>
                    <Input name="goal_amount" type="number" step="0.01" required className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <div>
                    <Label className="text-[#A3A3A3]">Target Date</Label>
                    <Input name="target_date" type="date" className="bg-black border-[#1A1A1A] text-white" />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Set Goal"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const pct = goal.goal_amount > 0 ? (goal.current_amount / goal.goal_amount) * 100 : 0;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{goal.title}</p>
                      <p className="text-xs text-[#A3A3A3]">
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.goal_amount)}
                      </p>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2 bg-[#1A1A1A]" />
                    {goal.target_date && (
                      <p className="text-xs text-[#666]">
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-[#666]">
              <Target className="size-8 mx-auto mb-2 opacity-50" />
              <p>No goals set</p>
              <p className="text-sm mt-1">Set revenue targets to track your progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
          <DialogTrigger render={
            <Button
              variant="outline"
              className="h-auto py-4 bg-[#111111] border-[#1A1A1A] text-white hover:bg-[#1A1A1A] hover:text-[#DC2626]"
            >
              <DollarSign className="size-5 mr-2" />
              <div className="text-left">
                <p className="font-medium">Add Income</p>
                <p className="text-xs text-[#666]">Record a revenue entry</p>
              </div>
            </Button>
          } />
          <DialogContent className="bg-[#111111] border-[#1A1A1A]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Income Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <Label className="text-[#A3A3A3]">Revenue Stream</Label>
                {streams.length > 0 ? (
                  <Select name="stream_id" required>
                    <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {REVENUE_TYPE_LABELS[s.type] || s.type}
                          {s.platform && ` (${s.platform})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-[#666] mt-1">
                    Create a revenue stream first using the chart section above.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Amount ($)</Label>
                <Input name="amount" type="number" step="0.01" required className="bg-black border-[#1A1A1A] text-white" />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Received Date</Label>
                <Input name="received_date" type="date" required className="bg-black border-[#1A1A1A] text-white" />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Source</Label>
                <Input name="source" className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. DistroKid Q1 payout" />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Notes</Label>
                <Input name="notes" className="bg-black border-[#1A1A1A] text-white" />
              </div>
              <Button type="submit" disabled={saving || streams.length === 0} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Add Entry"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Link href="/money/splits">
          <Button
            variant="outline"
            className="h-auto py-4 w-full bg-[#111111] border-[#1A1A1A] text-white hover:bg-[#1A1A1A] hover:text-[#DC2626]"
          >
            <XCircle className="size-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Manage Splits</p>
              <p className="text-xs text-[#666]">Song ownership & percentages</p>
            </div>
          </Button>
        </Link>

        <Link href="/money/registrations">
          <Button
            variant="outline"
            className="h-auto py-4 w-full bg-[#111111] border-[#1A1A1A] text-white hover:bg-[#1A1A1A] hover:text-[#DC2626]"
          >
            <AlertTriangle className="size-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Check Registrations</p>
              <p className="text-xs text-[#666]">Find missing royalty registrations</p>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
}
