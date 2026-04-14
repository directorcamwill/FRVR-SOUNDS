"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  RefreshCw,
  Loader2,
  Sparkles,
  Target,
  Shield,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { KnowledgeLink } from "@/components/learn/knowledge-link";
import { PhaseCard } from "@/components/business/phase-card";
import { RecommendationCard } from "@/components/business/recommendation-card";
import { StudioGuide } from "@/components/business/studio-guide";
import type { BusinessSetup, AIRecommendation } from "@/types/business-setup";

interface BusinessData {
  setup: BusinessSetup;
  recommendations: AIRecommendation[];
  current_focus: string | null;
  encouragement: string | null;
}

const PHASES = [
  {
    number: 1,
    title: "Foundation",
    description: "Your identity, name, and online presence",
    progressKey: "phase1_progress" as const,
  },
  {
    number: 2,
    title: "Legal + Money",
    description: "Business structure, royalties, and banking",
    progressKey: "phase2_progress" as const,
  },
  {
    number: 3,
    title: "Music Infrastructure",
    description: "Your studio, workflow, and file systems",
    progressKey: "phase3_progress" as const,
  },
  {
    number: 4,
    title: "Growth Ready",
    description: "Distribution, sync readiness, and visibility",
    progressKey: "phase4_progress" as const,
  },
];

function progressColor(progress: number) {
  if (progress >= 70) return "bg-emerald-400";
  if (progress >= 40) return "bg-amber-400";
  return "bg-red-400";
}

export default function BusinessPage() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/business-setup");
      if (res.ok) {
        const result = await res.json();
        if (result?.setup) setData(result);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/business-manager", {
        method: "POST",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to get AI advice");
      }
      const result = await res.json();
      if (result?.setup) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      if (!data?.setup) return;

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          setup: { ...prev.setup, [field]: value },
        };
      });

      // Debounced save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch("/api/business-setup", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
        } catch {
          // Revert on error by refetching
          fetchData();
        }
      }, 800);
    },
    [data?.setup, fetchData]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Setup</h2>
          <p className="text-sm text-[#A3A3A3]">
            Build your music business step by step
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.setup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Business Setup</h2>
            <p className="text-sm text-[#A3A3A3]">
              Build your music business step by step
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            Get Started
          </Button>
        </div>
        {refreshing ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-10 text-[#DC2626] animate-spin mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">
                Setting up your business tracker...
              </h3>
              <p className="text-sm text-[#A3A3A3]">
                Analyzing your profile and creating personalized recommendations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="size-12 text-[#333] mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">
                Ready to build your music business?
              </h3>
              <p className="text-sm text-[#A3A3A3]">
                Click &quot;Get Started&quot; to set up your personalized
                business roadmap.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const { setup, recommendations, current_focus, encouragement } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Setup</h2>
          <p className="text-sm text-[#A3A3A3]">
            Build your music business step by step
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          Get AI Advice
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Overall progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#A3A3A3]">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {setup.overall_progress}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#1A1A1A]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressColor(setup.overall_progress)
              )}
              style={{ width: `${setup.overall_progress}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3">
            {PHASES.map((phase) => (
              <div key={phase.number} className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-[#777] mb-1">
                  <span>Phase {phase.number}</span>
                  <span className="tabular-nums">
                    {setup[phase.progressKey]}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#1A1A1A]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      progressColor(setup[phase.progressKey])
                    )}
                    style={{
                      width: `${setup[phase.progressKey]}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Focus + Encouragement */}
      {(current_focus || encouragement) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {current_focus && (
            <Card className="border-[#DC2626]/30 bg-[#DC2626]/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-2">
                  <Target className="size-4 text-[#DC2626] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#DC2626] mb-1">
                      Current Focus
                    </p>
                    <p className="text-sm text-white">{current_focus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {encouragement && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-400 mb-1">
                      Keep Going
                    </p>
                    <p className="text-sm text-white">{encouragement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Phase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PHASES.map((phase) => (
          <PhaseCard
            key={phase.number}
            number={phase.number}
            title={phase.title}
            description={phase.description}
            progress={setup[phase.progressKey]}
            setup={setup}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      {/* Business Vault CTA */}
      <Link href="/business/vault" className="block group">
        <Card className="bg-gradient-to-r from-[#DC2626]/10 to-[#DC2626]/5 border-[#DC2626]/20 hover:border-[#DC2626]/40 transition-all">
          <CardContent className="py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#DC2626]/15 flex items-center justify-center">
                <Shield className="size-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Business Vault
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  View and manage all your business details in one secure place
                </p>
              </div>
            </div>
            <ArrowRight className="size-5 text-[#555] group-hover:text-[#DC2626] transition-colors" />
          </CardContent>
        </Card>
      </Link>

      {/* Knowledge Links */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
        <p className="text-xs text-[#A3A3A3] uppercase tracking-wider font-medium mb-3">
          Learn more about building your music business
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <KnowledgeLink topicId="royalties-overview" label="How Royalties Work" />
          <KnowledgeLink topicId="pro-registration" label="PRO Registration" />
          <KnowledgeLink topicId="catalog-ownership" label="Catalog Ownership" />
          <KnowledgeLink topicId="one-stop-licensing" label="One-Stop Licensing" />
          <KnowledgeLink topicId="split-sheets" label="Split Sheets" />
          <KnowledgeLink topicId="music-copyright" label="Copyright Registration" />
        </div>
      </div>

      {/* Studio Guide (Phase 3 helper) */}
      <StudioGuide />

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              AI Recommendations
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs"
            >
              {refreshing ? (
                <Loader2 className="size-3 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3 mr-1.5" />
              )}
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
