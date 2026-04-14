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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KnowledgeLink } from "@/components/learn/knowledge-link";
import type { RegistrationStatus } from "@/types/financial";

interface SongRegistrationRow {
  song: { id: string; title: string; status: string };
  registrations: {
    id: string;
    registration_type: string;
    status: RegistrationStatus;
    platform: string | null;
    external_id: string | null;
  }[];
  missing_types: string[];
  is_complete: boolean;
}

interface RegistrationData {
  songs: SongRegistrationRow[];
  missing_count: number;
  total_songs: number;
}

const REG_TYPES = [
  { key: "pro", label: "PRO" },
  { key: "mlc", label: "MLC" },
  { key: "soundexchange", label: "SoundEx" },
  { key: "publishing_admin", label: "Pub Admin" },
  { key: "copyright", label: "Copyright" },
  { key: "isrc", label: "ISRC" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  complete: <CheckCircle2 className="size-4 text-emerald-400" />,
  pending: <Clock className="size-4 text-amber-400" />,
  missing: <XCircle className="size-4 text-red-400" />,
};

export default function RegistrationsPage() {
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [editReg, setEditReg] = useState<{
    songId: string;
    songTitle: string;
    regType: string;
    regId: string | null;
    currentStatus: RegistrationStatus;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/registrations");
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAutoScan() {
    setScanning(true);
    try {
      await fetch("/api/agents/royalty-scan", { method: "POST" });
      await fetchData();
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  }

  function getRegStatus(song: SongRegistrationRow, regType: string): { status: RegistrationStatus; id: string | null } {
    const reg = song.registrations.find((r) => r.registration_type === regType);
    if (reg) return { status: reg.status as RegistrationStatus, id: reg.id };
    if (song.missing_types.includes(regType)) return { status: "missing", id: null };
    return { status: "missing", id: null };
  }

  async function handleUpdateStatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editReg) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const newStatus = fd.get("status") as string;

    try {
      if (editReg.regId) {
        // Update existing
        await fetch(`/api/registrations/${editReg.regId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            platform: fd.get("platform") || null,
            external_id: fd.get("external_id") || null,
          }),
        });
      } else {
        // Create new
        await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            song_id: editReg.songId,
            registration_type: editReg.regType,
            status: newStatus,
            platform: fd.get("platform") || null,
            external_id: fd.get("external_id") || null,
          }),
        });
      }
      setEditReg(null);
      fetchData();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const filteredSongs = data?.songs.filter((s) =>
    !filter || s.song.title.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 bg-[#1A1A1A]" />
        <Skeleton className="h-96 bg-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Registration Status</h2>
          <p className="text-sm text-[#A3A3A3]">
            Track royalty registrations across all platforms
          </p>
          <div className="flex gap-3 mt-1">
            <KnowledgeLink topicId="pro-registration" label="PRO Registration" />
            <KnowledgeLink topicId="publishing-admin" label="Publishing Admin" />
          </div>
        </div>
        <Button
          onClick={handleAutoScan}
          disabled={scanning}
          className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"
        >
          {scanning ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="size-4 mr-1" />
          )}
          {scanning ? "Scanning..." : "Auto-Scan"}
        </Button>
      </div>

      {/* Missing Banner */}
      {data && data.missing_count > 0 && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="size-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">
              {data.missing_count} song{data.missing_count !== 1 ? "s" : ""} with missing registrations
            </p>
            <p className="text-xs text-red-400/70">
              Click any red cell below to update its status
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
        <Input
          placeholder="Filter songs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10 bg-[#111111] border-[#1A1A1A] text-white"
        />
      </div>

      {/* Registration Grid */}
      <Card className="bg-[#111111] border-[#1A1A1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left py-3 px-4 text-xs text-[#A3A3A3] uppercase tracking-wider font-medium">
                  Song Title
                </th>
                {REG_TYPES.map((rt) => (
                  <th
                    key={rt.key}
                    className="text-center py-3 px-3 text-xs text-[#A3A3A3] uppercase tracking-wider font-medium"
                  >
                    {rt.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSongs.map((song) => (
                <tr key={song.song.id} className="border-b border-[#1A1A1A]/50 hover:bg-black/50">
                  <td className="py-3 px-4">
                    <p className="text-sm text-white">{song.song.title}</p>
                  </td>
                  {REG_TYPES.map((rt) => {
                    const { status, id } = getRegStatus(song, rt.key);
                    return (
                      <td key={rt.key} className="text-center py-3 px-3">
                        <button
                          onClick={() =>
                            setEditReg({
                              songId: song.song.id,
                              songTitle: song.song.title,
                              regType: rt.key,
                              regId: id,
                              currentStatus: status,
                            })
                          }
                          className={cn(
                            "inline-flex items-center justify-center size-8 rounded-lg transition-colors",
                            status === "complete" && "bg-emerald-500/10 hover:bg-emerald-500/20",
                            status === "pending" && "bg-amber-500/10 hover:bg-amber-500/20",
                            status === "missing" && "bg-red-500/10 hover:bg-red-500/20"
                          )}
                        >
                          {STATUS_ICON[status]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredSongs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#666]">
                    {filter ? "No songs match your filter" : "No songs in your catalog yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-[#A3A3A3]">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-400" /> Complete
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber-400" /> Pending
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="size-3.5 text-red-400" /> Missing
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editReg} onOpenChange={(open) => !open && setEditReg(null)}>
        <DialogContent className="bg-[#111111] border-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Update Registration
            </DialogTitle>
          </DialogHeader>
          {editReg && (
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm text-white">{editReg.songTitle}</p>
                <p className="text-xs text-[#A3A3A3] uppercase mt-0.5">
                  {REG_TYPES.find((r) => r.key === editReg.regType)?.label || editReg.regType}
                </p>
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Status</Label>
                <Select name="status" defaultValue={editReg.currentStatus}>
                  <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A3A3A3]">Platform</Label>
                <Input name="platform" className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. ASCAP, BMI" />
              </div>
              <div>
                <Label className="text-[#A3A3A3]">External ID</Label>
                <Input name="external_id" className="bg-black border-[#1A1A1A] text-white" placeholder="Registration ID" />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Update"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
