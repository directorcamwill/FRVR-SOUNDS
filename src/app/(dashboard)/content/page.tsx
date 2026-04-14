"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, Plus, Check, X } from "lucide-react";

interface ContentMoment {
  id: string;
  title: string;
  content_type: "social_post" | "story" | "reel";
  trigger_event: string;
  content: string;
  platform_suggestions: string[];
  status: "suggested" | "used" | "dismissed";
  created_at: string;
}

const contentTypeColors: Record<string, string> = {
  social_post: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  story: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  reel: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const contentTypeLabels: Record<string, string> = {
  social_post: "Social Post",
  story: "Story",
  reel: "Reel",
};

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  tiktok: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const statusColors: Record<string, string> = {
  suggested: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  used: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  dismissed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function ContentPage() {
  const [moments, setMoments] = useState<ContentMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content-moments");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMoments(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/catalog-marketing", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate ideas");
      }
      await fetchMoments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (momentId: string, status: "used" | "dismissed") => {
    try {
      const res = await fetch(`/api/content-moments/${momentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMoments((prev) =>
          prev.map((m) => (m.id === momentId ? { ...m, status } : m))
        );
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Studio</h2>
          <p className="text-sm text-[#A3A3A3]">
            AI-generated social content ideas from your catalog activity
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          Generate Ideas
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
            <Loader2 className="size-10 text-[#DC2626] animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              Generating Content Ideas...
            </h3>
            <p className="text-sm text-[#A3A3A3]">
              Our AI is analyzing your catalog activity for content moments.
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
      ) : moments.length === 0 && !generating ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="size-12 text-[#333] mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No content moments yet
            </h3>
            <p className="text-sm text-[#A3A3A3] text-center max-w-sm">
              Click &quot;Generate Ideas&quot; to get AI-powered content
              suggestions based on your catalog activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {moments.map((moment) => (
            <Card key={moment.id}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">
                        {moment.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={contentTypeColors[moment.content_type] || ""}
                      >
                        {contentTypeLabels[moment.content_type] || moment.content_type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={statusColors[moment.status] || ""}
                      >
                        {moment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#A3A3A3] mb-2">
                      Trigger: {moment.trigger_event}
                    </p>
                    <p className="text-sm text-[#D4D4D4] leading-relaxed">
                      {moment.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {moment.platform_suggestions?.map((platform) => (
                        <Badge
                          key={platform}
                          variant="outline"
                          className={platformColors[platform] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}
                        >
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {moment.status === "suggested" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateStatus(moment.id, "used")}
                        className="inline-flex items-center justify-center rounded-md h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                        title="Mark as Used"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(moment.id, "dismissed")}
                        className="inline-flex items-center justify-center rounded-md h-8 w-8 text-zinc-400 hover:bg-zinc-500/10"
                        title="Dismiss"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
