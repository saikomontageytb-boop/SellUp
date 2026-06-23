-- Migration v3: variants, categories full, cart, customer accounts, vouches, blog, custom pages, affiliate, theme

-- ============ THEME / DESIGN ============
ALTER TABLE shops ADD COLUMN theme_preset TEXT DEFAULT 'default';  -- default, neon, minimal, gaming, luxury
ALTER TABLE shops ADD COLUMN secondary_color TEXT DEFAULT '#6366F1';
ALTER TABLE shops ADD COLUMN accent_color TEXT DEFAULT '#F59E0B';
ALTER TABLE shops ADD COLUMN background_pattern TEXT DEFAULT 'glow';  -- glow, grid, dots, none, custom
ALTER TABLE shops ADD COLUMN background_color TEXT DEFAULT '#08080C';
ALTER TABLE shops ADD COLUMN font_family TEXT DEFAULT 'Inter';
ALTER TABLE shops ADD COLUMN border_radius TEXT DEFAULT 'lg';  -- none, sm, md, lg, xl, full
ALTER TABLE shops ADD COLUMN product_layout TEXT DEFAULT 'grid3';  -- grid2, grid3, grid4, list
ALTER TABLE shops ADD COLUMN hero_enabled INTEGER DEFAULT 1;
ALTER TABLE shops ADD COLUMN hero_title TEXT;
ALTER TABLE shops ADD COLUMN hero_subtitle TEXT;
ALTER TABLE shops ADD COLUMN hero_cta_text TEXT;
ALTER TABLE shops ADD COLUMN hero_image TEXT;
ALTER TABLE shops ADD COLUMN custom_css TEXT;
ALTER TABLE shops ADD COLUMN footer_text TEXT;
ALTER TABLE shops ADD COLUMN show_stats INTEGER DEFAULT 1;
ALTER TABLE shops ADD COLUMN social_twitter TEXT;
ALTER TABLE shops ADD COLUMN social_discord TEXT;
ALTER TABLE shops ADD COLUMN social_telegram TEXT;
ALTER TABLE shops ADD COLUMN social_instagram TEXT;

-- ============ VARIANTS ============
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,           -- "1 mois", "Premium", etc.
  price_cents INTEGER NOT NULL,
  delivery_payload TEXT,        -- override product payload if set
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- product_serials can now be linked to a variant
ALTER TABLE product_serials ADD COLUMN variant_id TEXT;

-- orders can reference a variant
ALTER TABLE orders ADD COLUMN variant_id TEXT;
ALTER TABLE orders ADD COLUMN cart_data TEXT;  -- JSON for multi-item carts
ALTER TABLE orders ADD COLUMN affiliate_code TEXT;

-- ============ COLLECTIONS / CATEGORIES (already created in v2, extending) ============
ALTER TABLE categories ADD COLUMN slug TEXT;
ALTER TABLE categories ADD COLUMN description TEXT;
ALTER TABLE categories ADD COLUMN image_url TEXT;

-- ============ CUSTOMER ACCOUNTS ============
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT,           -- nullable, magic-link style possible
  shop_id TEXT,                 -- nullable for global accounts
  created_at INTEGER NOT NULL,
  UNIQUE(email, shop_id)
);

-- ============ WISHLIST ============
CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,  -- identify by email (anonymous-friendly)
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(customer_email, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON wishlists(customer_email, shop_id);

-- ============ STOCK ALERTS ============
CREATE TABLE IF NOT EXISTS stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  email TEXT NOT NULL,
  notified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(product_id, email)
);

-- ============ CUSTOM PAGES (TOS, refund policy, etc.) ============
CREATE TABLE IF NOT EXISTS custom_pages (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  slug TEXT NOT NULL,           -- "tos", "refund", "contact"
  title TEXT NOT NULL,
  content TEXT,                 -- markdown/html
  sort_order INTEGER DEFAULT 0,
  show_in_footer INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, slug)
);

-- ============ BLOG / ANNOUNCEMENTS ============
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  published INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, slug)
);

-- ============ AFFILIATES ============
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  commission_percent INTEGER DEFAULT 10,
  clicks INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  earnings_cents INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, code)
);

-- ============ FEEDBACK REPLIES (vendor can reply to reviews) ============
ALTER TABLE reviews ADD COLUMN reply TEXT;
ALTER TABLE reviews ADD COLUMN reply_at INTEGER;

-- ============ NEWSLETTER SUBSCRIBERS ============
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, email)
);
