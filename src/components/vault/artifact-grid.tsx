"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Upload,
  CheckCircle2,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-song artifact grid — surfaces the 8 signature deliverables (per
 * SYNC_MIX_MASTER_SPEC Part 3) as fixed slots. Each slot shows either an
 * upload affordance or the rendered state (LUFS target + QC badge).
 * Extra artifacts (cutdowns / stings / loops) render below the signature grid.
 */

export type ArtifactType =
  | "streaming_master"
  | "loud_master"
  | "sync_dynamic_master"
  | "broadcast_master"
  | "instrumental"
  | "acapella"
  | "tv_mix"
  | "stems_zip"
  | "cutdown_60"
  | "cutdown_30"
  | "cutdown_15"
  | "sting"
  | "loop";

type Family = "streaming" | "sync" | "utility";

interface ArtifactSpec {
  type: ArtifactType;
  label: string;
  family: Family;
  lufs: number | null;
  truePeak: number | null;
  description: string;
}

const SIGNATURE_ARTIFACTS: ArtifactSpec[] = [
  {
    type: "streaming_master",
    label: "Streaming Master",
    family: "streaming",
    lufs: -14,
    truePeak: -1,
    description: "Spotify / Apple balance",
  },
  {
    type: "loud_master",
    label: "Loud Master",
    family: "streaming",
    lufs: -9,
    truePeak: -1,
    description: "Louder consumer variant",
  },
  {
    type: "sync_dynamic_master",
    label: "Sync Dynamic Master",
    family: "sync",
    lufs: -18,
    truePeak: -2,
    description: "Preserves headroom for picture",
  },
  {
    type: "broadcast_master",
    label: "Broadcast Master",
    family: "sync",
    lufs: -24,
    truePeak: -2,
    description: "ATSC A/85 / EBU R128",
  },
  {
    type: "instrumental",
    label: "Instrumental",
    family: "utility",
    lufs: -14,
    truePeak: -1,
    description: "No vocal",
  },
  {
    type: "acapella",
    label: "A Cappella",
    family: "utility",
    lufs: -14,
    truePeak: -1,
    description: "Vocal only",
  },
  {
    type: "tv_mix",
    label: "TV Mix",
    family: "utility",
    lufs: -18,
    truePeak: -2,
    description: "No lead vocal",
  },
  {
    type: "stems_zip",
    label: "Stems ZIP",
    family: "utility",
    lufs: null,
    truePeak: null,
    description: "All stems bundled",
  },
];

const EXTRA_ARTIFACT_LABELS: Record<ArtifactType, string> = {
  streaming_master: "Streaming Master",
  loud_master: "Loud Master",
  sync_dynamic_master: "Sync Dynamic Master",
  broadcast_master: "Broadcast Master",
  instrumental: "Instrumental",
  acapella: "A Cappella",
  tv_mix: "TV Mix",
  stems_zip: "Stems ZIP",
  cutdown_60: ":60 Cutdown",
  cutdown_30: ":30 Cutdown",
  cutdown_15: ":15 Cutdown",
  sting: "Sting",
  loop: "Loop",
};

interface Deliverable {
  id: string;
  song_id: string | null;
  artifact_type: ArtifactType | null;
  title: string;
  status: string;
  current_count: number;
  target_count: number;
  lufs_target: number | null;
  true_peak_target: number | null;
  qc_passed: boolean | null;
  file_key: string | null;
  created_at: string;
}

const FAMILY_STYLES: Record<Family, { accent: string; bar: string; pill: string }> = {
  streaming: {
    accent: "border-cyan-500/20 bg-cyan-500/5",
    bar: "bg-cyan-400",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  sync: {
    accent: "border-red-500/20 bg-red-500/5",
    bar: "bg-red-500",
    pill: "bg-red-500/10 text-red-300 border-red-500/30",
  },
  utility: {
    accent: "border-[#c0c8d8]/20 bg-[#c0c8d8]/5",
    bar: "bg-[#c0c8d8]",
    pill: "bg-[#c0c8d8]/10 text-[#c0c8d8] border-[#c0c8d8]/30",
  },
};

function getDeliverableFor(
  deliverables: Deliverable[],
  type: ArtifactType
): Deliverable | null {
  return deliverables.find((d) => d.artifact_type === type) ?? null;
}

export function ArtifactGrid({ songId }: { songId: string }) {
  const [deliverables, setDeliverables] = useState<Deliverable[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deliverables?song_id=${songId}`);
      if (res.ok) {
        const data = await res.json();
        setDeliverables(Array.isArray(data) ? data : []);
      } else {
        setDeliverables([]);
      }
    } catch {
      setDeliverables([]);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const readyCount = (deliverables ?? []).filter(
    (d) => d.file_key || d.current_count > 0
  ).length;

  const extraArtifacts = (deliverables ?? []).filter(
    (d) =>
      d.artifact_type &&
      !SIGNATURE_ARTIFACTS.some((a) => a.type === d.artifact_type)
  );

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Artifacts</CardTitle>
          <p className="text-xs text-[#A3A3A3] mt-1">
            <span className="text-white tabular-nums">{readyCount}</span>
            <span className="text-[#A3A3A3]"> / 8 signature deliverables uploaded</span>
          </p>
        </div>
        <AddArtifactDialog songId={songId} onAdded={refetch} />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SIGNATURE_ARTIFACTS.map((spec) => {
                const existing = getDeliverableFor(
                  deliverables ?? [],
                  spec.type
                );
                return (
                  <ArtifactSlot
                    key={spec.type}
                    spec={spec}
                    deliverable={existing}
                    songId={songId}
                    onChanged={refetch}
                  />
                );
              })}
            </div>

            {extraArtifacts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#1A1A1A]">
                <p className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                  Alternates & cutdowns
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extraArtifacts.map((d) => (
                    <ArtifactSlot
                      key={d.id}
                      spec={{
                        type: d.artifact_type!,
                        label:
                          EXTRA_ARTIFACT_LABELS[d.artifact_type!] ?? d.title,
                        family: "utility",
                        lufs: d.lufs_target,
                        truePeak: d.true_peak_target,
                        description: "",
                      }}
                      deliverable={d}
                      songId={songId}
                      onChanged={refetch}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ArtifactSlot({
  spec,
  deliverable,
  songId,
  onChanged,
}: {
  spec: ArtifactSpec;
  deliverable: Deliverable | null;
  songId: string;
  onChanged: () => void;
}) {
  const styles = FAMILY_STYLES[spec.family];
  const ready = !!(deliverable && (deliverable.file_key || deliverable.current_count > 0));

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        ready ? styles.accent : "border-[#1A1A1A] bg-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {spec.label}
          </p>
          {spec.description && (
            <p className="text-xs text-[#A3A3A3] truncate">
              {spec.description}
            </p>
          )}
        </div>
        <Badge
          className={cn(
            "text-[9px] border shrink-0",
            ready ? styles.pill : "bg-[#1A1A1A] text-[#555] border-[#222]"
          )}
        >
          {ready ? "READY" : "NEEDED"}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2 tabular-nums text-[#A3A3A3]">
          {spec.lufs != null && <span>{spec.lufs} LUFS</span>}
          {spec.truePeak != null && <span>· {spec.truePeak} dBTP</span>}
          {spec.lufs == null && spec.truePeak == null && (
            <span>bundle · zip</span>
          )}
        </div>
        {ready ? (
          <div className="flex items-center gap-1.5">
            {deliverable?.qc_passed && (
              <CheckCircle2 className="size-3 text-emerald-400" />
            )}
            {deliverable?.file_key && (
              <span
                className="text-[#A3A3A3] hover:text-white"
                title={deliverable.file_key}
              >
                <Download className="size-3" />
              </span>
            )}
          </div>
        ) : (
          <QuickUploadButton
            artifactType={spec.type}
            lufs={spec.lufs}
            truePeak={spec.truePeak}
            title={spec.label}
            songId={songId}
            onUploaded={onChanged}
          />
        )}
      </div>
    </div>
  );
}

function QuickUploadButton({
  artifactType,
  lufs,
  truePeak,
  title,
  songId,
  onUploaded,
}: {
  artifactType: ArtifactType;
  lufs: number | null;
  truePeak: number | null;
  title: string;
  songId: string;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const createRes = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_id: songId,
          artifact_type: artifactType,
          title,
          lufs_target: lufs,
          true_peak_target: truePeak,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create deliverable row");
      const created = await createRes.json();

      const uploadRes = await fetch("/api/deliverables/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: created.id,
          fileName: file.name,
        }),
      });
      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, path } = await uploadRes.json();

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const patchRes = await fetch(`/api/deliverables/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_key: path,
          current_count: 1,
          status: "completed",
        }),
      });
      if (!patchRes.ok) throw new Error("Failed to finalize deliverable");

      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider",
          "text-[#A3A3A3] hover:text-white transition-colors",
          uploading && "opacity-50 cursor-wait"
        )}
        title={error ?? undefined}
      >
        {uploading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : error ? (
          <AlertCircle className="size-3 text-red-400" />
        ) : (
          <Upload className="size-3" />
        )}
        <span>{uploading ? "uploading" : error ? "retry" : "upload"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.flac,.aif,.aiff,.zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

function AddArtifactDialog({
  songId,
  onAdded,
}: {
  songId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [artifactType, setArtifactType] = useState<ArtifactType>("cutdown_60");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setArtifactType("cutdown_60");
    setFile(null);
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(10);
    try {
      const createRes = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_id: songId,
          artifact_type: artifactType,
          title: EXTRA_ARTIFACT_LABELS[artifactType],
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create row");
      const created = await createRes.json();
      setProgress(30);

      const uploadRes = await fetch("/api/deliverables/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: created.id,
          fileName: file.name,
        }),
      });
      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, path } = await uploadRes.json();
      setProgress(50);

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      setProgress(85);

      await fetch(`/api/deliverables/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_key: path,
          current_count: 1,
          status: "completed",
        }),
      });
      setProgress(100);

      setTimeout(() => {
        setOpen(false);
        reset();
        onAdded();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
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
          <Button variant="outline" size="sm">
            <Plus className="size-3.5 mr-1.5" />
            Add
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Artifact</DialogTitle>
          <DialogDescription>
            Attach a master, alt mix, or cutdown to this song.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Artifact type</Label>
            <Select
              value={artifactType}
              onValueChange={(v) => setArtifactType(v as ArtifactType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXTRA_ARTIFACT_LABELS) as ArtifactType[]).map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {EXTRA_ARTIFACT_LABELS[t]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="artifact-file">File</Label>
            <Input
              id="artifact-file"
              type="file"
              accept="audio/*,.wav,.mp3,.flac,.aif,.aiff,.zip"
              disabled={uploading}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-xs text-[#A3A3A3]">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>

          {uploading && (
            <Progress value={progress}>
              <ProgressLabel>Uploading...</ProgressLabel>
              <ProgressValue />
            </Progress>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload artifact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
