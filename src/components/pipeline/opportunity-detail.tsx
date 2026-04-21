"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityForm } from "./opportunity-form";
import { MatchPanel } from "./match-panel";
import { BriefIntelligence } from "./brief-intelligence";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
  Mail,
  User,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  PIPELINE_STAGES,
  OPPORTUNITY_TYPES,
} from "@/types/opportunity";
import type { Opportunity, OpportunityStage } from "@/types/opportunity";
import Link from "next/link";

interface OpportunityDetailProps {
  opportunity: Opportunity | null;
  loading: boolean;
  onRefresh: () => void;
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

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-[#333] text-[#A3A3A3]",
  qualified: "bg-blue-500/20 text-blue-400",
  matched: "bg-purple-500/20 text-purple-400",
  ready: "bg-amber-500/20 text-amber-400",
  submitted: "bg-cyan-500/20 text-cyan-400",
  pending: "bg-orange-500/20 text-orange-400",
  won: "bg-emerald-500/20 text-emerald-400",
  lost: "bg-red-500/20 text-red-400",
};

export function OpportunityDetail({
  opportunity,
  loading,
  onRefresh,
}: OpportunityDetailProps) {
  const handleStageChange = async (newStage: OpportunityStage) => {
    if (!opportunity) return;
    try {
      await fetch(`/api/opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      onRefresh();
    } catch {
      // silent fail
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A3A3A3]">Opportunity not found.</p>
        <Link href="/pipeline">
          <Button variant="outline" className="mt-4">
            Back to Pipeline
          </Button>
        </Link>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(
    (s) => s.value === opportunity.stage
  );
  const nextStage =
    currentStageIndex < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[currentStageIndex + 1]
      : null;
  const prevStage =
    currentStageIndex > 0 ? PIPELINE_STAGES[currentStageIndex - 1] : null;

  const daysUntilDeadline = opportunity.deadline
    ? differenceInDays(parseISO(opportunity.deadline), new Date())
    : null;

  const typeLabel =
    OPPORTUNITY_TYPES.find((t) => t.value === opportunity.opportunity_type)
      ?.label || opportunity.opportunity_type;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pipeline">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-1" />
            Pipeline
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{opportunity.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={cn(
                "border-0",
                STAGE_COLORS[opportunity.stage] || STAGE_COLORS.discovery
              )}
            >
              {PIPELINE_STAGES.find((s) => s.value === opportunity.stage)
                ?.label || opportunity.stage}
            </Badge>
            {opportunity.opportunity_type && (
              <Badge
                className={cn(
                  "border-0",
                  TYPE_COLORS[opportunity.opportunity_type] || TYPE_COLORS.other
                )}
              >
                {typeLabel}
              </Badge>
            )}
          </div>
        </div>
        <OpportunityForm
          opportunity={opportunity}
          onSuccess={onRefresh}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="size-3.5 mr-1.5" />
              Edit
            </Button>
          }
        />
      </div>

      {/* Stage transitions */}
      <div className="flex items-center gap-2">
        {prevStage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStageChange(prevStage.value)}
          >
            Back to {prevStage.label}
          </Button>
        )}
        {nextStage && (
          <Button
            size="sm"
            onClick={() => handleStageChange(nextStage.value)}
          >
            Move to {nextStage.label}
            <ChevronRight className="size-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Details */}
      <Card>
        <CardContent className="space-y-4">
          {opportunity.description && (
            <div>
              <h4 className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-white whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {opportunity.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="size-4 text-[#555]" />
                <span className="text-[#A3A3A3]">Company:</span>
                <span className="text-white">{opportunity.company}</span>
              </div>
            )}
            {opportunity.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-[#555]" />
                <span className="text-[#A3A3A3]">Deadline:</span>
                <span
                  className={cn(
                    "text-white",
                    daysUntilDeadline !== null && daysUntilDeadline < 3
                      ? "text-red-400"
                      : daysUntilDeadline !== null && daysUntilDeadline < 7
                        ? "text-amber-400"
                        : ""
                  )}
                >
                  {format(parseISO(opportunity.deadline), "MMM d, yyyy")}
                  {daysUntilDeadline !== null &&
                    ` (${daysUntilDeadline < 0 ? "expired" : `${daysUntilDeadline}d left`})`}
                </span>
              </div>
            )}
            {opportunity.source && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="size-4 text-[#555]" />
                <span className="text-[#A3A3A3]">Source:</span>
                {opportunity.source_url ? (
                  <a
                    href={opportunity.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#DC2626] hover:underline"
                  >
                    {opportunity.source}
                  </a>
                ) : (
                  <span className="text-white">{opportunity.source}</span>
                )}
              </div>
            )}
            {opportunity.budget_range && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#A3A3A3]">Budget:</span>
                <span className="text-white">{opportunity.budget_range}</span>
              </div>
            )}
            {opportunity.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-[#555]" />
                <span className="text-[#A3A3A3]">Contact:</span>
                <span className="text-white">{opportunity.contact_name}</span>
              </div>
            )}
            {opportunity.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-[#555]" />
                <span className="text-white">{opportunity.contact_email}</span>
              </div>
            )}
          </div>

          {(opportunity.genres_needed?.length > 0 ||
            opportunity.moods_needed?.length > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                {opportunity.genres_needed?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                      Genres Needed
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.genres_needed.map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opportunity.moods_needed?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                      Moods Needed
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.moods_needed.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {opportunity.exclusive && (
            <>
              <Separator />
              <Badge className="bg-red-500/20 text-red-400 border-0">
                Exclusive Placement Required
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      {/* Brief Intelligence */}
      <BriefIntelligence opportunity={opportunity} onRefresh={onRefresh} />

      {/* Match Panel */}
      <MatchPanel
        opportunityId={opportunity.id}
        matches={opportunity.opportunity_matches || []}
        onRefresh={onRefresh}
      />
    </div>
  );
}
