"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Music,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KnowledgeLink } from "@/components/learn/knowledge-link";
import type { SongSplit, SplitParticipant } from "@/types/financial";
import type { Song } from "@/types/song";

const ROLE_OPTIONS = [
  { value: "songwriter", label: "Songwriter" },
  { value: "producer", label: "Producer" },
  { value: "artist", label: "Artist" },
  { value: "featured", label: "Featured" },
  { value: "publisher", label: "Publisher" },
  { value: "other", label: "Other" },
];

const ROLE_COLORS: Record<string, string> = {
  songwriter: "bg-blue-500",
  producer: "bg-purple-500",
  artist: "bg-[#DC2626]",
  featured: "bg-pink-500",
  publisher: "bg-emerald-500",
  other: "bg-gray-500",
};

export default function SplitsPage() {
  const [splits, setSplits] = useState<SongSplit[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSplit, setExpandedSplit] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [splitsRes, songsRes] = await Promise.all([
        fetch("/api/splits"),
        fetch("/api/songs"),
      ]);
      if (splitsRes.ok) setSplits(await splitsRes.json());
      if (songsRes.ok) setSongs(await songsRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const songsWithSplits = new Set(splits.map((s) => s.song_id));
  const songsWithout = songs.filter((s) => !songsWithSplits.has(s.id));

  async function handleCreateSplit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: fd.get("song_id") }),
      });
      setShowCreate(false);
      fetchData();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleAddParticipant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showAddParticipant) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch(`/api/splits/${showAddParticipant}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          role: fd.get("role"),
          writer_share: Number(fd.get("writer_share") || 0),
          publisher_share: Number(fd.get("publisher_share") || 0),
          pro_affiliation: fd.get("pro_affiliation") || null,
          ipi_number: fd.get("ipi_number") || null,
          email: fd.get("email") || null,
        }),
      });
      setShowAddParticipant(null);
      fetchData();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveParticipant(splitId: string, participantId: string) {
    try {
      await fetch(`/api/splits/${splitId}/participants?participantId=${participantId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch {
      // ignore
    }
  }

  async function handleDeleteSplit(splitId: string) {
    try {
      await fetch(`/api/splits/${splitId}`, { method: "DELETE" });
      fetchData();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 bg-[#1A1A1A]" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Song Splits</h2>
          <p className="text-sm text-[#A3A3A3]">
            Manage ownership percentages for each track
          </p>
          <KnowledgeLink topicId="split-sheets" label="Split Sheets" className="mt-1" />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger render={<Button className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"><Plus className="size-4 mr-1" /> Add Split</Button>} />
          <DialogContent className="bg-[#111111] border-[#1A1A1A]">
            <DialogHeader>
              <DialogTitle className="text-white">Create Song Split</DialogTitle>
            </DialogHeader>
            {songsWithout.length > 0 ? (
              <form onSubmit={handleCreateSplit} className="space-y-4">
                <div>
                  <Label className="text-[#A3A3A3]">Song</Label>
                  <Select name="song_id" required>
                    <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                      <SelectValue placeholder="Select song" />
                    </SelectTrigger>
                    <SelectContent>
                      {songsWithout.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Create Split"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-[#666]">All songs already have splits defined.</p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Splits List */}
      {splits.length > 0 ? (
        <div className="space-y-3">
          {splits.map((split) => {
            const isExpanded = expandedSplit === split.id;
            const participants = split.split_participants || [];
            const totalShare = participants.reduce((sum, p) => sum + (p.writer_share + p.publisher_share), 0);
            const isValid = totalShare === 100;

            return (
              <Card key={split.id} className="bg-[#111111] border-[#1A1A1A]">
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() => setExpandedSplit(isExpanded ? null : split.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-[#A3A3A3]" />
                      ) : (
                        <ChevronRight className="size-4 text-[#A3A3A3]" />
                      )}
                      <div>
                        <CardTitle className="text-white text-sm">
                          {split.songs?.title || "Unknown Song"}
                        </CardTitle>
                        <p className="text-xs text-[#A3A3A3] mt-0.5">
                          {participants.length} participant{participants.length !== 1 ? "s" : ""}
                          {" "} · {totalShare}% allocated
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isValid && participants.length > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {totalShare}% / 100%
                        </span>
                      )}
                      {isValid && participants.length > 0 && (
                        <span className="text-xs text-emerald-400">100%</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Visual Split Bar */}
                    {participants.length > 0 && (
                      <div className="flex h-3 rounded-full overflow-hidden mb-4">
                        {participants.map((p) => {
                          const share = p.writer_share + p.publisher_share;
                          return (
                            <div
                              key={p.id}
                              className={cn("transition-all", ROLE_COLORS[p.role] || "bg-gray-500")}
                              style={{ width: `${share}%` }}
                              title={`${p.name}: ${share}%`}
                            />
                          );
                        })}
                        {totalShare < 100 && (
                          <div
                            className="bg-[#333] opacity-50"
                            style={{ width: `${100 - totalShare}%` }}
                          />
                        )}
                      </div>
                    )}

                    {/* Participants */}
                    <div className="space-y-2 mb-4">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-black rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("size-2 rounded-full", ROLE_COLORS[p.role] || "bg-gray-500")} />
                            <div>
                              <p className="text-sm text-white">{p.name}</p>
                              <p className="text-xs text-[#A3A3A3] capitalize">{p.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-[#A3A3A3]">
                                Writer: {p.writer_share}% · Publisher: {p.publisher_share}%
                              </p>
                              <p className="text-sm font-medium text-white">
                                Total: {p.writer_share + p.publisher_share}%
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParticipant(split.id, p.id)}
                              className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Dialog
                        open={showAddParticipant === split.id}
                        onOpenChange={(open) => setShowAddParticipant(open ? split.id : null)}
                      >
                        <DialogTrigger render={<Button variant="outline" size="sm" className="border-[#1A1A1A] text-[#A3A3A3] hover:text-white"><Plus className="size-3 mr-1" /> Add Participant</Button>} />
                        <DialogContent className="bg-[#111111] border-[#1A1A1A]">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add Participant</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleAddParticipant} className="space-y-4">
                            <div>
                              <Label className="text-[#A3A3A3]">Name</Label>
                              <Input name="name" required className="bg-black border-[#1A1A1A] text-white" />
                            </div>
                            <div>
                              <Label className="text-[#A3A3A3]">Role</Label>
                              <Select name="role" required>
                                <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-[#A3A3A3]">Writer Share (%)</Label>
                                <Input name="writer_share" type="number" step="0.01" min="0" max="100" defaultValue="0" className="bg-black border-[#1A1A1A] text-white" />
                              </div>
                              <div>
                                <Label className="text-[#A3A3A3]">Publisher Share (%)</Label>
                                <Input name="publisher_share" type="number" step="0.01" min="0" max="100" defaultValue="0" className="bg-black border-[#1A1A1A] text-white" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[#A3A3A3]">PRO Affiliation</Label>
                              <Input name="pro_affiliation" className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. ASCAP, BMI, SESAC" />
                            </div>
                            <div>
                              <Label className="text-[#A3A3A3]">IPI Number</Label>
                              <Input name="ipi_number" className="bg-black border-[#1A1A1A] text-white" />
                            </div>
                            <div>
                              <Label className="text-[#A3A3A3]">Email</Label>
                              <Input name="email" type="email" className="bg-black border-[#1A1A1A] text-white" />
                            </div>
                            <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                              {saving ? <Loader2 className="size-4 animate-spin" /> : "Add Participant"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSplit(split.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="size-3 mr-1" /> Delete Split
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardContent className="py-12 text-center">
            <Users className="size-10 mx-auto mb-3 text-[#333]" />
            <p className="text-white font-medium">No splits configured</p>
            <p className="text-sm text-[#666] mt-1">
              Set up ownership splits for your songs to track who gets paid
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"
            >
              <Plus className="size-4 mr-1" /> Create First Split
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Songs without splits */}
      {songsWithout.length > 0 && splits.length > 0 && (
        <Card className="bg-[#111111] border-[#1A1A1A]">
          <CardHeader>
            <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {songsWithout.length} Song{songsWithout.length !== 1 ? "s" : ""} Without Splits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {songsWithout.slice(0, 10).map((song) => (
                <div key={song.id} className="flex items-center justify-between bg-black rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Music className="size-4 text-[#666]" />
                    <span className="text-sm text-white">{song.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#DC2626]"
                    onClick={async () => {
                      await fetch("/api/splits", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ song_id: song.id }),
                      });
                      fetchData();
                    }}
                  >
                    <Plus className="size-3 mr-1" /> Add Split
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
