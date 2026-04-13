"use client";

import { Badge } from "@/components/ui/badge";
import { OpportunityCard } from "./opportunity-card";
import type { Opportunity } from "@/types/opportunity";

interface KanbanColumnProps {
  stage: string;
  label: string;
  opportunities: Opportunity[];
}

export function KanbanColumn({ label, opportunities }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <Badge variant="secondary" className="text-[10px]">
          {opportunities.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 min-h-[100px] rounded-lg bg-[#111] p-2">
        {opportunities.length === 0 ? (
          <p className="text-xs text-[#555] text-center py-4">
            No opportunities
          </p>
        ) : (
          opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))
        )}
      </div>
    </div>
  );
}
