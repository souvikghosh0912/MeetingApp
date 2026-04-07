-- Migration to add GPT-OSS model support to usage tracking and transcripts
-- Run this in your Supabase SQL Editor

-- 1. Update Transcripts table check constraint
ALTER TABLE transcripts DROP CONSTRAINT transcripts_model_used_check;
ALTER TABLE transcripts ADD CONSTRAINT transcripts_model_used_check 
  CHECK (model_used IN ('llama-8b', 'llama-70b', 'gpt-oss-20b', 'gpt-oss-120b'));

-- 2. Add new columns to usage_tracking
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS summaries_20b_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS summaries_120b_count INTEGER NOT NULL DEFAULT 0;

-- 3. (Optional) Migrate old 70b data to 120b if desired
-- UPDATE usage_tracking SET summaries_120b_count = summaries_70b_count;
