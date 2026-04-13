"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIRecommendation } from "@/types/business-setup";

interface RecommendationCardProps {
  recommendation: AIRecommendation;
}

const priorityStyles: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const costStyles: Record<string, string> = {
  free: "bg-emerald-500/15 text-emerald-400",
  $: "bg-amber-500/15 text-amber-400",
  $$: "bg-orange-500/15 text-orange-400",
  $$$: "bg-red-500/15 text-red-400",
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { title, description, priority, phase, estimated_time, cost } =
    recommendation;

  return (
    <Card className="border-[#1F1F1F]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border",
                  priorityStyles[priority] || priorityStyles.medium
                )}
              >
                {priority}
              </span>
              <Badge variant="outline" className="text-[10px] h-4">
                Phase {phase}
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-white">{title}</h4>
            <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">
              {description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {estimated_time && (
                <span className="flex items-center gap-1 text-[10px] text-[#777]">
                  <Clock className="size-3" />
                  {estimated_time}
                </span>
              )}
              {cost && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                    costStyles[cost] || costStyles.free
                  )}
                >
                  <DollarSign className="size-3" />
                  {cost === "free" ? "Free" : cost}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
