"use client";

import { SongCard } from "./song-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Music } from "lucide-react";
import type { Song } from "@/types/song";

interface SongListProps {
  songs: Song[];
  loading: boolean;
  onUpload?: () => void;
}

export function SongList({ songs, loading, onUpload }: SongListProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No songs yet"
        description="Upload your first song to start building your vault."
        actionLabel={onUpload ? "Add Your First Song" : undefined}
        onAction={onUpload}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}
