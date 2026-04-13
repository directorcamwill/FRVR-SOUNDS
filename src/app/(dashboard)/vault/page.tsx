"use client";

import { useSongs } from "@/lib/hooks/use-songs";
import { SongList } from "@/components/vault/song-list";
import { UploadDialog } from "@/components/vault/upload-dialog";

export default function VaultPage() {
  const { songs, loading, refetch } = useSongs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Song Vault</h2>
          <p className="text-sm text-[#A3A3A3]">
            Manage your catalog of songs and stems
          </p>
        </div>
        <UploadDialog onSuccess={refetch} />
      </div>

      <SongList songs={songs} loading={loading} />
    </div>
  );
}
