-- ============================================================
-- AUTOMATION RESULTS
-- Stores real persisted outputs from output_save nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_results (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workflow_id  TEXT NOT NULL,
  storage_key  TEXT NOT NULL,
  value        TEXT NOT NULL,
  format       TEXT NOT NULL DEFAULT 'string' CHECK (format IN ('string', 'json')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workflow_id, storage_key)
);

ALTER TABLE automation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own automation results"
  ON automation_results FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_automation_results_user ON automation_results(user_id);
CREATE INDEX idx_automation_results_key  ON automation_results(user_id, storage_key);

CREATE TRIGGER update_automation_results_updated_at
  BEFORE UPDATE ON automation_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- OAUTH TOKENS
-- Stores encrypted Google OAuth access/refresh tokens per user
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('google')),
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  scope         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own oauth tokens"
  ON oauth_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SCHEDULED WORKFLOWS
-- Tracks which workflows have active schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workflow_id     TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  run_count       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workflow_id)
);

ALTER TABLE scheduled_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled workflows"
  ON scheduled_workflows FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scheduled_workflows_active ON scheduled_workflows(is_active, next_run_at);

CREATE TRIGGER update_scheduled_workflows_updated_at
  BEFORE UPDATE ON scheduled_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- WEBHOOK RUNS
-- Logs each incoming webhook trigger hit
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_runs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  payload     JSONB,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  error       TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

ALTER TABLE webhook_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook runs"
  ON webhook_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_webhook_runs_workflow ON webhook_runs(workflow_id, started_at DESC);
