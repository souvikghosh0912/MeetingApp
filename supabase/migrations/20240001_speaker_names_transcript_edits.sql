-- =============================================================
-- Migration: Speaker Naming + Transcript Editing support
-- =============================================================
-- Both features store data inside the existing `summary` JSONB
-- column, so no schema column changes are required.
--
-- However, to make querying speaker_names efficient and to
-- document the shape, we add a generated index on the JSONB key.
-- =============================================================

-- Optional: GIN index on summary for faster JSONB queries
-- (safe to apply on existing tables with no downtime on Postgres 14+)
CREATE INDEX IF NOT EXISTS idx_transcripts_summary_gin
  ON transcripts USING GIN (summary);

-- Verify the transcripts table has updated_at (should already exist).
-- If not, uncomment the line below:
-- ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- RLS policies are already in place (user_id check on every row).
-- No additional policies needed — PATCH API enforces user_id ownership.

-- =============================================================
-- Shape reference (not enforced by DB, enforced by app layer):
--
-- summary->>'speaker_names'  : jsonb object  { "Speaker 0": "Alice", "Speaker 1": "Bob" }
-- summary->'segments'        : jsonb array   [{ text, start, end, speaker? }]
--
-- When a user edits a segment, the app PATCHes:
--   summary.segments  (updated array)
--   transcript_text   (reconstructed plain text, space-joined)
--
-- When a user renames a speaker, the app PATCHes:
--   summary.speaker_names  (updated map)
-- =============================================================
