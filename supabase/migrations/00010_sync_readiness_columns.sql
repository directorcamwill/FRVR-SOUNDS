-- Sync Readiness foundation columns
-- Additive only. Every new column is nullable or defaulted — zero breaking change.
-- Surfaces in <SyncReadinessMeter> + <SyncPackageChecklist>.
-- Note: instrumental_available already exists on song_metadata; not redefined.

-- song_metadata: sync-submission-specific fields
ALTER TABLE public.song_metadata
  ADD COLUMN IF NOT EXISTS scene_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dialogue_safe_score NUMERIC(4,3)
    CHECK (dialogue_safe_score IS NULL OR (dialogue_safe_score >= 0 AND dialogue_safe_score <= 1)),
  ADD COLUMN IF NOT EXISTS cutdown_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS loop_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tv_mix_available BOOLEAN DEFAULT FALSE;

-- deliverables: audio artifact subtyping, so specific files (master/TV mix/instrumental/cutdowns)
-- can be tracked against a song rather than only as category-count progress.
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS artifact_type TEXT
    CHECK (
      artifact_type IS NULL OR artifact_type IN (
        'streaming_master',
        'loud_master',
        'sync_dynamic_master',
        'broadcast_master',
        'instrumental',
        'acapella',
        'tv_mix',
        'stems_zip',
        'cutdown_60',
        'cutdown_30',
        'cutdown_15',
        'sting',
        'loop'
      )
    ),
  ADD COLUMN IF NOT EXISTS song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lufs_target NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS true_peak_target NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS qc_passed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_key TEXT;

CREATE INDEX IF NOT EXISTS idx_deliverables_song_id
  ON public.deliverables(song_id)
  WHERE song_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_artifact_type
  ON public.deliverables(artifact_type)
  WHERE artifact_type IS NOT NULL;
