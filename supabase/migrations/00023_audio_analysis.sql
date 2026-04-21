-- 00023_audio_analysis.sql
-- Stage 1 audio analysis — stores detected BPM, key, loudness, duration,
-- and a downsampled waveform for every audio file. Populated by a future
-- FFmpeg / ML pipeline (not wired yet). Idempotent.

CREATE TABLE IF NOT EXISTS audio_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES library_deals(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES library_submissions(id) ON DELETE CASCADE,
  -- At least one of the two above must be set (enforced in application layer for now)
  file_path TEXT NOT NULL,

  -- Detected musical characteristics
  detected_bpm NUMERIC,
  detected_bpm_confidence NUMERIC,
  detected_key TEXT,
  detected_key_confidence NUMERIC,

  -- Technical loudness + dynamics (EBU R128 / streaming standards)
  duration_sec NUMERIC,
  lufs_integrated NUMERIC,
  lufs_short_term_max NUMERIC,
  true_peak_db NUMERIC,
  dynamic_range NUMERIC,

  -- Visual waveform — array of peak values (0..1), downsampled
  waveform_peaks JSONB,

  -- Structural markers — downbeats, phrase changes, hits (for cutdowns)
  markers JSONB,

  -- Provenance
  analyzer_version TEXT NOT NULL DEFAULT 'pending',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_analysis_deal ON audio_analysis(deal_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_submission ON audio_analysis(submission_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_file_path ON audio_analysis(file_path);

ALTER TABLE audio_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_audio_analysis" ON audio_analysis;
CREATE POLICY "auth_read_audio_analysis" ON audio_analysis
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_write_audio_analysis" ON audio_analysis;
CREATE POLICY "auth_write_audio_analysis" ON audio_analysis
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public (anon) read for catalog waveform display — deal-scoped rows only.
DROP POLICY IF EXISTS "anon_read_audio_analysis_for_active_deals" ON audio_analysis;
CREATE POLICY "anon_read_audio_analysis_for_active_deals" ON audio_analysis
  FOR SELECT
  TO anon
  USING (deal_id IS NOT NULL);

COMMENT ON TABLE audio_analysis IS 'Stage 1 detected audio features — BPM, key, loudness, waveform peaks. Populated by pipeline (not yet wired).';
