"use client";

import { useState, useEffect, useCallback } from "react";
import type { Submission } from "@/types/opportunity";

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch submissions");
      }
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
}
