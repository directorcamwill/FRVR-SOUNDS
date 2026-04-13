"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, GitBranch, Send, Activity, RefreshCw, Loader2 } from "lucide-react";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { HealthWidget } from "@/components/dashboard/health-widget";
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

  const [loadingOrchestrator, setLoadingOrchestrator] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
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
  }, [fetchStats, fetchHealth, fetchActivity, runOrchestrator]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      runOrchestrator(),
      fetchHealth(),
      fetchActivity(),
      fetchStats(),
    ]);
    setRefreshing(false);
  };

  const stats = [
    { label: "Total Songs", value: loadingStats ? null : String(songCount), icon: Music },
    { label: "Active Pipeline", value: loadingStats ? null : String(pipelineCount), icon: GitBranch },
    { label: "Submissions", value: loadingStats ? null : String(submissionCount), icon: Send },
    {
      label: "Health Score",
      value: loadingHealth ? null : health ? String(health.overall_score) : "--",
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
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Command Center</h2>
          <p className="text-sm text-[#A3A3A3]">Your sync licensing overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="size-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#A3A3A3]">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-[#A3A3A3]" />
              </CardHeader>
              <CardContent>
                {stat.value === null ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div
                    className={cn(
                      "text-2xl font-bold text-white",
                      "color" in stat && stat.color
                    )}
                  >
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PriorityActions
          actions={orchestrator?.priority_actions || []}
          loading={loadingOrchestrator}
          healthSummary={orchestrator?.health_summary}
          focusArea={orchestrator?.focus_area}
        />

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : pipelineCount === 0 ? (
              <p className="text-sm text-[#A3A3A3]">
                No active opportunities. Check the Intelligence page for new leads.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#A3A3A3]">Active Opportunities</span>
                  <span className="text-white font-medium">{pipelineCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#A3A3A3]">Total Submissions</span>
                  <span className="text-white font-medium">{submissionCount}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed logs={activity} loading={loadingActivity} />
        <HealthWidget health={health} loading={loadingHealth} />
      </div>
    </div>
  );
}
