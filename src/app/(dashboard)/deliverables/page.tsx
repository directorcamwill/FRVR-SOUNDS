"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Music,
  Send,
  Sparkles,
  Palette,
  TrendingUp,
  Plus,
  Loader2,
  Check,
  ChevronRight,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Deliverable {
  id: string;
  category: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  target_date: string | null;
  status: string;
  priority: string;
  created_at: string;
}

const categoryIcons: Record<string, LucideIcon> = {
  music_production: Music,
  sync_submissions: Send,
  content: Sparkles,
  brand_assets: Palette,
  growth_systems: TrendingUp,
  other: Target,
};

const categoryColors: Record<string, string> = {
  music_production: "text-purple-400",
  sync_submissions: "text-blue-400",
  content: "text-pink-400",
  brand_assets: "text-amber-400",
  growth_systems: "text-emerald-400",
  other: "text-zinc-400",
};

const statusColors: Record<string, string> = {
  not_started: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-zinc-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [incrementing, setIncrementing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newTarget, setNewTarget] = useState("1");
  const [adding, setAdding] = useState(false);

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deliverables");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDeliverables(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  const handleIncrement = async (id: string) => {
    setIncrementing(id);
    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 1 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDeliverables((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
      }
    } catch {
      // ignore
    } finally {
      setIncrementing(null);
    }
  };

  const handleUpdateTarget = async (id: string) => {
    const target = parseInt(editTarget);
    if (isNaN(target) || target < 1) return;
    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_count: target }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDeliverables((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        setEditingId(null);
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          target_count: parseInt(newTarget) || 1,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setDeliverables((prev) => [...prev, created]);
        setNewTitle("");
        setNewTarget("1");
        setShowAdd(false);
      }
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  // Summary stats
  const total = deliverables.length;
  const completed = deliverables.filter((d) => d.status === "completed").length;
  const overallPct =
    total > 0
      ? Math.round(
          deliverables.reduce((acc, d) => {
            return (
              acc +
              (d.target_count > 0
                ? Math.min(
                    100,
                    Math.round((d.current_count / d.target_count) * 100)
                  )
                : 0)
            );
          }, 0) / total
        )
      : 0;
  const trackStatus =
    overallPct >= 60 ? "Ahead" : overallPct >= 30 ? "On Track" : "Behind";
  const trackColor =
    overallPct >= 60
      ? "text-emerald-400"
      : overallPct >= 30
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Deliverables</h2>
          <p className="text-sm text-[#A3A3A3]">
            Track your key milestones and outputs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="size-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Deliverable title..."
                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-sm text-white focus:outline-none"
              >
                <option value="music_production">Music</option>
                <option value="sync_submissions">Sync</option>
                <option value="content">Content</option>
                <option value="brand_assets">Brand</option>
                <option value="growth_systems">Growth</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Target"
                className="w-20 bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-sm text-white focus:outline-none"
              />
              <Button size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
              Overall Completion
            </p>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-white">{overallPct}%</p>
                <div className="mt-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#DC2626] to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
              Completed
            </p>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {completed} / {total}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
              Status
            </p>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className={cn("text-2xl font-bold", trackColor)}>
                {trackStatus}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deliverable Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliverables.map((d, index) => {
            const Icon: LucideIcon = categoryIcons[d.category] || Target;
            const pct =
              d.target_count > 0
                ? Math.min(
                    100,
                    Math.round((d.current_count / d.target_count) * 100)
                  )
                : 0;
            const isEditing = editingId === d.id;

            return (
              <Card
                key={d.id}
                style={{
                  animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "size-5",
                          categoryColors[d.category] || "text-zinc-400"
                        )}
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {d.title}
                        </h3>
                        <p className="text-xs text-[#A3A3A3]">
                          {d.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          priorityColors[d.priority] || "bg-zinc-500"
                        )}
                        title={d.priority}
                      />
                      <Badge
                        variant="outline"
                        className={statusColors[d.status] || ""}
                      >
                        {d.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#A3A3A3]">
                        {d.current_count} / {d.target_count}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          pct >= 100
                            ? "text-emerald-400"
                            : pct >= 50
                              ? "text-amber-400"
                              : "text-[#A3A3A3]"
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pct >= 100
                            ? "bg-emerald-500"
                            : pct >= 50
                              ? "bg-amber-500"
                              : "bg-[#DC2626]"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleIncrement(d.id)}
                      disabled={
                        incrementing === d.id || d.status === "completed"
                      }
                    >
                      {incrementing === d.id ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : d.status === "completed" ? (
                        <Check className="size-3 mr-1 text-emerald-400" />
                      ) : (
                        <Plus className="size-3 mr-1" />
                      )}
                      {d.status === "completed" ? "Done" : "+1"}
                    </Button>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className="w-16 bg-[#111] border border-[#1A1A1A] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTarget(d.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateTarget(d.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditTarget(String(d.target_count));
                        }}
                        className="text-zinc-500 hover:text-white"
                      >
                        <Pencil className="size-3" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
