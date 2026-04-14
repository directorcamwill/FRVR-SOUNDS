"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  ChevronRight,
  Plus,
  X,
  Check,
  Loader2,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelinePhase {
  id: string;
  phase_number: number;
  title: string;
  description: string;
  start_month: number;
  end_month: number;
  status: "upcoming" | "active" | "completed";
  goals: string[];
  created_at: string;
}

const statusColors: Record<string, string> = {
  upcoming: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const phaseColors = [
  "from-[#DC2626] to-[#F59E0B]",
  "from-[#F59E0B] to-[#EAB308]",
  "from-[#EAB308] to-[#84CC16]",
  "from-[#84CC16] to-[#22C55E]",
  "from-[#22C55E] to-[#14B8A6]",
  "from-[#14B8A6] to-[#06B6D4]",
];

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function TimelinePage() {
  const [phases, setPhases] = useState<TimelinePhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPhases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPhases(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const activePhase = phases.find((p) => p.status === "active");
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const currentMonth = new Date().getMonth() + 1;
  const progressPct = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;

  const handleStatusChange = async (phaseId: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/timeline/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhases((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = async (phaseId: string) => {
    if (!newGoal.trim()) return;
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const updatedGoals = [...(phase.goals || []), newGoal.trim()];
    setSaving(true);
    try {
      const res = await fetch(`/api/timeline/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: updatedGoals }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhases((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setNewGoal("");
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGoal = async (phaseId: string, goalIndex: number) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const updatedGoals = phase.goals.filter((_, i) => i !== goalIndex);
    try {
      const res = await fetch(`/api/timeline/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: updatedGoals }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhases((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Timeline</h2>
        <p className="text-sm text-[#A3A3A3]">
          Your 12-month roadmap to sync licensing success
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="size-4 text-[#DC2626]" />
              <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">
                Current Phase
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold text-white">
                {activePhase
                  ? `${activePhase.phase_number}. ${activePhase.title}`
                  : "Not started"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 text-[#A3A3A3]" />
              <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">
                Month
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-lg font-bold text-white">
                {currentMonth} / 12
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="size-4 text-emerald-400" />
              <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">
                Progress
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div>
                <p className="text-lg font-bold text-white">{progressPct}%</p>
                <div className="mt-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#DC2626] to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[#1A1A1A] hidden md:block" />

          <div className="space-y-4">
            {phases.map((phase, index) => {
              const isExpanded = expandedId === phase.id;
              const isActive = phase.status === "active";

              return (
                <div
                  key={phase.id}
                  className="relative"
                  style={{
                    animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Phase number dot */}
                  <div className="absolute left-3.5 top-5 hidden md:flex">
                    <div
                      className={cn(
                        "size-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isActive
                          ? "bg-[#DC2626] text-white shadow-[0_0_12px_rgba(232,116,32,0.5)]"
                          : phase.status === "completed"
                            ? "bg-emerald-500 text-white"
                            : "bg-[#1A1A1A] text-[#A3A3A3]"
                      )}
                    >
                      {phase.status === "completed" ? (
                        <Check className="size-3" />
                      ) : (
                        phase.phase_number
                      )}
                    </div>
                  </div>

                  <Card
                    className={cn(
                      "md:ml-14 cursor-pointer transition-all",
                      isActive &&
                        "ring-1 ring-[#DC2626]/30 shadow-[0_0_20px_rgba(232,116,32,0.1)]"
                    )}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : phase.id)
                    }
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div
                              className={cn(
                                "md:hidden size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                isActive
                                  ? "bg-[#DC2626] text-white"
                                  : phase.status === "completed"
                                    ? "bg-emerald-500 text-white"
                                    : "bg-[#1A1A1A] text-[#A3A3A3]"
                              )}
                            >
                              {phase.status === "completed" ? (
                                <Check className="size-3" />
                              ) : (
                                phase.phase_number
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-white">
                              {phase.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                statusColors[phase.status] || ""
                              }
                            >
                              {phase.status}
                            </Badge>
                            <span className="text-xs text-[#A3A3A3]">
                              {monthNames[phase.start_month - 1]} -{" "}
                              {monthNames[phase.end_month - 1]}
                            </span>
                          </div>
                          <p className="text-sm text-[#A3A3A3]">
                            {phase.description}
                          </p>

                          {/* Progress bar for this phase's month range */}
                          <div className="mt-2 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                                phaseColors[index] || phaseColors[0]
                              )}
                              style={{
                                width: `${
                                  phase.status === "completed"
                                    ? 100
                                    : phase.status === "active"
                                      ? Math.min(
                                          100,
                                          Math.max(
                                            10,
                                            ((currentMonth -
                                              phase.start_month) /
                                              (phase.end_month -
                                                phase.start_month +
                                                1)) *
                                              100
                                          )
                                        )
                                      : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "size-4 text-[#A3A3A3] transition-transform shrink-0 mt-1",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div
                          className="mt-4 pt-4 border-t border-[#1A1A1A] space-y-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Status controls */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#A3A3A3]">
                              Status:
                            </span>
                            {(
                              ["upcoming", "active", "completed"] as const
                            ).map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  handleStatusChange(phase.id, s)
                                }
                                disabled={saving}
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs transition-colors",
                                  phase.status === s
                                    ? s === "active"
                                      ? "bg-[#DC2626] text-white"
                                      : s === "completed"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-zinc-600 text-white"
                                    : "bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>

                          {/* Goals */}
                          <div>
                            <p className="text-xs text-[#A3A3A3] mb-2">
                              Goals
                            </p>
                            {phase.goals && phase.goals.length > 0 ? (
                              <ul className="space-y-1">
                                {phase.goals.map((goal, gi) => (
                                  <li
                                    key={gi}
                                    className="flex items-center gap-2 text-sm text-[#D4D4D4]"
                                  >
                                    <Check className="size-3 text-emerald-400 shrink-0" />
                                    <span className="flex-1">{goal}</span>
                                    <button
                                      onClick={() =>
                                        handleRemoveGoal(phase.id, gi)
                                      }
                                      className="text-zinc-500 hover:text-red-400 shrink-0"
                                    >
                                      <X className="size-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-zinc-600">
                                No goals added yet
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddGoal(phase.id);
                                  }
                                }}
                                placeholder="Add a goal..."
                                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddGoal(phase.id)}
                                disabled={saving || !newGoal.trim()}
                                className="h-7"
                              >
                                {saving ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Plus className="size-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
