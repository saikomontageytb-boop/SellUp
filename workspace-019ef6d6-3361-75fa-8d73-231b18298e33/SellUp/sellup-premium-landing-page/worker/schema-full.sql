-- Full schema v4 (multi-shops per user)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  plan_renewed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE shops (
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
  social_instagram TEXT
);
CREATE INDEX idx_shops_user ON shops(user_id);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  image_url TEXT,
  delivery_type TEXT NOT NULL,
  delivery_payload TEXT,
  stock INTEGER DEFAULT -1,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  category_id TEXT,
  featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  images TEXT,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 10
);
CREATE INDEX idx_products_shop ON products(shop_id);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  delivery_payload TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TABLE product_serials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  serial TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  used_at INTEGER,
  variant_id TEXT
);
CREATE INDEX idx_serials_product ON product_serials(product_id, used);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  delivery_content TEXT,
  created_at INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  coupon_code TEXT,
  discount_cents INTEGER DEFAULT 0,
  variant_id TEXT,
  cart_data TEXT,
  affiliate_code TEXT
);
CREATE INDEX idx_orders_shop ON orders(shop_id);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  order_id TEXT,
  buyer_email TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at INTEGER NOT NULL,
  reply TEXT,
  reply_at INTEGER
);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_shop ON reviews(shop_id);

CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_percent INTEGER,
  discount_cents INTEGER,
  max_uses INTEGER DEFAULT -1,
  uses INTEGER DEFAULT 0,
  expires_at INTEGER,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(shop_id, code)
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT,
  shop_id TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(email, shop_id)
);

CREATE TABLE wishlists (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(customer_email, product_id)
);

CREATE TABLE stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  email TEXT NOT NULL,
  notified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(product_id, email)
);

CREATE TABLE custom_pages (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  show_in_footer INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(shop_id, slug)
);

CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  published INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(shop_id, slug)
);

CREATE TABLE affiliates (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  commission_percent INTEGER DEFAULT 10,
  clicks INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  earnings_cents INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(shop_id, code)
);

CREATE TABLE newsletter (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(shop_id, email)
);

CREATE TABLE shop_balances (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  method TEXT NOT NULL,
  currency TEXT DEFAULT 'EUR',
  available_cents INTEGER DEFAULT 0,
  pending_cents INTEGER DEFAULT 0,
  total_earned_cents INTEGER DEFAULT 0,
  updated_at INTEGER,
  UNIQUE(shop_id, method, currency)
);
CREATE INDEX idx_balances_shop ON shop_balances(shop_id);

CREATE TABLE withdrawals (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  method TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  destination TEXT,
  status TEXT NOT NULL,
  fee_cents INTEGER DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);
CREATE INDEX idx_withdrawals_shop ON withdrawals(shop_id, created_at);

CREATE TABLE live_viewers (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  page TEXT,
  UNIQUE(shop_id, session_id)
);
CREATE INDEX idx_viewers_shop_seen ON live_viewers(shop_id, last_seen);
