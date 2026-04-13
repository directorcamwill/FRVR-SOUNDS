"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { STEM_TYPES } from "@/lib/utils/constants";
import { Plus, Trash2, FileAudio } from "lucide-react";
import type { Stem } from "@/types/song";

interface StemsManagerProps {
  songId: string;
  stems: Stem[];
  onStemsChange: () => void;
}

export function StemsManager({ songId, stems, onStemsChange }: StemsManagerProps) {
  const [adding, setAdding] = useState(false);
  const [stemType, setStemType] = useState<string>("vocals");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      // Get signed URL for stems bucket
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const path = `${songId}/${stemType}_${file.name}`;

      // Upload via fetch to storage
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/stems/${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            Authorization: `Bearer ${anonKey}`,
            "x-upsert": "true",
          },
          body: file,
        }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");

      const fileUrl = `${supabaseUrl}/storage/v1/object/public/stems/${path}`;

      // Create stem record
      await fetch(`/api/songs/${songId}/stems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stem_type: stemType,
          file_url: fileUrl,
          file_name: file.name,
          file_size_bytes: file.size,
        }),
      });

      setAdding(false);
      onStemsChange();
    } catch (err) {
      console.error("Stem upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (stemId: string) => {
    // Note: would need a DELETE endpoint; for now just remove from UI
    // In a full implementation, add DELETE /api/songs/[songId]/stems/[stemId]
    onStemsChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Stems
        </h3>
        <Button variant="outline" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-3 mr-1" />
          Add Stem
        </Button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#1A1A1A]">
          <Select value={stemType} onValueChange={(val) => val && setStemType(val)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.flac,.aif,.aiff"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Choose File"}
          </Button>
        </div>
      )}

      {stems.length === 0 ? (
        <p className="text-sm text-[#555] py-4 text-center">
          No stems uploaded yet. Add stems to improve your sync score.
        </p>
      ) : (
        <div className="space-y-2">
          {stems.map((stem) => (
            <div
              key={stem.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A]"
            >
              <FileAudio className="size-4 text-[#A3A3A3] shrink-0" />
              <Badge variant="secondary" className="shrink-0 capitalize">
                {stem.stem_type.replace("_", " ")}
              </Badge>
              <span className="text-sm text-white truncate flex-1">
                {stem.file_name}
              </span>
              {stem.file_size_bytes && (
                <span className="text-xs text-[#555] shrink-0">
                  {(stem.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
              <button
                onClick={() => handleDelete(stem.id)}
                className="text-[#555] hover:text-red-400 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
