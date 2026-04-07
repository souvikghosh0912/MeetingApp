-- =============================================================
-- Migration: Pages (Block-based rich-text editor)
-- =============================================================

CREATE TABLE pages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  icon       TEXT NOT NULL DEFAULT '📄',
  cover      TEXT,                             -- URL for cover image (future)
  content    JSONB NOT NULL DEFAULT '[]',      -- BlockNote JSON block array
  parent_id  UUID REFERENCES pages(id) ON DELETE SET NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pages" ON pages
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pages_user_id    ON pages(user_id);
CREATE INDEX idx_pages_parent_id  ON pages(parent_id);

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
