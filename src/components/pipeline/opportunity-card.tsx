"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import type { Opportunity } from "@/types/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const TYPE_COLORS: Record<string, string> = {
  tv: "bg-blue-500/20 text-blue-400",
  film: "bg-purple-500/20 text-purple-400",
  commercial: "bg-amber-500/20 text-amber-400",
  trailer: "bg-red-500/20 text-red-400",
  video_game: "bg-green-500/20 text-green-400",
  web_content: "bg-cyan-500/20 text-cyan-400",
  podcast: "bg-pink-500/20 text-pink-400",
  library: "bg-indigo-500/20 text-indigo-400",
  other: "bg-[#333] text-[#A3A3A3]",
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const matchCount = opportunity.opportunity_matches?.length ?? 0;
  const daysUntilDeadline = opportunity.deadline
    ? differenceInDays(parseISO(opportunity.deadline), new Date())
    : null;

  const deadlineUrgency =
    daysUntilDeadline !== null
      ? daysUntilDeadline < 0
        ? "text-[#555]"
        : daysUntilDeadline < 3
          ? "text-red-400"
          : daysUntilDeadline < 7
            ? "text-amber-400"
            : "text-[#A3A3A3]"
      : null;

  return (
    <Link href={`/pipeline/${opportunity.id}`}>
      <Card className="hover:ring-[#DC2626]/30 transition-all cursor-pointer group">
        <CardContent className="p-3 space-y-2">
          <h4 className="font-medium text-white text-sm truncate">
            {opportunity.title}
          </h4>

          <div className="flex items-center gap-2 flex-wrap">
            {opportunity.opportunity_type && (
              <Badge
                className={cn(
                  "text-[10px] border-0",
                  TYPE_COLORS[opportunity.opportunity_type] || TYPE_COLORS.other
                )}
              >
                {opportunity.opportunity_type.replace("_", " ").toUpperCase()}
              </Badge>
            )}
            {matchCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <Zap className="size-2.5 mr-0.5" />
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            {opportunity.company && (
              <span className="flex items-center gap-1 text-[#A3A3A3] truncate">
                <Building2 className="size-3 shrink-0" />
                {opportunity.company}
              </span>
            )}
            {opportunity.deadline && daysUntilDeadline !== null && (
              <span
                className={cn("flex items-center gap-1 shrink-0", deadlineUrgency)}
              >
                <Calendar className="size-3" />
                {daysUntilDeadline < 0
                  ? "Expired"
                  : daysUntilDeadline === 0
                    ? "Today"
                    : `${daysUntilDeadline}d left`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
