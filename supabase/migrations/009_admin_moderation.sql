-- =============================================================
-- Migration 009: Admin Moderation & Audit Logs
-- Adds: admin_reports, audit_logs for compliance tracking
-- =============================================================

-- ── 0. Admin role columns (must be first!) ────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

-- ── 1. Admin Reports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  report_type       TEXT NOT NULL CHECK (report_type IN ('comment', 'share', 'page', 'database', 'transcript', 'user')),
  item_id           UUID NOT NULL,
  reason            TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'copyright', 'private_data', 'other')),
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes       TEXT,
  resolved_by_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_taken      TEXT CHECK (action_taken IN ('none', 'warning', 'content_removed', 'user_suspended', 'other')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

ALTER TABLE admin_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON admin_reports FOR SELECT
  USING (auth.uid() = reported_by_id);

CREATE POLICY "Users can insert reports"
  ON admin_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by_id);

CREATE POLICY "Admins can view all reports"
  ON admin_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update reports"
  ON admin_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete reports"
  ON admin_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_reports_status
  ON admin_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_reports_item_id
  ON admin_reports(item_id);

CREATE INDEX IF NOT EXISTS idx_admin_reports_user_id
  ON admin_reports(reported_by_id);

-- ── 2. Audit Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action            TEXT NOT NULL,
  entity_type       TEXT NOT NULL CHECK (entity_type IN ('user', 'transcript', 'page', 'database', 'comment', 'share', 'report', 'other')),
  entity_id         UUID,
  changes           JSONB,
  ip_address        INET,
  user_agent        TEXT,
  status            TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view and manage audit logs"
  ON audit_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id
  ON audit_logs(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action, created_at DESC);

-- Full-text search on audit logs for compliance
CREATE INDEX IF NOT EXISTS idx_audit_logs_fts
  ON audit_logs USING gin(to_tsvector('english', coalesce(action, '') || ' ' || coalesce(error_message, '')));
