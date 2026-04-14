"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Activity,
  Brain,
  Megaphone,
  Bot,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GlowDot } from "@/components/ui/motion";

interface AgentLog {
  id: string;
  agent_type: string;
  action: string;
  summary: string;
  created_at: string;
  tokens_used?: number;
  duration_ms?: number;
}

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Bot; color: string; label: string }
> = {
  orchestrator: { icon: Bot, color: "text-blue-400", label: "Orchestrator" },
  sync_engine: { icon: Sparkles, color: "text-red-500", label: "Sync Engine" },
  health_monitor: { icon: Activity, color: "text-emerald-400", label: "Health" },
  market_intel: { icon: Brain, color: "text-purple-400", label: "Intel" },
  catalog_marketing: { icon: Megaphone, color: "text-pink-400", label: "Marketing" },
};

export function ActivityFeed({
  logs,
  loading,
}: {
  logs: AgentLog[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="glass-card border-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlowDot color="red" size="sm" />
            AI Live Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-[#1A1A1A]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GlowDot color="red" size="sm" />
          AI Live Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-[#666]">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => {
              const config = AGENT_CONFIG[log.agent_type] || {
                icon: Zap,
                color: "text-[#666]",
                label: log.agent_type,
              };
              const Icon = config.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 group"
                  style={{ animation: "fadeSlideIn 0.4s ease-out" }}
                >
                  <div
                    className={`flex items-center justify-center size-8 rounded-full bg-white/[0.03] border border-[#1A1A1A] shrink-0 ${config.color} group-hover:border-red-500/20 transition-colors`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{log.summary}</p>
                    <p className="text-xs text-[#555]">
                      {config.label} &middot;{" "}
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
