"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Check,
  Loader2,
  Music,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SongLabProject {
  id: string;
  title: string;
  status: string;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  mood: string | null;
  lyrics: string | null;
  notes: string | null;
  structure: string | null;
  reference_tracks: string[];
  checklist: ChecklistItem[];
  song_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

const stages = [
  "idea",
  "writing",
  "producing",
  "recording",
  "mixing",
  "mastering",
  "complete",
] as const;

const stageLabels: Record<string, string> = {
  idea: "Idea",
  writing: "Writing",
  producing: "Producing",
  recording: "Recording",
  mixing: "Mixing",
  mastering: "Mastering",
  complete: "Complete",
};

const stageChecklist: Record<string, string[]> = {
  idea: ["Concept defined", "Mood reference found", "Key/BPM decided"],
  writing: ["Lyrics draft complete", "Melody sketch done", "Structure set"],
  producing: [
    "Beat/instrumental started",
    "Arrangement complete",
    "Sound design done",
  ],
  recording: ["Vocals recorded", "Takes selected", "Comp done"],
  mixing: ["Rough mix done", "Levels balanced", "Effects applied"],
  mastering: [
    "Master bounce done",
    "Multiple format exports",
    "Loudness checked",
  ],
  complete: ["Metadata filled", "Stems exported", "Sync score run"],
};

const musicalKeys = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Am",
  "A#m",
  "Bm",
];

export default function SongLabDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<SongLabProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [newRef, setNewRef] = useState("");

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/song-lab/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        // Ensure checklist is an array
        if (!Array.isArray(data.checklist)) data.checklist = [];
        setProject(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const autoSave = useCallback(
    (updates: Partial<SongLabProject>) => {
      if (!project) return;
      const updated = { ...project, ...updates };
      setProject(updated);
      setSaving(true);

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await fetch(`/api/song-lab/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch {
          // ignore
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [project, projectId]
  );

  const handleStageClick = (stage: string) => {
    autoSave({ status: stage });
  };

  const handleChecklistToggle = (itemId: string) => {
    if (!project) return;
    const updated = project.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    autoSave({ checklist: updated });
  };

  const initChecklist = useCallback(() => {
    if (!project) return;
    const items = stageChecklist[project.status] || [];
    const existing = project.checklist || [];
    // Keep existing items that match, add new ones
    const newChecklist = items.map((label) => {
      const existingItem = existing.find((e) => e.label === label);
      return (
        existingItem || {
          id: crypto.randomUUID(),
          label,
          done: false,
        }
      );
    });
    if (
      JSON.stringify(newChecklist.map((c) => c.label)) !==
      JSON.stringify(existing.map((c) => c.label))
    ) {
      autoSave({ checklist: newChecklist });
    }
  }, [project, autoSave]);

  useEffect(() => {
    if (project && project.status) {
      initChecklist();
    }
    // Only run when status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status]);

  const handleAddRef = () => {
    if (!newRef.trim() || !project) return;
    const updated = [...(project.reference_tracks || []), newRef.trim()];
    autoSave({ reference_tracks: updated });
    setNewRef("");
  };

  const handleRemoveRef = (index: number) => {
    if (!project) return;
    const updated = project.reference_tracks.filter((_, i) => i !== index);
    autoSave({ reference_tracks: updated });
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await fetch(`/api/song-lab/${projectId}/promote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProject((prev) => (prev ? { ...prev, song_id: data.song.id } : prev));
      }
    } catch {
      // ignore
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-white mb-4">Project not found</p>
        <Button size="sm" onClick={() => router.push("/song-lab")}>
          Back to Song Lab
        </Button>
      </div>
    );
  }

  const currentStageIndex = stages.indexOf(
    project.status as (typeof stages)[number]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/song-lab")}
            className="text-[#A3A3A3] hover:text-white transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[10px] text-[#A3A3A3] flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>
        {project.song_id ? (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            <Music className="size-3 mr-1" />
            In Vault
          </Badge>
        ) : (
          project.status === "complete" && (
            <Button size="sm" onClick={handlePromote} disabled={promoting}>
              {promoting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Upload className="size-4 mr-2" />
              )}
              Promote to Vault
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <input
            type="text"
            value={project.title}
            onChange={(e) => autoSave({ title: e.target.value })}
            className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none border-b border-transparent focus:border-[#DC2626]/30 pb-1"
            placeholder="Project title..."
          />

          {/* Stage Selector */}
          <div className="flex items-center gap-1">
            {stages.map((stage, i) => (
              <button
                key={stage}
                onClick={() => handleStageClick(stage)}
                className="flex-1 group relative"
              >
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i <= currentStageIndex
                      ? "bg-[#DC2626]"
                      : "bg-[#1A1A1A] group-hover:bg-[#333]"
                  )}
                />
                <span
                  className={cn(
                    "block text-[9px] mt-1 text-center transition-colors capitalize",
                    i === currentStageIndex
                      ? "text-[#DC2626] font-semibold"
                      : i < currentStageIndex
                        ? "text-[#A3A3A3]"
                        : "text-[#555]"
                  )}
                >
                  {stageLabels[stage]}
                </span>
              </button>
            ))}
          </div>

          {/* Musical Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                BPM
              </label>
              <input
                type="number"
                value={project.bpm || ""}
                onChange={(e) =>
                  autoSave({
                    bpm: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="120"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Key
              </label>
              <select
                value={project.key || ""}
                onChange={(e) =>
                  autoSave({ key: e.target.value || null })
                }
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]/50"
              >
                <option value="">Select key</option>
                {musicalKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Genre
              </label>
              <input
                type="text"
                value={project.genre || ""}
                onChange={(e) =>
                  autoSave({ genre: e.target.value || null })
                }
                placeholder="e.g. R&B, Pop"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
                Mood
              </label>
              <input
                type="text"
                value={project.mood || ""}
                onChange={(e) =>
                  autoSave({ mood: e.target.value || null })
                }
                placeholder="e.g. Chill, Dark"
                className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
            </div>
          </div>

          {/* Structure */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
              Song Structure
            </label>
            <input
              type="text"
              value={project.structure || ""}
              onChange={(e) =>
                autoSave({ structure: e.target.value || null })
              }
              placeholder="Intro - V1 - Chorus - V2 - Chorus - Bridge - Chorus - Outro"
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
            />
          </div>

          {/* Lyrics */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
              Lyrics
            </label>
            <textarea
              value={project.lyrics || ""}
              onChange={(e) =>
                autoSave({ lyrics: e.target.value || null })
              }
              placeholder="Write your lyrics here..."
              rows={12}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-1 block">
              Notes
            </label>
            <textarea
              value={project.notes || ""}
              onChange={(e) =>
                autoSave({ notes: e.target.value || null })
              }
              placeholder="Production notes, ideas, reminders..."
              rows={4}
              className="w-full bg-[#111] border border-[#1A1A1A] rounded px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50 resize-none"
            />
          </div>

          {/* Reference Tracks */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-2 block">
              Reference Tracks
            </label>
            <div className="space-y-1.5 mb-2">
              {(project.reference_tracks || []).map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2"
                >
                  <Music className="size-3 text-[#A3A3A3] shrink-0" />
                  <span className="text-sm text-white flex-1">{ref}</span>
                  <button
                    onClick={() => handleRemoveRef(i)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRef();
                }}
                placeholder="Add reference track..."
                className="flex-1 bg-[#111] border border-[#1A1A1A] rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DC2626]/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddRef}
                disabled={!newRef.trim()}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Tools */}
        <div className="space-y-5">
          {/* Production Checklist */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="size-4 text-[#DC2626]" />
                {stageLabels[project.status] || "Production"} Checklist
              </h3>
              <div className="space-y-2">
                {(project.checklist || []).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChecklistToggle(item.id)}
                    className="flex items-center gap-2.5 w-full text-left group"
                  >
                    <div
                      className={cn(
                        "size-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        item.done
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-[#333] group-hover:border-[#DC2626]"
                      )}
                    >
                      {item.done && (
                        <svg
                          className="size-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        item.done
                          ? "text-zinc-500 line-through"
                          : "text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Status */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {project.status !== "complete" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const nextIndex = currentStageIndex + 1;
                      if (nextIndex < stages.length) {
                        handleStageClick(stages[nextIndex]);
                      }
                    }}
                  >
                    Advance to{" "}
                    {stageLabels[stages[currentStageIndex + 1]] || "Next"}
                  </Button>
                )}
                {project.status === "complete" && !project.song_id && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handlePromote}
                    disabled={promoting}
                  >
                    {promoting ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="size-4 mr-2" />
                    )}
                    Promote to Vault
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-400 hover:text-red-300"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this project?"
                      )
                    ) {
                      await fetch(`/api/song-lab/${projectId}`, {
                        method: "DELETE",
                      });
                      router.push("/song-lab");
                    }
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
