"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PriorityAction {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action_url: string;
  category: string;
}

const URGENCY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
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
      <Card>
        <CardHeader>
          <CardTitle>Priority Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#111] space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Actions</CardTitle>
        {focusArea && (
          <p className="text-xs text-[#E87420] mt-1">
            Focus: {focusArea}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {healthSummary && (
          <p className="text-sm text-[#A3A3A3] mb-4">{healthSummary}</p>
        )}
        {actions.length === 0 ? (
          <p className="text-sm text-[#A3A3A3]">
            No priority actions right now. Add songs to your vault to get
            started.
          </p>
        ) : (
          <div className="space-y-2">
            {actions.slice(0, 5).map((action, i) => (
              <Link
                key={i}
                href={action.action_url}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#111] hover:bg-[#1A1A1A] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${URGENCY_STYLES[action.urgency] || URGENCY_STYLES.low}`}
                    >
                      {action.urgency}
                    </span>
                    <span className="text-sm font-medium text-white truncate">
                      {action.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] line-clamp-2">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="size-4 text-[#555] group-hover:text-[#A3A3A3] mt-1 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
