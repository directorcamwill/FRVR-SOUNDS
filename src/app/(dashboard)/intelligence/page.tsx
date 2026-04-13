"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Loader2, Plus } from "lucide-react";
import { BriefCard } from "@/components/intelligence/brief-card";

interface BriefSection {
  heading: string;
  content: string;
}

interface Brief {
  id: string;
  title: string;
  summary: string;
  sections: BriefSection[];
  brief_type: string;
  created_at: string;
}

export default function IntelligencePage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBriefs(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/market-intel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate brief");
      }
      await fetchBriefs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate brief");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Intelligence Briefs</h2>
          <p className="text-sm text-[#A3A3A3]">
            AI-generated insights about market trends and opportunities
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          Generate Brief
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {generating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-10 text-[#E87420] animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              Generating Intelligence Brief...
            </h3>
            <p className="text-sm text-[#A3A3A3]">
              Our AI is analyzing market conditions for your catalog.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : briefs.length === 0 && !generating ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="size-12 text-[#333] mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No intelligence briefs yet
            </h3>
            <p className="text-sm text-[#A3A3A3] text-center max-w-sm">
              Click &quot;Generate Brief&quot; to get AI-powered market insights
              tailored to your genre and catalog.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}
