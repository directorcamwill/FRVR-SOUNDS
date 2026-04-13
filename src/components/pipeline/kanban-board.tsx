"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanColumn } from "./kanban-column";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINE_STAGES, OPPORTUNITY_TYPES } from "@/types/opportunity";
import type { Opportunity, OpportunityType } from "@/types/opportunity";

interface KanbanBoardProps {
  opportunities: Opportunity[];
  loading: boolean;
}

type SortOption = "deadline" | "created";

export function KanbanBoard({ opportunities, loading }: KanbanBoardProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created");

  const filtered = useMemo(() => {
    let result = opportunities;
    if (filterType !== "all") {
      result = result.filter((o) => o.opportunity_type === filterType);
    }
    return result.sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [opportunities, filterType, sortBy]);

  const groupedByStage = useMemo(() => {
    const groups: Record<string, Opportunity[]> = {};
    for (const stage of PIPELINE_STAGES) {
      groups[stage.value] = [];
    }
    for (const opp of filtered) {
      if (groups[opp.stage]) {
        groups[opp.stage].push(opp);
      }
    }
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[260px] space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={(val) => setFilterType(val ?? "all")}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OPPORTUNITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant={sortBy === "created" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("created")}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === "deadline" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("deadline")}
          >
            Deadline
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.value}
            stage={stage.value}
            label={stage.label}
            opportunities={groupedByStage[stage.value] || []}
          />
        ))}
      </div>
    </div>
  );
}
