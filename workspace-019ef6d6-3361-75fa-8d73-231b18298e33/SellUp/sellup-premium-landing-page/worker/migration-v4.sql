-- Migration v4: multi-shops, plans, balance & withdrawals, live viewers

-- ============ USER PLAN ============
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';  -- free, pro
ALTER TABLE users ADD COLUMN plan_renewed_at INTEGER;

-- ============ BALANCE PER PAYMENT METHOD ============
-- Each shop has a balance per gateway (in cents). Manually credited on each delivered order
-- (in production this would be hooked into real payment webhooks).
CREATE TABLE IF NOT EXISTS shop_balances (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  method TEXT NOT NULL,         -- 'stripe' | 'paypal' | 'crypto'
  currency TEXT DEFAULT 'EUR',
  available_cents INTEGER DEFAULT 0,  -- ready to withdraw
  pending_cents INTEGER DEFAULT 0,    -- in clearing
  total_earned_cents INTEGER DEFAULT 0,
  updated_at INTEGER,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, method, currency)
);
CREATE INDEX IF NOT EXISTS idx_balances_shop ON shop_balances(shop_id);

-- ============ WITHDRAWALS ============
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  method TEXT NOT NULL,           -- 'stripe' | 'paypal' | 'crypto'
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  destination TEXT,               -- IBAN, paypal email, wallet address
  status TEXT NOT NULL,           -- 'pending' | 'processing' | 'completed' | 'rejected'
  fee_cents INTEGER DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_shop ON withdrawals(shop_id, created_at);

-- ============ LIVE VIEWERS (ephemeral heartbeats) ============
-- Each visitor sends a heartbeat every 15s. We count rows < 30s old per shop.
CREATE TABLE IF NOT EXISTS live_viewers (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  page TEXT,                      -- 'shop' | 'product:xxx' | 'checkout'
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_viewers_shop_seen ON live_viewers(shop_id, last_seen);
