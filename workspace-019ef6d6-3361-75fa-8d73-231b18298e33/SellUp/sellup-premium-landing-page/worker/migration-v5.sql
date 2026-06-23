-- Migration v5: AI usage tracking + insights cache

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id, date);

CREATE TABLE IF NOT EXISTS ai_insights_cache (
  shop_id TEXT PRIMARY KEY,
  insights TEXT NOT NULL,        -- JSON array
  generated_at INTEGER NOT NULL
);
