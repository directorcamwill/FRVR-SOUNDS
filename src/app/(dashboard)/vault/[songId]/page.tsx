"use client";

import { use } from "react";
import Link from "next/link";
import { useSong } from "@/lib/hooks/use-songs";
import { MetadataForm } from "@/components/vault/metadata-form";
import { SyncScoreDisplay } from "@/components/vault/sync-score-display";
import { StemsManager } from "@/components/vault/stems-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import type { SyncScore } from "@/types/song";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = use(params);
  const { song, loading, refetch } = useSong(songId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="space-y-4">
        <p className="text-[#A3A3A3]">Song not found.</p>
        <Link href="/vault">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" />
            Back to Vault
          </Button>
        </Link>
      </div>
    );
  }

  const latestScore: SyncScore | null = song.sync_scores?.length
    ? song.sync_scores.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      )
    : null;

  const stems = song.stems || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vault">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">{song.title}</h2>
          <p className="text-sm text-[#A3A3A3] capitalize">{song.status}</p>
        </div>
      </div>

      {/* Audio Player */}
      {song.file_url && (
        <div className="rounded-lg bg-[#111] p-4">
          <audio
            controls
            src={song.file_url}
            className="w-full"
            preload="metadata"
          />
        </div>
      )}

      {/* Desktop: Two-column layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
        <div className="space-y-6">
          <MetadataForm song={song} />
        </div>
        <div className="space-y-6">
          <SyncScoreDisplay
            songId={song.id}
            score={latestScore}
            onScored={refetch}
          />
          <StemsManager
            songId={song.id}
            stems={stems}
            onStemsChange={refetch}
          />
        </div>
      </div>

      {/* Mobile: Tabs layout */}
      <div className="lg:hidden">
        <Tabs defaultValue="metadata">
          <TabsList>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
            <TabsTrigger value="stems">Stems</TabsTrigger>
          </TabsList>
          <TabsContent value="metadata" className="mt-4">
            <MetadataForm song={song} />
          </TabsContent>
          <TabsContent value="score" className="mt-4">
            <SyncScoreDisplay
              songId={song.id}
              score={latestScore}
              onScored={refetch}
            />
          </TabsContent>
          <TabsContent value="stems" className="mt-4">
            <StemsManager
              songId={song.id}
              stems={stems}
              onStemsChange={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
