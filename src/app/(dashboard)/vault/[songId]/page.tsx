"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSong } from "@/lib/hooks/use-songs";
import { MetadataForm } from "@/components/vault/metadata-form";
import { SyncScoreDisplay } from "@/components/vault/sync-score-display";
import { SyncReadinessMeter } from "@/components/vault/sync-readiness-meter";
import { ArtifactGrid } from "@/components/vault/artifact-grid";
import { PackageBuilderPanel } from "@/components/vault/package-builder-panel";
import { ContentSyncLoopPanel } from "@/components/vault/content-sync-loop-panel";
import { BrandFitPanel } from "@/components/vault/brand-fit-panel";
import { PlacementMatchesPanel } from "@/components/vault/placement-matches-panel";
import { PatternInsightsPanel } from "@/components/vault/pattern-insights-panel";
import { SupervisorMatchesPanel } from "@/components/vault/supervisor-matches-panel";
import { GuidedRecsPanel } from "@/components/vault/guided-recs-panel";
import { TrackAnalysisHeader } from "@/components/vault/track-analysis-header";
import { StemsManager } from "@/components/vault/stems-manager";
import { LibrarySubmitDialog } from "@/components/library/submit-dialog";
import type { GuidedRecsOutput } from "@/lib/agents/guided-recs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Send } from "lucide-react";
import type { SyncScore } from "@/types/song";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = use(params);
  const { song, loading, refetch } = useSong(songId);
  const [submitOpen, setSubmitOpen] = useState(false);

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

  const metadata = Array.isArray(song.song_metadata)
    ? song.song_metadata[0]
    : song.song_metadata;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/vault">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">{song.title}</h2>
          <p className="text-sm text-[#A3A3A3] capitalize">{song.status}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSubmitOpen(true)}
          className="border-[#DC2626]/40 text-white hover:bg-[#DC2626]/10"
        >
          <Send className="size-3.5 mr-1.5" />
          Submit this song to Library
        </Button>
      </div>

      <TrackAnalysisHeader song={song} />

      <LibrarySubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        prefill={{
          song_title: song.title,
          genre: metadata?.genre ?? undefined,
          sub_genre: metadata?.sub_genre ?? undefined,
          moods: metadata?.moods ?? undefined,
          bpm: metadata?.bpm ?? undefined,
          key: metadata?.key ?? undefined,
          vocal_type: metadata?.vocal_gender ?? undefined,
        }}
      />

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
          <ArtifactGrid songId={song.id} />
        </div>
        <div className="space-y-6">
          <SyncReadinessMeter song={song} variant="full" />
          <BrandFitPanel
            songId={song.id}
            initialStatus={song.brand_fit_status ?? null}
            initialCheckedAt={song.brand_fit_checked_at ?? null}
          />
          <PlacementMatchesPanel song={song} />
          <SupervisorMatchesPanel song={song} />
          <PatternInsightsPanel song={song} />
          <GuidedRecsPanel
            songId={song.id}
            initial={(song as { guided_recs?: GuidedRecsOutput | null }).guided_recs ?? null}
            initialAt={(song as { guided_recs_at?: string | null }).guided_recs_at ?? null}
          />
          <PackageBuilderPanel
            songId={song.id}
            initialStatus={song.package_status ?? null}
            initialCheckedAt={song.package_checked_at ?? null}
          />
          <ContentSyncLoopPanel
            songId={song.id}
            packageStatus={song.package_status ?? null}
          />
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
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
            <TabsTrigger value="stems">Stems</TabsTrigger>
          </TabsList>
          <TabsContent value="metadata" className="mt-4">
            <MetadataForm song={song} />
          </TabsContent>
          <TabsContent value="score" className="mt-4 space-y-4">
            <SyncReadinessMeter song={song} variant="full" />
            <BrandFitPanel
              songId={song.id}
              initialStatus={song.brand_fit_status ?? null}
              initialCheckedAt={song.brand_fit_checked_at ?? null}
            />
            <PlacementMatchesPanel song={song} />
            <PatternInsightsPanel song={song} />
            <GuidedRecsPanel
              songId={song.id}
              initial={(song as { guided_recs?: GuidedRecsOutput | null }).guided_recs ?? null}
              initialAt={(song as { guided_recs_at?: string | null }).guided_recs_at ?? null}
            />
            <PackageBuilderPanel
              songId={song.id}
              initialStatus={song.package_status ?? null}
              initialCheckedAt={song.package_checked_at ?? null}
            />
            <ContentSyncLoopPanel
              songId={song.id}
              packageStatus={song.package_status ?? null}
            />
            <SyncScoreDisplay
              songId={song.id}
              score={latestScore}
              onScored={refetch}
            />
          </TabsContent>
          <TabsContent value="artifacts" className="mt-4">
            <ArtifactGrid songId={song.id} />
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
