-- SellUp D1 schema
-- Run with: wrangler d1 execute sellup-db --file=worker/schema.sql

-- Users (sellers and buyers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Each seller has one shop
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,         -- URL: /s/:slug
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#7C3AED',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Digital products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,      -- in cents
  currency TEXT DEFAULT 'EUR',
  image_url TEXT,
  delivery_type TEXT NOT NULL,       -- 'file' | 'serials' | 'text' | 'discord'
  delivery_payload TEXT,             -- file R2 key OR static text OR discord invite
  stock INTEGER DEFAULT -1,          -- -1 = unlimited
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Serial keys stock (for delivery_type='serials')
CREATE TABLE IF NOT EXISTS product_serials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  serial TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  used_at INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'pending' | 'paid' | 'delivered' | 'refunded'
  delivery_content TEXT,             -- the actual delivered value (serial, link, etc.)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_serials_product ON product_serials(product_id, used);
