-- =============================================================
-- Migration: Flexible Database Layer (Notion-like)
-- =============================================================

-- ── 1. User-created databases ─────────────────────────────────
CREATE TABLE user_databases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Database',
  icon        TEXT NOT NULL DEFAULT '🗂️',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_databases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own databases" ON user_databases
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_databases_user_id ON user_databases(user_id);

CREATE TRIGGER update_user_databases_updated_at
  BEFORE UPDATE ON user_databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. Database properties (columns) ──────────────────────────
CREATE TABLE db_properties (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES user_databases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'text','number','select','multi_select',
                'date','checkbox','url','email','phone'
              )),
  config      JSONB NOT NULL DEFAULT '{}',
  -- config shape: { options: [{id,name,color}] }  (for select/multi_select)
  position    INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT false,  -- "Name" column, undeletable
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE db_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own db properties" ON db_properties
  USING (
    EXISTS (
      SELECT 1 FROM user_databases d
      WHERE d.id = db_properties.database_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_databases d
      WHERE d.id = db_properties.database_id AND d.user_id = auth.uid()
    )
  );

CREATE INDEX idx_db_properties_database_id ON db_properties(database_id);

-- ── 3. Database records (rows) ────────────────────────────────
CREATE TABLE db_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES user_databases(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  -- data shape: { [property_id]: value }
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE db_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own db records" ON db_records
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_db_records_database_id ON db_records(database_id);
CREATE INDEX idx_db_records_user_id     ON db_records(user_id);
CREATE INDEX idx_db_records_data_gin    ON db_records USING GIN(data);

CREATE TRIGGER update_db_records_updated_at
  BEFORE UPDATE ON db_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Database views ─────────────────────────────────────────
CREATE TABLE db_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES user_databases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('table', 'kanban', 'calendar')),
  config      JSONB NOT NULL DEFAULT '{}',
  -- config shape: { groupBy?: prop_id, sortBy?: [{propertyId,direction}],
  --                 filters?: [{propertyId,operator,value}],
  --                 hiddenProperties?: [prop_id] }
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE db_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own db views" ON db_views
  USING (
    EXISTS (
      SELECT 1 FROM user_databases d
      WHERE d.id = db_views.database_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_databases d
      WHERE d.id = db_views.database_id AND d.user_id = auth.uid()
    )
  );

CREATE INDEX idx_db_views_database_id ON db_views(database_id);
