"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Plus, Upload, Music, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/aiff",
  "audio/x-aiff",
];
const ACCEPTED_EXTENSIONS = ".mp3,.wav,.flac,.aif,.aiff";

interface UploadDialogProps {
  onSuccess: () => void;
}

export function UploadDialog({ onSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setFile(null);
    setProgress(0);
    setError(null);
    setUploading(false);
  };

  const handleFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp3|wav|flac|aif|aiff)$/i)) {
      setError("Please upload an MP3, WAV, FLAC, or AIF file.");
      return;
    }
    setFile(f);
    setError(null);
    if (!title) {
      setTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [title]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      // 1. Create song record
      const createRes = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Untitled Track" }),
      });
      if (!createRes.ok) throw new Error("Failed to create song record");
      const song = await createRes.json();
      setProgress(25);

      // 2. Get signed upload URL
      const uploadRes = await fetch("/api/songs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: song.id,
          fileName: file.name,
          contentType: file.type,
        }),
      });
      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, path, token } = await uploadRes.json();
      setProgress(40);

      // 3. Upload file to signed URL
      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Failed to upload file");
      setProgress(75);

      // 4. Store the storage path (not public URL since bucket is private)
      const fileUrl = path;

      const patchRes = await fetch(`/api/songs/${song.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: fileUrl,
          file_name: file.name,
          file_size_bytes: file.size,
          status: "active",
        }),
      });
      if (!patchRes.ok) throw new Error("Failed to update song record");
      setProgress(100);

      // 5. Success
      setTimeout(() => {
        setOpen(false);
        reset();
        onSuccess();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger render={<Button><Plus className="size-4 mr-2" />Add Song</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Song</DialogTitle>
          <DialogDescription>
            Add a new song to your vault. Supports MP3, WAV, FLAC, and AIF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Song Title</Label>
            <Input
              id="title"
              placeholder="Enter song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Dropzone */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
              dragActive
                ? "border-[#DC2626] bg-[#DC2626]/5"
                : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-[#333] hover:border-[#555]"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
              disabled={uploading}
            />
            {file ? (
              <div className="flex items-center gap-3 text-sm">
                <Music className="size-8 text-emerald-400" />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <p className="text-[#A3A3A3]">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-[#A3A3A3] hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <Upload className="size-8 text-[#555] mb-2" />
                <p className="text-sm text-[#A3A3A3]">
                  Drag and drop your audio file here
                </p>
                <p className="text-xs text-[#555] mt-1">
                  or click to browse
                </p>
              </>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <Progress value={progress}>
              <ProgressLabel>Uploading...</ProgressLabel>
              <ProgressValue />
            </Progress>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Upload button */}
          <Button
            className="w-full"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload Song"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
