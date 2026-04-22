"use client";

import { useState } from "react";
import { useSongs } from "@/lib/hooks/use-songs";
import { SongList } from "@/components/vault/song-list";
import { UploadDialog } from "@/components/vault/upload-dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { LibrarySubmitDialog } from "@/components/library/submit-dialog";

export default function VaultPage() {
  const { songs, loading, refetch } = useSongs();
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Song Vault</h2>
          <p className="text-sm text-[#A3A3A3]">
            Manage your catalog of songs and stems
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSubmitOpen(true)}
            className="border-[#DC2626]/40 text-white hover:bg-[#DC2626]/10"
          >
            <Send className="size-3.5 mr-1.5" />
            Submit to Library
          </Button>
          <UploadDialog onSuccess={refetch} />
        </div>
      </div>

      <SongList songs={songs} loading={loading} />

      <LibrarySubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  );
}
