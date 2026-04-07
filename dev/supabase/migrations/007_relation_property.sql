-- =============================================================
-- Migration: Add 'relation' property type to db_properties
-- =============================================================

-- Drop the old check constraint and re-create it with 'relation' included
ALTER TABLE db_properties DROP CONSTRAINT IF EXISTS db_properties_type_check;

ALTER TABLE db_properties
  ADD CONSTRAINT db_properties_type_check
  CHECK (type IN (
    'text', 'number', 'select', 'multi_select',
    'date', 'checkbox', 'url', 'email', 'phone', 'relation'
  ));

-- config for relation properties:
-- { targetDatabaseId: UUID, targetDatabaseName: string }
-- Values stored in db_records.data as string[] (array of record IDs)
