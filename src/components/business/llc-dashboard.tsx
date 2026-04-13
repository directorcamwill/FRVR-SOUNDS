"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  Shield,
  DollarSign,
  Sparkles,
  FileText,
  Building2,
  Star,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_STATES, LLC_SERVICES } from "@/lib/agents/llc-constants";
import type { BusinessSetup, LLCTaskItem } from "@/types/business-setup";
import Link from "next/link";

interface LLCDashboardProps {
  setup: BusinessSetup;
  onFieldChange: (field: string, value: unknown) => void;
  standalone?: boolean;
}

const REVENUE_STREAM_OPTIONS = [
  { value: "streaming", label: "Streaming" },
  { value: "sync", label: "Sync Licensing" },
  { value: "shows", label: "Live Shows" },
  { value: "brand_deals", label: "Brand Deals" },
  { value: "merch", label: "Merchandise" },
  { value: "teaching", label: "Teaching" },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBgColor(score: number) {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function levelBadgeVariant(level: string): string {
  if (level === "HIGH") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (level === "MEDIUM") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function decisionText(decision: string) {
  if (decision === "START_LLC_NOW") return "Start LLC Now";
  if (decision === "PREPARE_FOR_LLC") return "Prepare for LLC";
  return "Wait";
}

function decisionBadgeClass(decision: string) {
  if (decision === "START_LLC_NOW") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (decision === "PREPARE_FOR_LLC") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

export function LLCDashboard({ setup, onFieldChange, standalone = false }: LLCDashboardProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce field changes — save then re-run agent
  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      onFieldChange(field, value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        runAgent();
      }, 1500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const runAgent = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/llc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAI: true }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Analysis failed");
      }
      // Refetch setup data to get updated values
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  const score = setup.llc_readiness_score || 0;
  const level = setup.llc_readiness_level || "LOW";
  const decision = setup.llc_decision || "WAIT";
  const explanation = setup.llc_explanation;
  const tasks: LLCTaskItem[] = Array.isArray(setup.llc_tasks) ? setup.llc_tasks : [];
  const warnings: string[] = Array.isArray(setup.llc_warnings) ? setup.llc_warnings : [];
  const nextAction = setup.llc_next_action;

  // Parse readiness factors from tasks data or use defaults
  const factors = [
    { factor: "Annual music income > $1,000", points: 25, met: (setup.annual_music_income || 0) > 1000 },
    { factor: "Multiple revenue streams", points: 15, met: (setup.revenue_streams?.length || 0) >= 2 },
    { factor: "Active in sync licensing", points: 15, met: setup.sync_activity !== "none" && !!setup.sync_activity },
    { factor: "Consistent release schedule", points: 15, met: setup.release_frequency === "consistent" },
    { factor: "Professional career stage", points: 20, met: setup.career_stage === "professional" },
    { factor: "Existing business activity", points: 10, met: setup.llc_status === "completed" },
  ];

  const stateInfo = setup.llc_state
    ? { filing_fee: setup.llc_filing_cost, annual_fee: setup.llc_annual_cost }
    : null;

  return (
    <div className="space-y-6">
      {/* Back button for standalone page */}
      {standalone && (
        <Link
          href="/business"
          className="inline-flex items-center gap-1.5 text-sm text-[#A3A3A3] hover:text-white transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Business Setup
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="size-6 text-[#E87420]" />
            LLC Setup Guide
          </h2>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Smart analysis of whether you need an LLC right now
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runAgent}
          disabled={analyzing}
        >
          {analyzing ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="size-4 mr-2" />
          )}
          Refresh Analysis
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Readiness Score Card */}
      <Card className={cn("border", scoreBgColor(score))}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={cn("text-5xl font-bold tabular-nums", scoreColor(score))}>
                  {score}
                </div>
                <div className="text-xs text-[#A3A3A3] mt-1">out of 100</div>
              </div>
              <Separator orientation="vertical" className="h-16" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", levelBadgeVariant(level))}>
                    {level} READINESS
                  </span>
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", decisionBadgeClass(decision))}>
                    {decisionText(decision)}
                  </span>
                </div>
                <p className="text-sm text-[#A3A3A3] max-w-md">
                  {score >= 70
                    ? "You're ready to form your LLC. Let's get it done."
                    : score >= 40
                      ? "You're getting close. A few more steps and you'll be ready."
                      : "Focus on building your income first. We'll guide you when it's time."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      {explanation && (
        <Card className="border-[#E87420]/20 bg-[#E87420]/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-[#E87420] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-[#E87420] mb-1">AI Analysis</p>
                <p className="text-sm text-white leading-relaxed">{explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Career Info + State */}
        <div className="space-y-6">
          {/* Readiness Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="size-4 text-amber-400" />
                Readiness Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {factors.map((f) => (
                <div
                  key={f.factor}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {f.met ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <Circle className="size-4 text-[#333]" />
                    )}
                    <span className={cn("text-sm", f.met ? "text-white" : "text-[#777]")}>
                      {f.factor}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs tabular-nums",
                      f.met
                        ? "border-emerald-500/30 text-emerald-400"
                        : "border-[#333] text-[#555]"
                    )}
                  >
                    +{f.points}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Career Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-purple-400" />
                Your Career Info
              </CardTitle>
              <p className="text-xs text-[#777]">
                Changes auto-save and re-analyze
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Career Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">Career Stage</label>
                <Select
                  value={setup.career_stage || "beginner"}
                  onValueChange={(val) => handleFieldChange("career_stage", val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="developing">Developing</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Annual Income */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">Annual Music Income ($)</label>
                <Input
                  type="number"
                  min={0}
                  value={setup.annual_music_income || 0}
                  onChange={(e) =>
                    handleFieldChange("annual_music_income", parseFloat(e.target.value) || 0)
                  }
                  className="h-9 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Monthly Income */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">Monthly Music Income ($)</label>
                <Input
                  type="number"
                  min={0}
                  value={setup.monthly_music_income || 0}
                  onChange={(e) =>
                    handleFieldChange("monthly_music_income", parseFloat(e.target.value) || 0)
                  }
                  className="h-9 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Revenue Streams */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#A3A3A3]">Revenue Streams</label>
                <div className="grid grid-cols-2 gap-2">
                  {REVENUE_STREAM_OPTIONS.map((opt) => {
                    const streams = setup.revenue_streams || [];
                    const checked = streams.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const next = c
                              ? [...streams, opt.value]
                              : streams.filter((s: string) => s !== opt.value);
                            handleFieldChange("revenue_streams", next);
                          }}
                        />
                        <span className="text-sm text-[#A3A3A3]">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Release Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">Release Frequency</label>
                <Select
                  value={setup.release_frequency || "none"}
                  onValueChange={(val) => handleFieldChange("release_frequency", val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not releasing yet</SelectItem>
                    <SelectItem value="occasional">Occasional releases</SelectItem>
                    <SelectItem value="consistent">Consistent schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sync Activity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">Sync Activity</label>
                <Select
                  value={setup.sync_activity || "none"}
                  onValueChange={(val) => handleFieldChange("sync_activity", val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not involved in sync</SelectItem>
                    <SelectItem value="preparing">Preparing for sync</SelectItem>
                    <SelectItem value="actively_pitching">Actively pitching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: State + Tasks + Warnings */}
        <div className="space-y-6">
          {/* State Selection + Cost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-400" />
                State &amp; Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">State of Registration</label>
                <Select
                  value={setup.llc_state || ""}
                  onValueChange={(val) => handleFieldChange("llc_state", val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* LLC Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A3A3A3]">LLC Name</label>
                <Input
                  value={setup.llc_name || ""}
                  onChange={(e) => handleFieldChange("llc_name", e.target.value)}
                  placeholder="e.g. FRVR Music LLC"
                  className="h-9 text-sm"
                />
              </div>

              {setup.llc_state && stateInfo && (
                <div className="rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#A3A3A3]">Filing Fee</span>
                    <span className="text-sm font-semibold text-white">
                      ${stateInfo.filing_fee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#A3A3A3]">Annual Fee</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      (stateInfo.annual_fee || 0) >= 300 ? "text-amber-400" : "text-white"
                    )}>
                      ${stateInfo.annual_fee}/yr
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#A3A3A3]">First Year Total</span>
                    <span className="text-sm font-bold text-[#E87420]">
                      ${(stateInfo.filing_fee || 0) + (stateInfo.annual_fee || 0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-blue-400" />
                LLC Checklist
              </CardTitle>
              <p className="text-xs text-[#777]">
                {tasks.filter((t) => t.status === "completed").length} of {tasks.length} completed
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-[#555] py-4 text-center">
                  Run the analysis to generate your personalized checklist.
                </p>
              ) : (
                tasks.map((task) => {
                  const isNext = nextAction?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        isNext
                          ? "border-[#E87420]/50 bg-[#E87420]/5"
                          : task.status === "completed"
                            ? "border-[#1F1F1F] bg-[#0A0A0A] opacity-60"
                            : "border-[#1F1F1F] bg-[#0A0A0A]"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : isNext ? (
                          <ArrowRight className="size-4 text-[#E87420] mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="size-4 text-[#333] mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                task.status === "completed"
                                  ? "text-[#777] line-through"
                                  : isNext
                                    ? "text-white"
                                    : "text-[#A3A3A3]"
                              )}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className="text-[10px] border-[#333] text-[#777]">
                                {task.estimated_time}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  task.cost === "Free"
                                    ? "border-emerald-500/30 text-emerald-400"
                                    : "border-amber-500/30 text-amber-400"
                                )}
                              >
                                {task.cost}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-[#555] mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>
                      {isNext && (
                        <div className="mt-2 pl-6">
                          <Badge className="bg-[#E87420]/20 text-[#E87420] border-[#E87420]/30 text-[10px]">
                            Next Step
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400" />
                  Things to Know
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3"
                  >
                    <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-200/80 leading-relaxed">{w}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Service Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended LLC Services</CardTitle>
          <p className="text-xs text-[#777]">
            You can file directly with your state or use a service
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {LLC_SERVICES.map((svc, i) => {
              const isRecommended = svc.name === "ZenBusiness";
              return (
                <div
                  key={svc.name}
                  className={cn(
                    "rounded-lg border p-4 space-y-2 relative",
                    isRecommended
                      ? "border-[#E87420]/40 bg-[#E87420]/5"
                      : "border-[#1F1F1F] bg-[#0A0A0A]"
                  )}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 right-2 bg-[#E87420] text-white text-[10px]">
                      Recommended
                    </Badge>
                  )}
                  <h4 className="text-sm font-medium text-white">{svc.name}</h4>
                  <p className="text-xs text-[#E87420] font-medium">{svc.cost}</p>
                  <p className="text-[10px] text-[#777]">
                    Difficulty: {svc.difficulty}
                  </p>
                  <p className="text-xs text-[#A3A3A3]">{svc.best_for}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
