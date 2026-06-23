-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS app_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow all operations from the frontend (no login required)
ALTER TABLE app_store DISABLE ROW LEVEL SECURITY;
