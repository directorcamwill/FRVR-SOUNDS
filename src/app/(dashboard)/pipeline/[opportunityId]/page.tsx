"use client";

import { use } from "react";
import { useOpportunity } from "@/lib/hooks/use-opportunities";
import { OpportunityDetail } from "@/components/pipeline/opportunity-detail";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = use(params);
  const { opportunity, loading, refetch } = useOpportunity(opportunityId);

  return (
    <OpportunityDetail
      opportunity={opportunity}
      loading={loading}
      onRefresh={refetch}
    />
  );
}
