"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidencePill } from "@/components/ui/motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface PriorityAction {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action_url: string;
  category: string;
  confidence?: number | null;
}

const URGENCY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const URGENCY_GLOW: Record<string, string> = {
  high: "hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]",
  medium: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  low: "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]",
};

export function PriorityActions({
  actions,
  loading,
  healthSummary,
  focusArea,
}: {
  actions: PriorityAction[];
  loading: boolean;
  healthSummary?: string;
  focusArea?: string;
}) {
  if (loading) {
    return (
      <Card className="glass-card border-[#1A1A1A]">
        <CardHeader>
          <CardTitle>Next Best Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/[0.02] space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-[#1A1A1A]">
      <CardHeader>
        <CardTitle>Next Best Actions</CardTitle>
        {focusArea && (
          <p className="text-xs text-red-500 mt-1">
            Focus: {focusArea}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {healthSummary && (
          <p className="text-sm text-[#666] mb-4">{healthSummary}</p>
        )}
        {actions.length === 0 ? (
          <p className="text-sm text-[#666]">
            No priority actions right now. Add songs to your vault to get
            started.
          </p>
        ) : (
          <div className="space-y-2">
            {actions.slice(0, 5).map((action, i) => (
              <Link
                key={i}
                href={action.action_url}
                className={`flex items-start gap-3 p-3 rounded-lg glass-card transition-all duration-300 group ${URGENCY_GLOW[action.urgency] || ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${URGENCY_STYLES[action.urgency] || URGENCY_STYLES.low}`}
                    >
                      {action.urgency}
                    </span>
                    <span className="text-sm font-medium text-white truncate">
                      {action.title}
                    </span>
                    {action.confidence != null && (
                      <ConfidencePill
                        score={action.confidence}
                        showLabel={false}
                      />
                    )}
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="size-4 text-[#555] group-hover:text-red-500 mt-1 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
