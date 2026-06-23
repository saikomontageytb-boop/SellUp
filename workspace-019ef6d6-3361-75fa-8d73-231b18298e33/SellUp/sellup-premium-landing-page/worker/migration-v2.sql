-- Migration v2: Add reviews, coupons, categories, analytics, etc.

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  order_id TEXT,
  buyer_email TEXT NOT NULL,
  rating INTEGER NOT NULL,  -- 1..5
  comment TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_percent INTEGER,    -- 0..100
  discount_cents INTEGER,      -- fixed amount in cents
  max_uses INTEGER DEFAULT -1, -- -1 = unlimited
  uses INTEGER DEFAULT 0,
  expires_at INTEGER,          -- nullable
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, code)
);
CREATE INDEX IF NOT EXISTS idx_coupons_shop_code ON coupons(shop_id, code);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Add columns to existing tables
ALTER TABLE products ADD COLUMN category_id TEXT;
ALTER TABLE products ADD COLUMN featured INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN images TEXT;  -- JSON array of URLs (gallery)
ALTER TABLE products ADD COLUMN min_quantity INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN max_quantity INTEGER DEFAULT 10;

ALTER TABLE shops ADD COLUMN maintenance INTEGER DEFAULT 0;
ALTER TABLE shops ADD COLUMN discord_webhook TEXT;
ALTER TABLE shops ADD COLUMN announcement TEXT;  -- top banner message

ALTER TABLE orders ADD COLUMN quantity INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN coupon_code TEXT;
ALTER TABLE orders ADD COLUMN discount_cents INTEGER DEFAULT 0;
