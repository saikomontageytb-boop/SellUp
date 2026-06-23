-- Drop UNIQUE constraint on shops.user_id (rebuild table)
PRAGMA defer_foreign_keys = ON;

CREATE TABLE shops_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#7C3AED',
  created_at INTEGER NOT NULL,
  maintenance INTEGER DEFAULT 0,
  discord_webhook TEXT,
  announcement TEXT,
  theme_preset TEXT DEFAULT 'default',
  secondary_color TEXT DEFAULT '#6366F1',
  accent_color TEXT DEFAULT '#F59E0B',
  background_pattern TEXT DEFAULT 'glow',
  background_color TEXT DEFAULT '#08080C',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT 'lg',
  product_layout TEXT DEFAULT 'grid3',
  hero_enabled INTEGER DEFAULT 1,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_text TEXT,
  hero_image TEXT,
  custom_css TEXT,
  footer_text TEXT,
  show_stats INTEGER DEFAULT 1,
  social_twitter TEXT,
  social_discord TEXT,
  social_telegram TEXT,
  social_instagram TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO shops_new SELECT
  id,user_id,slug,name,description,logo_url,banner_url,theme_color,created_at,
  maintenance,discord_webhook,announcement,theme_preset,secondary_color,accent_color,
  background_pattern,background_color,font_family,border_radius,product_layout,
  hero_enabled,hero_title,hero_subtitle,hero_cta_text,hero_image,custom_css,
  footer_text,show_stats,social_twitter,social_discord,social_telegram,social_instagram
FROM shops;

DROP TABLE shops;
ALTER TABLE shops_new RENAME TO shops;

CREATE INDEX idx_shops_user ON shops(user_id);
