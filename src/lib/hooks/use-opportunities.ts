"use client";

import { useState, useEffect, useCallback } from "react";
import type { Opportunity } from "@/types/opportunity";

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/opportunities");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch opportunities");
      }
      const data = await res.json();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return { opportunities, loading, error, refetch: fetchOpportunities };
}

export function useOpportunity(opportunityId: string) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch opportunity");
      }
      const data = await res.json();
      setOpportunity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch opportunity");
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  return { opportunity, loading, error, refetch: fetchOpportunity };
}
