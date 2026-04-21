"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfidencePill } from "@/components/ui/motion";
import {
  Sparkles,
  Loader2,
  Plus,
  Check,
  X,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  ContentMomentType,
  ContentPlatform,
} from "@/lib/agents/content-director";

interface ContentMoment {
  id: string;
  title: string;
  content_type: string;
  trigger_event: string;
  content: string;
  platform_suggestions: string[];
  hashtags?: string[];
  hook_ideas?: string[];
  confidence?: number | null;
  reasoning?: string | null;
  source_agent?: string | null;
  source_moment_type?: string | null;
  batch_id?: string | null;
  status: "suggested" | "used" | "dismissed";
  created_at: string;
}

const contentTypeColors: Record<string, string> = {
  social_post: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  story: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/20",
  reel: "bg-red-500/10 text-red-300 border-red-500/20",
  email: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  press_release: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/20",
  video_script: "bg-red-500/10 text-red-300 border-red-500/20",
  caption: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  hook_pack: "bg-red-500/10 text-red-300 border-red-500/20",
};

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  tiktok: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  x: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/20",
  twitter: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/20",
  linkedin: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  youtube: "bg-red-500/10 text-red-300 border-red-500/20",
  email: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  press: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/20",
};

const statusColors: Record<string, string> = {
  suggested: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  used: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  dismissed: "bg-[#1A1A1A] text-[#555] border-[#222]",
};

const MOMENT_TYPES: Array<{ value: ContentMomentType; label: string }> = [
  { value: "song_release", label: "Song release" },
  { value: "placement_win", label: "Placement win" },
  { value: "behind_scenes", label: "Behind the scenes" },
  { value: "catalog_update", label: "Catalog update" },
  { value: "brand_story", label: "Brand story" },
];

const PLATFORMS: ContentPlatform[] = [
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
  "email",
  "press",
];

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

  const handleCatalogGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/catalog-marketing", {
        method: "POST",
      });
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

  const handleUpdateStatus = async (
    momentId: string,
    status: "used" | "dismissed"
  ) => {
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Studio</h2>
          <p className="text-sm text-[#A3A3A3]">
            Brand-aware content moments — generated from Brand Wiki + catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DirectorDialog onCreated={fetchMoments} />
          <Button
            variant="outline"
            onClick={handleCatalogGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Plus className="size-4 mr-2" />
            )}
            Catalog ideas
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
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
      ) : moments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="size-12 text-[#333] mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No content moments yet
            </h3>
            <p className="text-sm text-[#A3A3A3] text-center max-w-sm">
              Click <strong>Director</strong> to generate a brand-aware batch
              from a specific moment (release, placement, catalog event).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {moments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MomentCard({
  moment,
  onUpdateStatus,
}: {
  moment: ContentMoment;
  onUpdateStatus: (id: string, status: "used" | "dismissed") => void;
}) {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-white">
                {moment.title || "(untitled)"}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  contentTypeColors[moment.content_type] || ""
                )}
              >
                {moment.content_type.replace(/_/g, " ")}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  statusColors[moment.status] || ""
                )}
              >
                {moment.status}
              </Badge>
              {moment.source_agent === "content_director" && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-red-500/10 text-red-300 border-red-500/20"
                >
                  director
                </Badge>
              )}
              {moment.confidence != null && (
                <ConfidencePill
                  score={moment.confidence}
                  showLabel={false}
                />
              )}
            </div>
            <p className="text-xs text-[#A3A3A3] mb-2">
              Trigger: {moment.trigger_event.replace(/_/g, " ")}
            </p>
            <p className="text-sm text-[#D4D4D4] whitespace-pre-line leading-relaxed">
              {moment.content}
            </p>
            {moment.hashtags && moment.hashtags.length > 0 && (
              <p className="text-xs text-cyan-400 mt-2 font-mono">
                {moment.hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            )}
            {moment.hook_ideas && moment.hook_ideas.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#8892a4]">
                  Alt hooks
                </p>
                {moment.hook_ideas.map((h, i) => (
                  <p key={i} className="text-xs text-[#A3A3A3] italic">
                    → {h}
                  </p>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {moment.platform_suggestions?.map((platform) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    platformColors[platform] ||
                      "bg-[#1A1A1A] text-[#A3A3A3] border-[#222]"
                  )}
                >
                  {platform}
                </Badge>
              ))}
            </div>
            {moment.reasoning && (
              <p className="text-[10px] text-[#555] italic mt-2">
                {moment.reasoning}
              </p>
            )}
          </div>
          {moment.status === "suggested" && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onUpdateStatus(moment.id, "used")}
                className="inline-flex items-center justify-center rounded-md h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                title="Mark as used"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => onUpdateStatus(moment.id, "dismissed")}
                className="inline-flex items-center justify-center rounded-md h-8 w-8 text-[#555] hover:bg-white/[0.03]"
                title="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DirectorDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [momentType, setMomentType] =
    useState<ContentMomentType>("song_release");
  const [songs, setSongs] = useState<Array<{ id: string; title: string }>>(
    []
  );
  const [songId, setSongId] = useState<string>("");
  const [platforms, setPlatforms] = useState<ContentPlatform[]>([
    "instagram",
    "tiktok",
  ]);
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateError, setGateError] =
    useState<null | { pct: number; msg: string }>(null);

  const togglePlatform = (p: ContentPlatform) =>
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const reset = () => {
    setMomentType("song_release");
    setSongId("");
    setPlatforms(["instagram", "tiktok"]);
    setCustomNote("");
    setGateError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/songs");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSongs(
              data.map((s: { id: string; title: string }) => ({
                id: s.id,
                title: s.title,
              }))
            );
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [open]);

  const submit = async () => {
    setLoading(true);
    setGateError(null);
    try {
      const res = await fetch("/api/agents/content-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moment_type: momentType,
          source_song_id: songId || undefined,
          platforms,
          custom_note: customNote || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 422 && data?.gated) {
        setGateError({ pct: data.completeness_pct, msg: data.message });
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Director failed");
      toast.success(
        `Generated ${data?.variants?.length ?? 0} content moment${data?.variants?.length === 1 ? "" : "s"}`
      );
      setOpen(false);
      reset();
      onCreated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Director failed"
      );
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Wand2 className="size-4 mr-2" />
            Director
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Content Director</DialogTitle>
          <DialogDescription>
            Brand-aware content from a specific moment. Requires Brand Wiki ≥
            60% complete.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Moment type</Label>
            <Select
              value={momentType}
              onValueChange={(v) => setMomentType(v as ContentMomentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOMENT_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(momentType === "song_release" ||
            momentType === "placement_win" ||
            momentType === "behind_scenes") && (
            <div className="space-y-2">
              <Label>Source song (optional)</Label>
              <Select
                value={songId || "none"}
                onValueChange={(v) => setSongId(v && v !== "none" ? v : "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a song" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(none)</SelectItem>
                  {songs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                    platforms.includes(p)
                      ? "border-red-500/40 bg-red-500/10 text-red-300"
                      : "border-[#1A1A1A] text-[#A3A3A3] hover:border-[#333] hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Extra context (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Anything specific the Director should know — timing, angle, concept."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>

          {gateError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    Brand Wiki at {gateError.pct}% — Director blocked
                  </p>
                  <p className="text-xs text-amber-100/80 mt-1">
                    {gateError.msg}
                  </p>
                </div>
              </div>
              <Link
                href="/brand"
                className="text-xs font-medium underline underline-offset-2 hover:text-amber-100"
              >
                Open Brand Wiki →
              </Link>
            </div>
          )}

          <Button
            className="w-full"
            onClick={submit}
            disabled={loading || platforms.length === 0}
          >
            {loading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="size-4 mr-2" />
            )}
            Generate variants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
