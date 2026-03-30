-- Add share_token column to transcripts for public sharing
ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Index for fast lookup by token (public share page)
CREATE INDEX IF NOT EXISTS idx_transcripts_share_token
  ON transcripts (share_token)
  WHERE share_token IS NOT NULL;

-- Allow anonymous (unauthenticated) SELECT by share_token
-- This policy sits alongside the existing user-scoped policies
CREATE POLICY "Public read by share_token"
  ON transcripts
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);
