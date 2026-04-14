"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Music, GitBranch, Send, Activity, RefreshCw, Loader2, Target, ListChecks } from "lucide-react";
import Link from "next/link";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { HealthWidget } from "@/components/dashboard/health-widget";
import { MotionCard, AnimatedNumber, GlowDot, GlowCard } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

interface OrchestratorResult {
  priority_actions: {
    title: string;
    description: string;
    urgency: "high" | "medium" | "low";
    action_url: string;
    category: string;
  }[];
  health_summary: string;
  focus_area: string;
}

interface HealthScore {
  overall_score: number;
  catalog_completeness: number;
  metadata_quality: number;
  deliverables_readiness: number;
  submission_activity: number;
  pipeline_health: number;
}

interface AgentLog {
  id: string;
  agent_type: string;
  action: string;
  summary: string;
  created_at: string;
  tokens_used?: number;
  duration_ms?: number;
}

export default function CommandCenterPage() {
  const [orchestrator, setOrchestrator] = useState<OrchestratorResult | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [activity, setActivity] = useState<AgentLog[]>([]);
  const [songCount, setSongCount] = useState(0);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);

  const [deliverablesSummary, setDeliverablesSummary] = useState<{
    total: number;
    completed: number;
    overall_percentage: number;
    deliverables: { id: string; title: string; current_count: number; target_count: number; category: string }[];
  } | null>(null);
  const [todayTasksSummary, setTodayTasksSummary] = useState<{
    total_today: number;
    done_today: number;
    total_overdue: number;
  } | null>(null);

  const [loadingOrchestrator, setLoadingOrchestrator] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOps, setLoadingOps] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [songsRes, oppsRes, subsRes] = await Promise.all([
        fetch("/api/songs"),
        fetch("/api/opportunities"),
        fetch("/api/submissions"),
      ]);
      if (songsRes.ok) {
        const songs = await songsRes.json();
        setSongCount(Array.isArray(songs) ? songs.length : 0);
      }
      if (oppsRes.ok) {
        const opps = await oppsRes.json();
        const active = Array.isArray(opps)
          ? opps.filter((o: { stage: string }) => !["won", "lost"].includes(o.stage))
          : [];
        setPipelineCount(active.length);
      }
      if (subsRes.ok) {
        const subs = await subsRes.json();
        setSubmissionCount(Array.isArray(subs) ? subs.length : 0);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (data?.overall_score !== undefined) setHealth(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setActivity(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  const fetchOps = useCallback(async () => {
    setLoadingOps(true);
    try {
      const [delRes, taskRes] = await Promise.all([
        fetch("/api/deliverables?summary=true"),
        fetch("/api/tasks/today"),
      ]);
      if (delRes.ok) {
        const data = await delRes.json();
        if (data?.total !== undefined) setDeliverablesSummary(data);
      }
      if (taskRes.ok) {
        const data = await taskRes.json();
        if (data?.total_today !== undefined) setTodayTasksSummary(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOps(false);
    }
  }, []);

  const runOrchestrator = useCallback(async () => {
    setLoadingOrchestrator(true);
    try {
      const res = await fetch("/api/agents", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOrchestrator(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOrchestrator(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchHealth();
    fetchActivity();
    runOrchestrator();
    fetchOps();
  }, [fetchStats, fetchHealth, fetchActivity, runOrchestrator, fetchOps]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      runOrchestrator(),
      fetchHealth(),
      fetchActivity(),
      fetchStats(),
      fetchOps(),
    ]);
    setRefreshing(false);
  };

  const stats = [
    { label: "Total Songs", value: loadingStats ? null : songCount, icon: Music },
    { label: "Active Pipeline", value: loadingStats ? null : pipelineCount, icon: GitBranch },
    { label: "Submissions", value: loadingStats ? null : submissionCount, icon: Send },
    {
      label: "Health Score",
      value: loadingHealth ? null : health ? health.overall_score : 0,
      icon: Activity,
      color: health
        ? health.overall_score >= 70
          ? "text-emerald-400"
          : health.overall_score >= 40
            ? "text-amber-400"
            : "text-red-400"
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <MotionCard className="relative overflow-hidden p-6" delay={0}>
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl font-bold text-white tracking-tight"
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm text-[#666] mt-1"
            >
              Your AI system is actively optimizing your career
            </motion.p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <GlowDot color="green" size="sm" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">System Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-[#1A1A1A] hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.1)]"
            >
              {refreshing ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="size-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </MotionCard>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <MotionCard key={stat.label} delay={0.1 + i * 0.08} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[#666]">
                  {stat.label}
                </span>
                <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Icon className="size-4 text-red-500" />
                </div>
              </div>
              {stat.value === null ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div
                  className={cn(
                    "text-3xl font-bold text-white tabular-nums",
                    stat.color
                  )}
                >
                  <AnimatedNumber value={stat.value} />
                </div>
              )}
            </MotionCard>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PriorityActions
            actions={orchestrator?.priority_actions || []}
            loading={loadingOrchestrator}
            healthSummary={orchestrator?.health_summary}
            focusArea={orchestrator?.focus_area}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ActivityFeed logs={activity} loading={loadingActivity} />
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <HealthWidget health={health} loading={loadingHealth} />
        </motion.div>

        {/* Pipeline Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <GlowCard className="p-5 h-full">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <GitBranch className="size-4 text-red-500" />
              Pipeline Summary
            </h3>
            {loadingStats ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : pipelineCount === 0 ? (
              <p className="text-sm text-[#666]">
                No active opportunities. Check the Intelligence page for new leads.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#666]">Active Opportunities</span>
                  <span className="text-white font-medium tabular-nums">{pipelineCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#666]">Total Submissions</span>
                  <span className="text-white font-medium tabular-nums">{submissionCount}</span>
                </div>
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>

      {/* Operations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deliverables Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <GlowCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="size-4 text-red-500" />
                Deliverables Progress
              </h3>
              <Link href="/deliverables" className="text-xs text-red-500 hover:text-red-400 transition-colors">
                View All
              </Link>
            </div>
            {loadingOps ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : !deliverablesSummary ? (
              <p className="text-sm text-[#666]">No deliverables tracked yet.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#666]">Overall</span>
                  <span className="text-white font-medium">{deliverablesSummary.overall_percentage}%</span>
                </div>
                <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${deliverablesSummary.overall_percentage}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-600 to-emerald-400 rounded-full"
                  />
                </div>
                {deliverablesSummary.deliverables.slice(0, 3).map((d) => {
                  const pct = d.target_count > 0 ? Math.min(100, Math.round((d.current_count / d.target_count) * 100)) : 0;
                  return (
                    <div key={d.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#666]">{d.title}</span>
                        <span className="text-white tabular-nums">{d.current_count}/{d.target_count}</span>
                      </div>
                      <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            pct >= 100 ? "bg-emerald-500" : "bg-red-600"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlowCard>
        </motion.div>

        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <GlowCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ListChecks className="size-4 text-red-500" />
                Today&apos;s Tasks
              </h3>
              <Link href="/daily" className="text-xs text-red-500 hover:text-red-400 transition-colors">
                View All
              </Link>
            </div>
            {loadingOps ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : !todayTasksSummary ? (
              <p className="text-sm text-[#666]">No tasks for today.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-5 text-red-500" />
                    <span className="text-2xl font-bold text-white tabular-nums">
                      {todayTasksSummary.done_today}/{todayTasksSummary.total_today}
                    </span>
                    <span className="text-sm text-[#666]">done</span>
                  </div>
                </div>
                {todayTasksSummary.total_today > 0 && (
                  <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((todayTasksSummary.done_today / todayTasksSummary.total_today) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-red-600 to-emerald-400 rounded-full"
                    />
                  </div>
                )}
                {todayTasksSummary.total_overdue > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <GlowDot color="red" size="sm" />
                    <span className="text-red-400 font-medium">
                      {todayTasksSummary.total_overdue} overdue
                    </span>
                    <span className="text-[#666]">tasks need attention</span>
                  </div>
                )}
                {todayTasksSummary.total_today === 0 && (
                  <p className="text-sm text-[#666]">
                    No tasks scheduled for today. <Link href="/daily" className="text-red-500 hover:text-red-400 transition-colors">Add some</Link>
                  </p>
                )}
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
