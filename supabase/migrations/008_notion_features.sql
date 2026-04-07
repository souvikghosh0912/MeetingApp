-- =============================================================
-- Migration 008: Notion-like features
-- Adds: user_favorites, user_recently_visited, page_comments
-- Also adds cover + breadcrumb support (cover already in pages schema)
-- =============================================================

-- ── 1. User favourites ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('page', 'database', 'transcript')),
  item_id     UUID NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '📄',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON user_favorites
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id
  ON user_favorites (user_id, created_at DESC);

-- ── 2. Recently visited ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_recently_visited (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('page', 'database', 'transcript')),
  item_id     UUID NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '📄',
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE user_recently_visited ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recently_visited"
  ON user_recently_visited
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recently_visited_user_id
  ON user_recently_visited (user_id, visited_at DESC);

-- ── 3. Page comments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  parent_id   UUID REFERENCES page_comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE page_comments ENABLE ROW LEVEL SECURITY;

-- Authors can manage their own comments
CREATE POLICY "Users manage own comments"
  ON page_comments
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Page owners can read all comments on their pages
CREATE POLICY "Page owners can read comments"
  ON page_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = page_comments.page_id
        AND p.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_page_comments_page_id
  ON page_comments (page_id, created_at ASC);

CREATE TRIGGER update_page_comments_updated_at
  BEFORE UPDATE ON page_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Ensure pages.cover column exists ───────────────────────
-- (it was declared in 006_pages.sql but guarded here for safety)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS cover TEXT;
