"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Plus,
  Loader2,
  Sparkles,
  Music,
  Megaphone,
  Palette,
  Users,
  Package,
  Circle,
  ChevronRight,
  X,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  type: string;
  title: string;
  description: string | null;
  inspiration: string | null;
  ai_generated: boolean;
  status: string;
  tags: string[];
  created_at: string;
}

const typeIcons: Record<string, LucideIcon> = {
  song: Music,
  content: Sparkles,
  campaign: Megaphone,
  brand: Palette,
  collaboration: Users,
  product: Package,
  other: Circle,
};

const typeColors: Record<string, string> = {
  song: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  content: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  campaign: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  brand: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  collaboration: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  product: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const statusColors: Record<string, string> = {
  new: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  developing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const typeFilters = [
  "all",
  "song",
  "content",
  "campaign",
  "brand",
  "collaboration",
  "product",
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Manual add form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("song");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ideas");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setIdeas(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/generate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate ideas");
      }
      await fetchIdeas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          description: newDescription || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setIdeas((prev) => [created, ...prev]);
        setNewTitle("");
        setNewDescription("");
        setShowAdd(false);
      }
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (ideaId: string, status: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      if (res.ok) {
        setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      }
    } catch {
      // ignore
    }
  };

  const filteredIdeas =
    activeType === "all"
      ? ideas
      : ideas.filter((i) => i.type === activeType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Idea Generator</h2>
          <p className="text-sm text-[#A3A3A3]">
            AI-powered creative brainstorming for your music career
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="size-4 mr-2" />
            Add Idea
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            Generate Ideas
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Manual Add */}
      {showAdd && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Idea title..."
                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
                autoFocus
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="bg-[#111] border border-[#1A1A1A] rounded px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="song">Song</option>
                <option value="content">Content</option>
                <option value="campaign">Campaign</option>
                <option value="brand">Brand</option>
                <option value="collaboration">Collab</option>
                <option value="product">Product</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your idea..."
              rows={2}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Plus className="size-4 mr-1" />
                )}
                Save Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generating state */}
      {generating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-10 text-[#DC2626] animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              Generating Ideas...
            </h3>
            <p className="text-sm text-[#A3A3A3]">
              AI is brainstorming personalized ideas for your career
            </p>
          </CardContent>
        </Card>
      )}

      {/* Type Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {typeFilters.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap capitalize",
              activeType === type
                ? "bg-[#DC2626] text-white"
                : "bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredIdeas.length === 0 && !generating ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lightbulb className="size-12 text-[#333] mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No ideas yet
            </h3>
            <p className="text-sm text-[#A3A3A3] text-center max-w-sm">
              Click &quot;Generate Ideas&quot; for AI-powered suggestions or
              add your own ideas manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((idea, index) => {
            const TypeIcon: LucideIcon = typeIcons[idea.type] || Circle;
            const isExpanded = expandedId === idea.id;

            return (
              <Card
                key={idea.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-[#333]",
                  isExpanded && "ring-1 ring-[#DC2626]/20"
                )}
                onClick={() =>
                  setExpandedId(isExpanded ? null : idea.id)
                }
                style={{
                  animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={typeColors[idea.type] || ""}
                        >
                          <TypeIcon className="size-3 mr-1" />
                          {idea.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusColors[idea.status] || ""}
                        >
                          {idea.status.replace("_", " ")}
                        </Badge>
                        {idea.ai_generated && (
                          <Bot className="size-3.5 text-[#DC2626]" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-2">
                        {idea.title}
                      </h3>
                      {idea.description && (
                        <p className="text-xs text-[#A3A3A3] mt-1 line-clamp-2">
                          {idea.description}
                        </p>
                      )}
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {idea.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A1A] text-[#A3A3A3]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-[#A3A3A3] transition-transform shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div
                      className="mt-3 pt-3 border-t border-[#1A1A1A] space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {idea.inspiration && (
                        <div>
                          <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-0.5">
                            Inspiration
                          </p>
                          <p className="text-xs text-[#D4D4D4]">
                            {idea.inspiration}
                          </p>
                        </div>
                      )}

                      {/* Status controls */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-[#A3A3A3] mr-1">
                          Status:
                        </span>
                        {(
                          [
                            "new",
                            "developing",
                            "in_progress",
                            "completed",
                            "archived",
                          ] as const
                        ).map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              handleUpdateStatus(idea.id, s)
                            }
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] transition-colors capitalize",
                              idea.status === s
                                ? "bg-[#DC2626] text-white"
                                : "bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
                            )}
                          >
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400"
                      >
                        <X className="size-3" />
                        Remove
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
