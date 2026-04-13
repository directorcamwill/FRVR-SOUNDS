"use client";

import { useOpportunities } from "@/lib/hooks/use-opportunities";
import { OpportunityForm } from "@/components/pipeline/opportunity-form";
import { KanbanBoard } from "@/components/pipeline/kanban-board";

export default function PipelinePage() {
  const { opportunities, loading, refetch } = useOpportunities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Opportunity Pipeline
          </h2>
          <p className="text-sm text-[#A3A3A3]">
            Track sync licensing opportunities from discovery to placement
          </p>
        </div>
        <OpportunityForm onSuccess={refetch} />
      </div>

      <KanbanBoard opportunities={opportunities} loading={loading} />
    </div>
  );
}
