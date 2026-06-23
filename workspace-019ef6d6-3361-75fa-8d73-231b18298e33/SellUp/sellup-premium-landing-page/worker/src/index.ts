/**
 * SellUp API — Cloudflare Worker v3 (full SellAuth-like features)
 */

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;
  AI: any;  // Cloudflare Workers AI binding
  JWT_SECRET: string;
}

// ============ AI HELPERS ============

const AI_QUOTAS: Record<string, number> = { free: 20, pro: 200 };
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function checkAndIncrementQuota(env: Env, userId: string, plan: string): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = AI_QUOTAS[plan] || AI_QUOTAS.free;
  const date = todayKey();
  const row = await env.DB.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').bind(userId, date).first() as any;
  const used = row?.count || 0;
  if (used >= limit) return { ok: false, used, limit };
  if (row) {
    await env.DB.prepare('UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND date = ?').bind(userId, date).run();
  } else {
    await env.DB.prepare('INSERT INTO ai_usage (id,user_id,date,count) VALUES (?,?,?,?)').bind(uid(), userId, date, 1).run();
  }
  return { ok: true, used: used + 1, limit };
}

async function getQuota(env: Env, userId: string, plan: string): Promise<{ used: number; limit: number }> {
  const limit = AI_QUOTAS[plan] || AI_QUOTAS.free;
  const row = await env.DB.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').bind(userId, todayKey()).first() as any;
  return { used: row?.count || 0, limit };
}

// Gather shop context for the AI (compact, structured)
async function buildShopContext(env: Env, shopId: string): Promise<string> {
  const now30d = Date.now() - 30 * 86400 * 1000;
  const now7d = Date.now() - 7 * 86400 * 1000;

  const shop = await env.DB.prepare('SELECT name,slug,created_at FROM shops WHERE id = ?').bind(shopId).first() as any;

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered'`
  ).bind(shopId).first() as any;

  const last7 = await env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered' AND created_at >= ?`
  ).bind(shopId, now7d).first() as any;

  const last30 = await env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered' AND created_at >= ?`
  ).bind(shopId, now30d).first() as any;

  const products = await env.DB.prepare(
    `SELECT p.name, p.price_cents, p.view_count, p.featured, p.active,
            (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id AND o.status = 'delivered' AND o.created_at >= ?) as sales_30d,
            (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND used = 0) as stock_left,
            (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
     FROM products p WHERE p.shop_id = ? ORDER BY p.created_at DESC LIMIT 20`
  ).bind(now30d, shopId).all();

  const recentReviews = await env.DB.prepare(
    `SELECT r.rating, r.comment, p.name as product_name FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.shop_id = ? ORDER BY r.created_at DESC LIMIT 10`
  ).bind(shopId).all();

  const coupons = await env.DB.prepare(
    `SELECT code, discount_percent, discount_cents, uses, active FROM coupons WHERE shop_id = ?`
  ).bind(shopId).all();

  const lines = [
    `Boutique: "${shop?.name}" (créée ${Math.floor((Date.now() - (shop?.created_at || Date.now())) / 86400000)} jours)`,
    `Ventes totales: ${totals.count} commandes, ${(totals.revenue / 100).toFixed(2)}€`,
    `7 derniers jours: ${last7.count} ventes, ${(last7.revenue / 100).toFixed(2)}€`,
    `30 derniers jours: ${last30.count} ventes, ${(last30.revenue / 100).toFixed(2)}€`,
    '',
    'PRODUITS:',
    ...(products.results as any[]).map(p =>
      `- "${p.name}" | ${(p.price_cents / 100).toFixed(2)}€ | ventes 30j: ${p.sales_30d} | vues: ${p.view_count || 0} | stock: ${p.stock_left ?? 'illimité'} | note: ${p.avg_rating ? Number(p.avg_rating).toFixed(1) : 'aucune'}${p.review_count ? ` (${p.review_count} avis)` : ''}${p.featured ? ' | ⭐VEDETTE' : ''}${!p.active ? ' | INACTIF' : ''}`
    ),
  ];

  if ((recentReviews.results as any[]).length) {
    lines.push('', 'AVIS RÉCENTS:');
    for (const r of recentReviews.results as any[]) {
      lines.push(`- ${r.rating}⭐ sur "${r.product_name}": ${r.comment ? r.comment.slice(0, 100) : '(sans commentaire)'}`);
    }
  }

  if ((coupons.results as any[]).length) {
    lines.push('', 'CODES PROMO:');
    for (const c of coupons.results as any[]) {
      const v = c.discount_percent ? `-${c.discount_percent}%` : `-${(c.discount_cents / 100).toFixed(2)}€`;
      lines.push(`- ${c.code}: ${v} | ${c.uses} util. | ${c.active ? 'actif' : 'inactif'}`);
    }
  }

  return lines.join('\n');
}

const json = (data: unknown, status = 200, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,authorization',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      ...extra,
    },
  });

const uid = () => crypto.randomUUID();
const now = () => Date.now();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';

async function hashPassword(password: string, salt?: string): Promise<string> {
  const enc = new TextEncoder();
  const useSalt = salt ?? crypto.randomUUID();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(useSalt), iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `${useSalt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split(':');
  const check = await hashPassword(password, salt);
  return check === stored;
}

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

async function signJWT(payload: object, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sig = Uint8Array.from(b64urlDecode(s), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
    if (!ok) return null;
    const payload = JSON.parse(b64urlDecode(p));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

async function authUser(req: Request, env: Env): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyJWT(auth.slice(7), env.JWT_SECRET);
}

// Resolve the active shop for an authenticated seller.
// Priority: X-Shop-Id header → first shop owned by user.
async function resolveShop(req: Request, env: Env, userId: string): Promise<any | null> {
  const wantedId = req.headers.get('x-shop-id');
  if (wantedId) {
    const s = await env.DB.prepare('SELECT * FROM shops WHERE id = ? AND user_id = ?').bind(wantedId, userId).first();
    if (s) return s;
  }
  return await env.DB.prepare('SELECT * FROM shops WHERE user_id = ? ORDER BY created_at LIMIT 1').bind(userId).first();
}

const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 5 };

async function getUserPlan(env: Env, userId: string): Promise<string> {
  const u = await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(userId).first() as any;
  return u?.plan || 'free';
}

// Credit shop balance after a delivered order (split across methods is mocked here)
async function creditBalance(env: Env, shopId: string, amountCents: number, currency: string, method: string = 'stripe') {
  // Try update first, fallback insert
  const r = await env.DB.prepare(
    `UPDATE shop_balances SET available_cents = available_cents + ?, total_earned_cents = total_earned_cents + ?, updated_at = ? WHERE shop_id = ? AND method = ? AND currency = ?`
  ).bind(amountCents, amountCents, now(), shopId, method, currency).run();
  if ((r.meta as any)?.changes === 0) {
    await env.DB.prepare(
      `INSERT INTO shop_balances (id,shop_id,method,currency,available_cents,total_earned_cents,updated_at) VALUES (?,?,?,?,?,?,?)`
    ).bind(uid(), shopId, method, currency, amountCents, amountCents, now()).run();
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

async function notifyDiscord(webhook: string, content: object) {
  try {
    await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(content) });
  } catch {}
}

// ============ MAIN ============

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') return json({}, 204);
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // ============ AUTH (sellers) ============
      if (path === '/api/auth/register' && req.method === 'POST') {
        const { email, password } = await req.json() as any;
        if (!email || !password || password.length < 6)
          return json({ error: 'Email et mot de passe (6+ chars) requis' }, 400);

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) return json({ error: 'Email déjà utilisé' }, 409);

        const userId = uid();
        const shopId = uid();
        const hash = await hashPassword(password);
        const baseSlug = slugify(email.split('@')[0]);
        let slug = baseSlug; let i = 0;
        while (await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(slug).first()) {
          slug = `${baseSlug}-${++i}`;
        }

        await env.DB.batch([
          env.DB.prepare('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)')
            .bind(userId, email, hash, now()),
          env.DB.prepare('INSERT INTO shops (id,user_id,slug,name,created_at) VALUES (?,?,?,?,?)')
            .bind(shopId, userId, slug, `Boutique de ${email.split('@')[0]}`, now()),
        ]);

        const token = await signJWT(
          { id: userId, email, kind: 'seller', exp: Math.floor(Date.now() / 1000) + 7 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, user: { id: userId, email }, shop: { id: shopId, slug } });
      }

      if (path === '/api/auth/login' && req.method === 'POST') {
        const { email, password } = await req.json() as any;
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any;
        if (!user || !await verifyPassword(password, user.password_hash))
          return json({ error: 'Identifiants invalides' }, 401);
        const shops = await env.DB.prepare('SELECT id,slug,name,logo_url FROM shops WHERE user_id = ? ORDER BY created_at').bind(user.id).all();
        const shop = (shops.results as any[])[0] || null;
        const token = await signJWT(
          { id: user.id, email: user.email, kind: 'seller', exp: Math.floor(Date.now() / 1000) + 7 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, user: { id: user.id, email: user.email, plan: user.plan || 'free' }, shop, shops: shops.results });
      }

      // ============ CUSTOMER AUTH ============
      if (path === '/api/customer/login' && req.method === 'POST') {
        const { email, shop_slug } = await req.json() as any;
        if (!email) return json({ error: 'Email requis' }, 400);
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);
        // Magic-link style: just check if customer has orders
        const hasOrders = await env.DB.prepare('SELECT id FROM orders WHERE shop_id = ? AND buyer_email = ? LIMIT 1').bind(shop.id, email).first();
        if (!hasOrders) return json({ error: 'Aucune commande trouvée avec cet email' }, 404);
        const token = await signJWT(
          { email, shop_id: shop.id, kind: 'customer', exp: Math.floor(Date.now() / 1000) + 30 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, email });
      }

      if (path === '/api/customer/orders' && req.method === 'GET') {
        const payload = await authUser(req, env) as any;
        if (!payload || payload.kind !== 'customer') return json({ error: 'Non authentifié' }, 401);
        const rows = await env.DB.prepare(
          `SELECT o.*, p.name as product_name, p.image_url, s.slug as shop_slug, s.name as shop_name
           FROM orders o JOIN products p ON p.id = o.product_id JOIN shops s ON s.id = o.shop_id
           WHERE o.buyer_email = ? AND o.shop_id = ? ORDER BY o.created_at DESC`
        ).bind(payload.email, payload.shop_id).all();
        return json({ orders: rows.results });
      }

      // ============ DEMO SEED ============
      if (path === '/api/demo/seed' && req.method === 'POST') {
        const ts = Date.now();
        const userId = uid(), shopId = uid();
        const email = `demo-${ts}@sellup.app`;
        const password = 'demo-' + Math.random().toString(36).slice(2, 10);
        const hash = await hashPassword(password);
        const slug = 'demo-' + Math.random().toString(36).slice(2, 8);

        await env.DB.batch([
          env.DB.prepare('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)')
            .bind(userId, email, hash, ts),
          env.DB.prepare(`INSERT INTO shops (id,user_id,slug,name,description,theme_preset,theme_color,secondary_color,accent_color,announcement,hero_title,hero_subtitle,hero_cta_text,footer_text,social_discord,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
            .bind(shopId, userId, slug, '🎮 GamerKeys Store',
              'La référence des clés Steam, Epic et accès Discord premium. Livraison instantanée 24/7.',
              'gaming', '#7C3AED', '#EC4899', '#F59E0B',
              '🔥 Soldes du week-end : -20% avec le code WEEKEND20',
              'Vos jeux préférés, instantanément.',
              'Plus de 1000 produits digitaux livrés en quelques secondes après paiement.',
              'Découvrir les produits',
              '© 2026 GamerKeys Store. Tous droits réservés.',
              'https://discord.gg/example',
              ts),
        ]);

        // Categories
        const catGames = uid(), catSub = uid(), catEbook = uid();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO categories (id,shop_id,name,slug,description,sort_order) VALUES (?,?,?,?,?,?)')
            .bind(catGames, shopId, '🎮 Jeux vidéo', 'jeux', 'Clés Steam, Epic, Xbox, PlayStation', 1),
          env.DB.prepare('INSERT INTO categories (id,shop_id,name,slug,description,sort_order) VALUES (?,?,?,?,?,?)')
            .bind(catSub, shopId, '💎 Abonnements', 'abonnements', 'Discord Nitro, Spotify, Netflix', 2),
          env.DB.prepare('INSERT INTO categories (id,shop_id,name,slug,description,sort_order) VALUES (?,?,?,?,?,?)')
            .bind(catEbook, shopId, '📚 Ebooks & Formations', 'ebooks', 'Guides PDF et formations vidéo', 3),
        ]);

        const sample = [
          { name: '🎮 Cyberpunk 2077 - Clé Steam', desc: 'Édition complète + tous les DLC. Activation instantanée sur Steam.', price: 1999, type: 'serials', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', featured: 1, cat: catGames },
          { name: '🎮 GTA V Premium Edition - Steam', desc: 'Le titre légendaire avec accès complet à GTA Online.', price: 2499, type: 'serials', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800', featured: 1, cat: catGames },
          { name: '💎 Discord Nitro', desc: 'Code officiel Discord Nitro. Streaming HD, emojis, boost serveur.', price: 899, type: 'serials', img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800', featured: 1, cat: catSub },
          { name: '🎵 Spotify Premium', desc: 'Code Spotify Premium, valable monde entier.', price: 1299, type: 'serials', img: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=800', cat: catSub },
          { name: '🎨 Pack Photoshop Brushes Pro', desc: '500+ brushes professionnels. Téléchargement immédiat.', price: 1500, type: 'text', img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800', payload: 'https://example.com/download/photoshop-brushes.zip', cat: catEbook },
          { name: '🚀 Accès Discord VIP Trading', desc: 'Communauté privée trading crypto. Signaux, formations, mentorat.', price: 4999, type: 'discord', img: 'https://images.unsplash.com/photo-1622320229302-a8e76e7a8bd0?w=800', payload: 'https://discord.gg/example-vip', cat: catSub },
          { name: '📚 Ebook Dropshipping Masterclass', desc: 'Guide complet 200 pages + bonus vidéos. PDF instantané.', price: 2499, type: 'text', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', payload: 'https://example.com/download/ebook-dropship.pdf', cat: catEbook },
        ];

        const serialBank = ['CYBE-2077-AAAA', 'GTA5-PREM-BBBB', 'DISC-NITR-CCCC', 'SPOT-PREM-DDDD'];
        const stmts: any[] = [];
        const productIds: any[] = [];
        for (const p of sample) {
          const pid = uid();
          productIds.push({ id: pid, type: p.type });
          stmts.push(env.DB.prepare(
            `INSERT INTO products (id,shop_id,name,description,price_cents,currency,image_url,delivery_type,delivery_payload,stock,active,featured,category_id,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(pid, shopId, p.name, p.desc, p.price, 'EUR', p.img, p.type, (p as any).payload || null, -1, 1, p.featured || 0, p.cat, ts));
        }
        await env.DB.batch(stmts);

        // Add variants for Discord Nitro
        const nitroProduct = productIds[2];
        const variants = [
          { name: '1 mois', price: 899 },
          { name: '3 mois (-15%)', price: 2295 },
          { name: '1 an (-30%)', price: 7548 },
        ];
        await env.DB.batch(variants.map((v, i) =>
          env.DB.prepare('INSERT INTO product_variants (id,product_id,name,price_cents,sort_order) VALUES (?,?,?,?,?)')
            .bind(uid(), nitroProduct.id, v.name, v.price, i)
        ));

        // Add serials
        const serialStmts: any[] = [];
        let bankIdx = 0;
        for (const p of productIds) {
          if (p.type === 'serials') {
            for (let k = 0; k < 5; k++) {
              const ser = serialBank[bankIdx % serialBank.length] + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
              serialStmts.push(env.DB.prepare('INSERT INTO product_serials (id,product_id,serial) VALUES (?,?,?)').bind(uid(), p.id, ser));
            }
            bankIdx++;
          }
        }
        if (serialStmts.length) await env.DB.batch(serialStmts);

        // Coupons
        await env.DB.batch([
          env.DB.prepare('INSERT INTO coupons (id,shop_id,code,discount_percent,max_uses,active,created_at) VALUES (?,?,?,?,?,?,?)')
            .bind(uid(), shopId, 'WEEKEND20', 20, -1, 1, ts),
          env.DB.prepare('INSERT INTO coupons (id,shop_id,code,discount_percent,max_uses,active,created_at) VALUES (?,?,?,?,?,?,?)')
            .bind(uid(), shopId, 'WELCOME10', 10, 100, 1, ts),
        ]);

        // Sample vouches/reviews
        const reviewTexts = [
          { r: 5, c: 'Super rapide, clé reçue en 5 secondes, marche parfaitement ! 🔥' },
          { r: 5, c: 'Vendeur sérieux, je recommande à 100%' },
          { r: 5, c: '+rep livraison instantanée 24/7' },
          { r: 4, c: 'Très bien mais un peu cher' },
          { r: 5, c: 'Top, ça fait 3 fois que j\'achète ici' },
        ];
        const reviewStmts = reviewTexts.map((rev, i) => {
          const pid = productIds[i % productIds.length].id;
          return env.DB.prepare('INSERT INTO reviews (id,product_id,shop_id,buyer_email,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)')
            .bind(uid(), pid, shopId, `customer${i+1}@email.com`, rev.r, rev.c, ts - i * 86400000);
        });
        await env.DB.batch(reviewStmts);

        // Custom pages
        await env.DB.batch([
          env.DB.prepare('INSERT INTO custom_pages (id,shop_id,slug,title,content,sort_order,show_in_footer,created_at) VALUES (?,?,?,?,?,?,?,?)')
            .bind(uid(), shopId, 'tos', 'Conditions d\'utilisation', '# Conditions d\'utilisation\n\nEn utilisant cette boutique, vous acceptez nos conditions de vente.\n\n## Livraison\nLivraison instantanée par email après confirmation du paiement.\n\n## Remboursement\nLes produits digitaux ne sont pas remboursables une fois livrés.', 1, 1, ts),
          env.DB.prepare('INSERT INTO custom_pages (id,shop_id,slug,title,content,sort_order,show_in_footer,created_at) VALUES (?,?,?,?,?,?,?,?)')
            .bind(uid(), shopId, 'contact', 'Contact', '# Nous contacter\n\nUne question ? Un problème ?\n\n📧 contact@gamerkeys.example\n💬 Discord : @gamerkeys\n\nRéponse sous 24h ouvrées.', 2, 1, ts),
        ]);

        // Blog post
        await env.DB.prepare('INSERT INTO blog_posts (id,shop_id,slug,title,excerpt,content,image_url,published,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
          .bind(uid(), shopId, 'nouveautes-printemps', '🌸 Nouveautés du printemps',
            'Découvrez nos nouvelles offres : -30% sur les abonnements annuels !',
            '# Le printemps arrive avec ses promos !\n\nProfitez de **-30%** sur tous nos abonnements annuels avec le code **WEEKEND20**.\n\n## Au programme\n- Discord Nitro 1 an : 75,48€ au lieu de 107,88€\n- Spotify Premium 1 an : remise spéciale\n- Et bien d\'autres surprises !\n\nÀ très vite,\n*L\'équipe GamerKeys*',
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, ts);

        // Sample affiliate
        await env.DB.prepare('INSERT INTO affiliates (id,shop_id,code,email,commission_percent,created_at) VALUES (?,?,?,?,?,?)')
          .bind(uid(), shopId, 'CREATOR10', 'creator@example.com', 10, ts);

        const token = await signJWT(
          { id: userId, email, kind: 'seller', exp: Math.floor(Date.now() / 1000) + 7 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, user: { id: userId, email }, shop: { id: shopId, slug }, demo_password: password });
      }

      // ============ AUTHENTICATED (sellers) ============
      if (path.startsWith('/api/') && !path.startsWith('/api/auth/') && !path.startsWith('/api/public/') && !path.startsWith('/api/demo/') && !path.startsWith('/api/customer/')) {
        const user = await authUser(req, env) as any;
        if (!user || user.kind !== 'seller') return json({ error: 'Non authentifié' }, 401);

        // ---- /api/shops : list all shops of user ----
        if (path === '/api/shops' && req.method === 'GET') {
          const rows = await env.DB.prepare('SELECT id,slug,name,logo_url,created_at FROM shops WHERE user_id = ? ORDER BY created_at').bind(user.id).all();
          const plan = await getUserPlan(env, user.id);
          return json({ shops: rows.results, plan, limit: PLAN_LIMITS[plan] || 3 });
        }

        // ---- POST /api/shops : create a new shop ----
        if (path === '/api/shops' && req.method === 'POST') {
          const b = await req.json() as any;
          const plan = await getUserPlan(env, user.id);
          const limit = PLAN_LIMITS[plan] || 3;
          const cur = await env.DB.prepare('SELECT COUNT(*) as c FROM shops WHERE user_id = ?').bind(user.id).first() as any;
          if (cur.c >= limit) {
            return json({ error: `Limite de boutiques atteinte (${limit} sur le plan ${plan}). Passez au plan supérieur.` }, 403);
          }
          if (!b.name) return json({ error: 'Nom de boutique requis' }, 400);
          const baseSlug = slugify(b.name);
          let slug = baseSlug; let i = 0;
          while (await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(slug).first()) {
            slug = `${baseSlug}-${++i}`;
          }
          const shopId = uid();
          await env.DB.prepare('INSERT INTO shops (id,user_id,slug,name,created_at) VALUES (?,?,?,?,?)')
            .bind(shopId, user.id, slug, b.name, now()).run();
          const s = await env.DB.prepare('SELECT * FROM shops WHERE id = ?').bind(shopId).first();
          return json({ shop: s });
        }

        // DELETE a shop
        const shopDelMatch = path.match(/^\/api\/shops\/([^/]+)$/);
        if (shopDelMatch && req.method === 'DELETE') {
          const s = await env.DB.prepare('SELECT id FROM shops WHERE id = ? AND user_id = ?').bind(shopDelMatch[1], user.id).first();
          if (!s) return json({ error: 'Introuvable' }, 404);
          const total = await env.DB.prepare('SELECT COUNT(*) as c FROM shops WHERE user_id = ?').bind(user.id).first() as any;
          if (total.c <= 1) return json({ error: 'Impossible de supprimer la dernière boutique' }, 400);
          await env.DB.prepare('DELETE FROM shops WHERE id = ?').bind(shopDelMatch[1]).run();
          return json({ ok: true });
        }

        const shop = await resolveShop(req, env, user.id) as any;
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);

        if (path === '/api/me' && req.method === 'GET') {
          const plan = await getUserPlan(env, user.id);
          return json({ user: { ...user, plan }, shop });
        }

        // ---- BALANCE ----
        if (path === '/api/balance' && req.method === 'GET') {
          const rows = await env.DB.prepare('SELECT * FROM shop_balances WHERE shop_id = ?').bind(shop.id).all();
          // Ensure all 3 methods exist (default 0)
          const methods = ['stripe', 'paypal', 'crypto'];
          const existing = new Map((rows.results as any[]).map(r => [r.method, r]));
          const balances = methods.map(m => existing.get(m) || {
            method: m, currency: 'EUR', available_cents: 0, pending_cents: 0, total_earned_cents: 0,
          });
          const withdrawals = await env.DB.prepare(
            'SELECT * FROM withdrawals WHERE shop_id = ? ORDER BY created_at DESC LIMIT 50'
          ).bind(shop.id).all();
          return json({ balances, withdrawals: withdrawals.results });
        }

        if (path === '/api/withdrawals' && req.method === 'POST') {
          const b = await req.json() as any;
          if (!b.method || !b.amount_cents || !b.destination) {
            return json({ error: 'method, amount_cents et destination requis' }, 400);
          }
          const bal = await env.DB.prepare('SELECT * FROM shop_balances WHERE shop_id = ? AND method = ?').bind(shop.id, b.method).first() as any;
          if (!bal || bal.available_cents < b.amount_cents) {
            return json({ error: 'Solde insuffisant' }, 400);
          }
          const minWithdraw = 1000; // 10€ minimum
          if (b.amount_cents < minWithdraw) {
            return json({ error: `Montant minimum: ${minWithdraw / 100}€` }, 400);
          }
          const fee = Math.round(b.amount_cents * 0.02); // 2% fee mock
          const id = uid();
          await env.DB.batch([
            env.DB.prepare('INSERT INTO withdrawals (id,shop_id,user_id,method,amount_cents,currency,destination,status,fee_cents,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
              .bind(id, shop.id, user.id, b.method, b.amount_cents, bal.currency || 'EUR', b.destination, 'pending', fee, now()),
            env.DB.prepare('UPDATE shop_balances SET available_cents = available_cents - ?, pending_cents = pending_cents + ?, updated_at = ? WHERE id = ?')
              .bind(b.amount_cents, b.amount_cents, now(), bal.id),
          ]);
          return json({ id, status: 'pending', fee_cents: fee });
        }

        // ---- LIVE VIEWERS COUNT (for seller dashboard) ----
        if (path === '/api/viewers/count' && req.method === 'GET') {
          // Clean old (>30s) on the fly
          const cutoff = now() - 30000;
          await env.DB.prepare('DELETE FROM live_viewers WHERE last_seen < ?').bind(cutoff).run();
          const r = await env.DB.prepare(
            `SELECT COUNT(*) as total,
                    SUM(CASE WHEN page = 'shop' THEN 1 ELSE 0 END) as on_shop,
                    SUM(CASE WHEN page LIKE 'product:%' THEN 1 ELSE 0 END) as on_product,
                    SUM(CASE WHEN page = 'checkout' THEN 1 ELSE 0 END) as on_checkout
             FROM live_viewers WHERE shop_id = ?`
          ).bind(shop.id).first();
          return json(r);
        }

        if (path === '/api/shop' && req.method === 'PATCH') {
          const body = await req.json() as any;
          const fields: string[] = []; const values: any[] = [];
          const allowed = [
            'name','description','theme_color','logo_url','banner_url','maintenance','discord_webhook','announcement',
            'theme_preset','secondary_color','accent_color','background_pattern','background_color','font_family',
            'border_radius','product_layout','hero_enabled','hero_title','hero_subtitle','hero_cta_text','hero_image',
            'custom_css','footer_text','show_stats','social_twitter','social_discord','social_telegram','social_instagram'
          ];
          for (const k of allowed) {
            if (body[k] !== undefined) { fields.push(`${k} = ?`); values.push(body[k]); }
          }
          if (body.slug !== undefined) {
            const newSlug = slugify(body.slug);
            const taken = await env.DB.prepare('SELECT id FROM shops WHERE slug = ? AND id != ?').bind(newSlug, shop.id).first();
            if (taken) return json({ error: 'Slug déjà pris' }, 409);
            fields.push('slug = ?'); values.push(newSlug);
          }
          if (fields.length === 0) return json({ error: 'Rien à mettre à jour' }, 400);
          values.push(shop.id);
          await env.DB.prepare(`UPDATE shops SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
          const updated = await env.DB.prepare('SELECT * FROM shops WHERE id = ?').bind(shop.id).first();
          return json({ shop: updated });
        }

        // -------- ANALYTICS --------
        if (path === '/api/analytics' && req.method === 'GET') {
          const sevenDaysAgo = now() - 7 * 86400 * 1000;
          const thirtyDaysAgo = now() - 30 * 86400 * 1000;
          const totalsAll = await env.DB.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered'`).bind(shop.id).first();
          const totals7d = await env.DB.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered' AND created_at >= ?`).bind(shop.id, sevenDaysAgo).first();
          const totals30d = await env.DB.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount_cents),0) as revenue FROM orders WHERE shop_id = ? AND status = 'delivered' AND created_at >= ?`).bind(shop.id, thirtyDaysAgo).first();
          const topProducts = await env.DB.prepare(
            `SELECT p.id, p.name, p.image_url, COUNT(o.id) as sales, COALESCE(SUM(o.amount_cents),0) as revenue
             FROM products p LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'delivered'
             WHERE p.shop_id = ? GROUP BY p.id ORDER BY sales DESC LIMIT 5`
          ).bind(shop.id).all();
          const dailyRaw = await env.DB.prepare(`SELECT created_at, amount_cents FROM orders WHERE shop_id = ? AND status = 'delivered' AND created_at >= ?`).bind(shop.id, sevenDaysAgo).all();
          const dailyMap: Record<string, { revenue: number; count: number }> = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400 * 1000);
            dailyMap[d.toISOString().slice(0, 10)] = { revenue: 0, count: 0 };
          }
          for (const r of (dailyRaw.results || []) as any[]) {
            const key = new Date(r.created_at).toISOString().slice(0, 10);
            if (dailyMap[key]) { dailyMap[key].revenue += r.amount_cents; dailyMap[key].count += 1; }
          }
          const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));
          const totalViews = await env.DB.prepare(`SELECT COALESCE(SUM(view_count),0) as views FROM products WHERE shop_id = ?`).bind(shop.id).first();
          const newsletter = await env.DB.prepare(`SELECT COUNT(*) as count FROM newsletter WHERE shop_id = ?`).bind(shop.id).first();
          return json({
            all_time: totalsAll, last_7d: totals7d, last_30d: totals30d,
            top_products: topProducts.results, daily, total_views: (totalViews as any).views,
            newsletter_count: (newsletter as any).count,
          });
        }

        // -------- PRODUCTS --------
        if (path === '/api/products' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT p.*, c.name as category_name FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.shop_id = ? ORDER BY p.created_at DESC`
          ).bind(shop.id).all();
          return json({ products: rows.results });
        }

        if (path === '/api/products' && req.method === 'POST') {
          const b = await req.json() as any;
          if (!b.name || !b.price_cents || !b.delivery_type)
            return json({ error: 'name, price_cents, delivery_type requis' }, 400);
          const id = uid();
          await env.DB.prepare(
            `INSERT INTO products (id,shop_id,name,description,price_cents,currency,image_url,images,delivery_type,delivery_payload,stock,active,featured,category_id,min_quantity,max_quantity,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(id, shop.id, b.name, b.description ?? null, b.price_cents, b.currency ?? 'EUR',
            b.image_url ?? null, b.images ?? null, b.delivery_type, b.delivery_payload ?? null,
            b.stock ?? -1, b.active ?? 1, b.featured ?? 0, b.category_id ?? null,
            b.min_quantity ?? 1, b.max_quantity ?? 10, now()).run();
          const p = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
          return json({ product: p });
        }

        const prodMatch = path.match(/^\/api\/products\/([^/]+)$/);
        if (prodMatch) {
          const pid = prodMatch[1];
          const product = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND shop_id = ?').bind(pid, shop.id).first();
          if (!product) return json({ error: 'Produit introuvable' }, 404);
          if (req.method === 'PATCH') {
            const b = await req.json() as any;
            const fields: string[] = []; const values: any[] = [];
            for (const k of ['name','description','price_cents','currency','image_url','images','delivery_type','delivery_payload','stock','active','featured','category_id','min_quantity','max_quantity']) {
              if (b[k] !== undefined) { fields.push(`${k} = ?`); values.push(b[k]); }
            }
            if (fields.length) {
              values.push(pid);
              await env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
            }
            const p = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(pid).first();
            return json({ product: p });
          }
          if (req.method === 'DELETE') {
            await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(pid).run();
            return json({ ok: true });
          }
        }

        const serialsMatch = path.match(/^\/api\/products\/([^/]+)\/serials$/);
        if (serialsMatch && req.method === 'POST') {
          const pid = serialsMatch[1];
          const product = await env.DB.prepare('SELECT id FROM products WHERE id = ? AND shop_id = ?').bind(pid, shop.id).first();
          if (!product) return json({ error: 'Produit introuvable' }, 404);
          const { serials } = await req.json() as any;
          if (!Array.isArray(serials) || serials.length === 0) return json({ error: 'serials[] requis' }, 400);
          await env.DB.batch(serials.map((s: string) =>
            env.DB.prepare('INSERT INTO product_serials (id,product_id,serial) VALUES (?,?,?)').bind(uid(), pid, s)
          ));
          return json({ added: serials.length });
        }

        const serialsCountMatch = path.match(/^\/api\/products\/([^/]+)\/serials\/count$/);
        if (serialsCountMatch && req.method === 'GET') {
          const r = await env.DB.prepare(
            'SELECT SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as available, COUNT(*) as total FROM product_serials WHERE product_id = ?'
          ).bind(serialsCountMatch[1]).first();
          return json(r);
        }

        // -------- VARIANTS --------
        const variantsListMatch = path.match(/^\/api\/products\/([^/]+)\/variants$/);
        if (variantsListMatch) {
          const pid = variantsListMatch[1];
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order').bind(pid).all();
            return json({ variants: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            const id = uid();
            await env.DB.prepare('INSERT INTO product_variants (id,product_id,name,price_cents,delivery_payload,sort_order,active) VALUES (?,?,?,?,?,?,?)')
              .bind(id, pid, b.name, b.price_cents, b.delivery_payload || null, b.sort_order || 0, 1).run();
            return json({ id });
          }
        }
        const variantOneMatch = path.match(/^\/api\/variants\/([^/]+)$/);
        if (variantOneMatch && req.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM product_variants WHERE id = ?').bind(variantOneMatch[1]).run();
          return json({ ok: true });
        }

        // -------- CATEGORIES --------
        if (path === '/api/categories') {
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM categories WHERE shop_id = ? ORDER BY sort_order, name').bind(shop.id).all();
            return json({ categories: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            const id = uid();
            await env.DB.prepare('INSERT INTO categories (id,shop_id,name,slug,description,image_url,sort_order) VALUES (?,?,?,?,?,?,?)')
              .bind(id, shop.id, b.name, slugify(b.slug || b.name), b.description || null, b.image_url || null, b.sort_order || 0).run();
            return json({ id });
          }
        }
        const catMatch = path.match(/^\/api\/categories\/([^/]+)$/);
        if (catMatch && req.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM categories WHERE id = ? AND shop_id = ?').bind(catMatch[1], shop.id).run();
          return json({ ok: true });
        }

        // -------- ORDERS --------
        if (path === '/api/orders' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT o.*, p.name as product_name FROM orders o
             JOIN products p ON p.id = o.product_id
             WHERE o.shop_id = ? ORDER BY o.created_at DESC LIMIT 200`
          ).bind(shop.id).all();
          return json({ orders: rows.results });
        }
        if (path === '/api/orders/export' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT o.id, o.created_at, p.name as product_name, o.buyer_email, o.quantity, o.amount_cents, o.discount_cents, o.coupon_code, o.currency, o.status, o.delivery_content
             FROM orders o JOIN products p ON p.id = o.product_id WHERE o.shop_id = ? ORDER BY o.created_at DESC`
          ).bind(shop.id).all();
          const header = 'id,date,product,buyer_email,quantity,amount_cents,discount_cents,coupon,currency,status,delivery\n';
          const csv = header + (rows.results as any[]).map(r =>
            [r.id, new Date(r.created_at).toISOString(), JSON.stringify(r.product_name||''), r.buyer_email, r.quantity||1, r.amount_cents, r.discount_cents||0, r.coupon_code||'', r.currency, r.status, JSON.stringify(r.delivery_content||'')].join(',')
          ).join('\n');
          return new Response(csv, { headers: { 'content-type': 'text/csv', 'content-disposition': `attachment; filename="commandes-${shop.slug}.csv"`, 'access-control-allow-origin': '*' } });
        }

        // -------- COUPONS --------
        if (path === '/api/coupons') {
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM coupons WHERE shop_id = ? ORDER BY created_at DESC').bind(shop.id).all();
            return json({ coupons: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            if (!b.code || (!b.discount_percent && !b.discount_cents)) return json({ error: 'code + discount requis' }, 400);
            const id = uid();
            try {
              await env.DB.prepare('INSERT INTO coupons (id,shop_id,code,discount_percent,discount_cents,max_uses,expires_at,active,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
                .bind(id, shop.id, b.code.toUpperCase(), b.discount_percent || null, b.discount_cents || null, b.max_uses ?? -1, b.expires_at || null, 1, now()).run();
            } catch { return json({ error: 'Code déjà existant' }, 409); }
            const c = await env.DB.prepare('SELECT * FROM coupons WHERE id = ?').bind(id).first();
            return json({ coupon: c });
          }
        }
        const couponMatch = path.match(/^\/api\/coupons\/([^/]+)$/);
        if (couponMatch && req.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM coupons WHERE id = ? AND shop_id = ?').bind(couponMatch[1], shop.id).run();
          return json({ ok: true });
        }

        // -------- CUSTOM PAGES --------
        if (path === '/api/pages') {
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM custom_pages WHERE shop_id = ? ORDER BY sort_order').bind(shop.id).all();
            return json({ pages: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            const id = uid();
            await env.DB.prepare('INSERT INTO custom_pages (id,shop_id,slug,title,content,sort_order,show_in_footer,created_at) VALUES (?,?,?,?,?,?,?,?)')
              .bind(id, shop.id, slugify(b.slug || b.title), b.title, b.content || '', b.sort_order || 0, b.show_in_footer ?? 1, now()).run();
            return json({ id });
          }
        }
        const pageEditMatch = path.match(/^\/api\/pages\/([^/]+)$/);
        if (pageEditMatch) {
          const pid = pageEditMatch[1];
          if (req.method === 'PATCH') {
            const b = await req.json() as any;
            const fields: string[] = []; const values: any[] = [];
            for (const k of ['title','content','sort_order','show_in_footer']) {
              if (b[k] !== undefined) { fields.push(`${k} = ?`); values.push(b[k]); }
            }
            if (fields.length) {
              values.push(pid); values.push(shop.id);
              await env.DB.prepare(`UPDATE custom_pages SET ${fields.join(', ')} WHERE id = ? AND shop_id = ?`).bind(...values).run();
            }
            return json({ ok: true });
          }
          if (req.method === 'DELETE') {
            await env.DB.prepare('DELETE FROM custom_pages WHERE id = ? AND shop_id = ?').bind(pid, shop.id).run();
            return json({ ok: true });
          }
        }

        // -------- BLOG --------
        if (path === '/api/blog') {
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM blog_posts WHERE shop_id = ? ORDER BY created_at DESC').bind(shop.id).all();
            return json({ posts: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            const id = uid();
            await env.DB.prepare('INSERT INTO blog_posts (id,shop_id,slug,title,excerpt,content,image_url,published,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
              .bind(id, shop.id, slugify(b.slug || b.title), b.title, b.excerpt || '', b.content || '', b.image_url || null, b.published ?? 1, now()).run();
            return json({ id });
          }
        }
        const blogEditMatch = path.match(/^\/api\/blog\/([^/]+)$/);
        if (blogEditMatch && req.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM blog_posts WHERE id = ? AND shop_id = ?').bind(blogEditMatch[1], shop.id).run();
          return json({ ok: true });
        }

        // -------- AFFILIATES --------
        if (path === '/api/affiliates') {
          if (req.method === 'GET') {
            const rows = await env.DB.prepare('SELECT * FROM affiliates WHERE shop_id = ? ORDER BY earnings_cents DESC').bind(shop.id).all();
            return json({ affiliates: rows.results });
          }
          if (req.method === 'POST') {
            const b = await req.json() as any;
            const id = uid();
            try {
              await env.DB.prepare('INSERT INTO affiliates (id,shop_id,code,email,commission_percent,created_at) VALUES (?,?,?,?,?,?)')
                .bind(id, shop.id, b.code.toUpperCase(), b.email, b.commission_percent || 10, now()).run();
            } catch { return json({ error: 'Code déjà existant' }, 409); }
            return json({ id });
          }
        }
        const affMatch = path.match(/^\/api\/affiliates\/([^/]+)$/);
        if (affMatch && req.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM affiliates WHERE id = ? AND shop_id = ?').bind(affMatch[1], shop.id).run();
          return json({ ok: true });
        }

        // -------- REPLY TO REVIEW --------
        const reviewReplyMatch = path.match(/^\/api\/reviews\/([^/]+)\/reply$/);
        if (reviewReplyMatch && req.method === 'POST') {
          const rid = reviewReplyMatch[1];
          const { reply } = await req.json() as any;
          await env.DB.prepare('UPDATE reviews SET reply = ?, reply_at = ? WHERE id = ? AND shop_id = ?')
            .bind(reply, now(), rid, shop.id).run();
          return json({ ok: true });
        }

        // -------- REVIEWS LIST (seller) --------
        if (path === '/api/reviews' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT r.*, p.name as product_name FROM reviews r
             JOIN products p ON p.id = r.product_id
             WHERE r.shop_id = ? ORDER BY r.created_at DESC LIMIT 100`
          ).bind(shop.id).all();
          return json({ reviews: rows.results });
        }

        // -------- AI ASSISTANT --------
        if (path === '/api/ai/quota' && req.method === 'GET') {
          const plan = await getUserPlan(env, user.id);
          const q = await getQuota(env, user.id, plan);
          return json({ ...q, plan });
        }

        if (path === '/api/ai/insights' && req.method === 'GET') {
          // Check cache (30 min)
          const cached = await env.DB.prepare('SELECT * FROM ai_insights_cache WHERE shop_id = ?').bind(shop.id).first() as any;
          if (cached && (now() - cached.generated_at) < 30 * 60 * 1000) {
            return json({ insights: JSON.parse(cached.insights), cached: true, generated_at: cached.generated_at });
          }

          const plan = await getUserPlan(env, user.id);
          const quota = await checkAndIncrementQuota(env, user.id, plan);
          if (!quota.ok) {
            return json({ error: `Quota IA atteint (${quota.limit}/jour). Revenez demain ou passez Pro.`, quota }, 429);
          }

          const ctx = await buildShopContext(env, shop.id);
          const prompt = `Tu es un expert e-commerce qui aide un vendeur de produits digitaux à analyser sa boutique. À partir des données ci-dessous, génère exactement 3 insights actionnables au format JSON.

Chaque insight doit avoir:
- "type": "alert" (rouge, urgent: stock bas, baisse de ventes, avis négatif), "suggestion" (jaune, opportunité: code promo, mettre en vedette, baisser prix), ou "explanation" (bleu, info: explique une tendance, un succès)
- "title": court (max 60 chars), avec un emoji au début
- "message": 1-2 phrases concrètes, tutoie le vendeur, ton pro mais accessible
- "action": optionnel, suggestion d'action très courte (max 25 chars)

DONNÉES DE LA BOUTIQUE:
${ctx}

Réponds UNIQUEMENT avec un JSON valide de cette forme exacte:
{"insights":[{"type":"...","title":"...","message":"...","action":"..."},...]}

Pas d'explications hors JSON. Pas de markdown. Réponds en français.`;

          try {
            const response: any = await env.AI.run(AI_MODEL, {
              messages: [
                { role: 'system', content: 'Tu es un assistant e-commerce qui répond toujours en JSON valide.' },
                { role: 'user', content: prompt },
              ],
              max_tokens: 800,
              temperature: 0.7,
            });
            // Workers AI returns multiple shapes — try all
            let insights: any[] = [];

            // Shape 1: response.response is the object (already parsed by CF)
            if (response?.response?.insights && Array.isArray(response.response.insights)) {
              insights = response.response.insights;
            }
            // Shape 2: OpenAI-compatible: choices[0].message.content as JSON string
            else if (response?.choices?.[0]?.message?.content) {
              try {
                const parsed = JSON.parse(response.choices[0].message.content);
                if (Array.isArray(parsed.insights)) insights = parsed.insights;
              } catch {}
            }
            // Shape 3: response is a raw string with JSON inside
            else {
              let raw = typeof response === 'string' ? response :
                        typeof response?.response === 'string' ? response.response : '';
              if (raw) {
                const match = raw.match(/\{[\s\S]*\}/);
                if (match) {
                  try {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed.insights)) insights = parsed.insights;
                  } catch {}
                }
              }
            }

            insights = insights.slice(0, 5);
            if (insights.length === 0) {
              return json({ insights: [], generated_at: now(), quota });
            }
            await env.DB.prepare('INSERT OR REPLACE INTO ai_insights_cache (shop_id,insights,generated_at) VALUES (?,?,?)')
              .bind(shop.id, JSON.stringify(insights), now()).run();
            return json({ insights, cached: false, generated_at: now(), quota });
          } catch (err: any) {
            return json({ error: 'Erreur IA: ' + (err.message || 'inconnue') }, 500);
          }
        }

        if (path === '/api/ai/insights/refresh' && req.method === 'POST') {
          // Force refresh by clearing cache
          await env.DB.prepare('DELETE FROM ai_insights_cache WHERE shop_id = ?').bind(shop.id).run();
          return json({ ok: true });
        }

        if (path === '/api/ai/chat' && req.method === 'POST') {
          const { messages } = await req.json() as any;
          if (!Array.isArray(messages) || messages.length === 0) {
            return json({ error: 'messages[] requis' }, 400);
          }
          const plan = await getUserPlan(env, user.id);
          const quota = await checkAndIncrementQuota(env, user.id, plan);
          if (!quota.ok) {
            return json({ error: `Quota IA atteint (${quota.limit}/jour).`, quota }, 429);
          }

          const ctx = await buildShopContext(env, shop.id);
          const systemPrompt = `Tu es l'assistant IA de SellUp, plateforme SaaS de vente de produits digitaux. Tu aides le vendeur "${shop.name}" à gérer et optimiser sa boutique.

CONTEXTE DE SA BOUTIQUE (ne JAMAIS le réciter en bloc, utilise-le pour répondre):
${ctx}

Règles:
- Tutoie le vendeur, ton professionnel mais accessible
- Réponses concises (max 4-5 phrases) sauf si demande explicite de détails
- Donne des conseils actionnables, pas de blabla
- Si on te demande une analyse, fournis des chiffres concrets de ses données
- Si tu suggères une action (code promo, modifier prix, etc.), mentionne le bouton dans le dashboard
- Pas de markdown lourd, du texte fluide avec quelques emojis pertinents`;

          try {
            const response: any = await env.AI.run(AI_MODEL, {
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10), // keep last 10 turns
              ],
              max_tokens: 500,
              temperature: 0.8,
            });
            let text = '';
            if (typeof response === 'string') text = response;
            else if (typeof response?.response === 'string') text = response.response;
            else if (typeof response?.result?.response === 'string') text = response.result.response;
            else if (response?.choices?.[0]?.message?.content) text = response.choices[0].message.content;
            else text = 'Désolé, je n\'ai pas pu générer de réponse.';
            return json({ message: text, quota });
          } catch (err: any) {
            return json({ error: 'Erreur IA: ' + (err.message || 'inconnue') }, 500);
          }
        }

        // -------- NEWSLETTER (seller view) --------
        if (path === '/api/newsletter' && req.method === 'GET') {
          const rows = await env.DB.prepare('SELECT email,created_at FROM newsletter WHERE shop_id = ? ORDER BY created_at DESC').bind(shop.id).all();
          return json({ subscribers: rows.results });
        }

        return json({ error: 'Not found' }, 404);
      }

      // ============ PUBLIC ============
      const shopMatch = path.match(/^\/api\/public\/shop\/([^/]+)$/);
      if (shopMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT * FROM shops WHERE slug = ?').bind(shopMatch[1]).first() as any;
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);
        // strip sensitive
        delete shop.user_id;
        delete shop.discord_webhook;
        if (shop.maintenance) return json({ shop, products: [], maintenance: true });

        const products = await env.DB.prepare(
          `SELECT p.id,p.name,p.description,p.price_cents,p.currency,p.image_url,p.images,p.stock,p.featured,p.view_count,p.category_id,
                  (SELECT COUNT(*) FROM product_serials ps WHERE ps.product_id = p.id AND ps.used = 0) as available_stock,
                  (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
                  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count,
                  (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id AND o.status = 'delivered') as sales_count,
                  (SELECT MIN(price_cents) FROM product_variants WHERE product_id = p.id AND active = 1) as min_variant_price
           FROM products p WHERE p.shop_id = ? AND p.active = 1 ORDER BY p.featured DESC, p.created_at DESC`
        ).bind(shop.id).all();

        const categories = await env.DB.prepare('SELECT id,name,slug,description,image_url FROM categories WHERE shop_id = ? ORDER BY sort_order').bind(shop.id).all();

        const stats = await env.DB.prepare(
          `SELECT (SELECT COUNT(*) FROM orders WHERE shop_id = ? AND status = 'delivered') as total_sales,
                  (SELECT COUNT(DISTINCT buyer_email) FROM orders WHERE shop_id = ? AND status = 'delivered') as unique_buyers,
                  (SELECT AVG(rating) FROM reviews WHERE shop_id = ?) as avg_rating,
                  (SELECT COUNT(*) FROM reviews WHERE shop_id = ?) as review_count`
        ).bind(shop.id, shop.id, shop.id, shop.id).first();

        const recentReviews = await env.DB.prepare(
          `SELECT r.id,r.rating,r.comment,r.buyer_email,r.created_at,r.reply,p.name as product_name
           FROM reviews r JOIN products p ON p.id = r.product_id
           WHERE r.shop_id = ? AND r.comment IS NOT NULL AND r.comment != ''
           ORDER BY r.created_at DESC LIMIT 12`
        ).bind(shop.id).all();

        const pages = await env.DB.prepare('SELECT slug,title FROM custom_pages WHERE shop_id = ? AND show_in_footer = 1 ORDER BY sort_order').bind(shop.id).all();

        const blogCount = await env.DB.prepare('SELECT COUNT(*) as c FROM blog_posts WHERE shop_id = ? AND published = 1').bind(shop.id).first();

        return json({
          shop,
          products: products.results,
          categories: categories.results,
          stats,
          reviews: recentReviews.results,
          pages: pages.results,
          has_blog: ((blogCount as any).c || 0) > 0,
        });
      }

      // Get shop page
      const pageGetMatch = path.match(/^\/api\/public\/shop\/([^/]+)\/page\/([^/]+)$/);
      if (pageGetMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(pageGetMatch[1]).first() as any;
        if (!shop) return json({ error: 'Not found' }, 404);
        const page = await env.DB.prepare('SELECT * FROM custom_pages WHERE shop_id = ? AND slug = ?').bind(shop.id, pageGetMatch[2]).first();
        if (!page) return json({ error: 'Page introuvable' }, 404);
        return json({ page });
      }

      // Blog list
      const blogListMatch = path.match(/^\/api\/public\/shop\/([^/]+)\/blog$/);
      if (blogListMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(blogListMatch[1]).first() as any;
        if (!shop) return json({ error: 'Not found' }, 404);
        const posts = await env.DB.prepare('SELECT id,slug,title,excerpt,image_url,created_at FROM blog_posts WHERE shop_id = ? AND published = 1 ORDER BY created_at DESC').bind(shop.id).all();
        return json({ posts: posts.results });
      }

      // Blog one
      const blogOneMatch = path.match(/^\/api\/public\/shop\/([^/]+)\/blog\/([^/]+)$/);
      if (blogOneMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(blogOneMatch[1]).first() as any;
        if (!shop) return json({ error: 'Not found' }, 404);
        const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE shop_id = ? AND slug = ? AND published = 1').bind(shop.id, blogOneMatch[2]).first();
        if (!post) return json({ error: 'Article introuvable' }, 404);
        return json({ post });
      }

      const pubProdMatch = path.match(/^\/api\/public\/product\/([^/]+)$/);
      if (pubProdMatch && req.method === 'GET') {
        const product = await env.DB.prepare(
          `SELECT p.*, s.slug as shop_slug, s.name as shop_name, s.theme_color, s.logo_url
           FROM products p JOIN shops s ON s.id = p.shop_id
           WHERE p.id = ? AND p.active = 1`
        ).bind(pubProdMatch[1]).first();
        if (!product) return json({ error: 'Produit introuvable' }, 404);

        const p = product as any;
        const variants = await env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? AND active = 1 ORDER BY sort_order').bind(p.id).all();
        const stockInfo = await env.DB.prepare('SELECT COUNT(*) as available_stock FROM product_serials WHERE product_id = ? AND used = 0').bind(p.id).first();
        const ratings = await env.DB.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?').bind(p.id).first();
        const sales = await env.DB.prepare(`SELECT COUNT(*) as sales_count FROM orders WHERE product_id = ? AND status = 'delivered'`).bind(p.id).first();

        ctx.waitUntil(env.DB.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').bind(p.id).run());

        const reviews = await env.DB.prepare(
          'SELECT id,rating,comment,buyer_email,created_at,reply,reply_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 20'
        ).bind(p.id).all();

        // related products (same category)
        const related = await env.DB.prepare(
          `SELECT id,name,price_cents,currency,image_url FROM products
           WHERE shop_id = ? AND category_id = ? AND id != ? AND active = 1 LIMIT 4`
        ).bind(p.shop_id, p.category_id, p.id).all();

        return json({
          product: { ...p, ...stockInfo, ...ratings, ...sales },
          variants: variants.results,
          reviews: reviews.results,
          related: related.results,
        });
      }

      // Validate coupon
      if (path === '/api/public/coupon/validate' && req.method === 'POST') {
        const { shop_slug, code } = await req.json() as any;
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);
        const coupon = await env.DB.prepare('SELECT * FROM coupons WHERE shop_id = ? AND code = ? AND active = 1').bind(shop.id, code.toUpperCase()).first() as any;
        if (!coupon) return json({ error: 'Code invalide' }, 404);
        if (coupon.expires_at && coupon.expires_at < now()) return json({ error: 'Code expiré' }, 410);
        if (coupon.max_uses !== -1 && coupon.uses >= coupon.max_uses) return json({ error: 'Code épuisé' }, 410);
        return json({ code: coupon.code, discount_percent: coupon.discount_percent, discount_cents: coupon.discount_cents });
      }

      // Checkout
      if (path === '/api/public/checkout' && req.method === 'POST') {
        const { product_id, variant_id, buyer_email, quantity = 1, coupon_code, affiliate_code, newsletter: subscribeNl } = await req.json() as any;
        if (!product_id || !buyer_email) return json({ error: 'product_id, buyer_email requis' }, 400);
        const product = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND active = 1').bind(product_id).first() as any;
        if (!product) return json({ error: 'Produit introuvable' }, 404);

        let unitPrice = product.price_cents;
        if (variant_id) {
          const v = await env.DB.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').bind(variant_id, product.id).first() as any;
          if (!v) return json({ error: 'Variante introuvable' }, 404);
          unitPrice = v.price_cents;
        }

        const qty = Math.max(1, Math.min(quantity, product.max_quantity || 10));
        if (product.delivery_type === 'serials') {
          const stockCheck = await env.DB.prepare('SELECT COUNT(*) as c FROM product_serials WHERE product_id = ? AND used = 0').bind(product.id).first() as any;
          if (stockCheck.c < qty) return json({ error: `Stock insuffisant (${stockCheck.c} disponible)` }, 410);
        }

        let amount = unitPrice * qty;
        let discount = 0;
        let appliedCoupon: string | null = null;
        if (coupon_code) {
          const c = await env.DB.prepare('SELECT * FROM coupons WHERE shop_id = ? AND code = ? AND active = 1').bind(product.shop_id, coupon_code.toUpperCase()).first() as any;
          if (c && (!c.expires_at || c.expires_at >= now()) && (c.max_uses === -1 || c.uses < c.max_uses)) {
            if (c.discount_percent) discount = Math.round(amount * c.discount_percent / 100);
            else if (c.discount_cents) discount = Math.min(c.discount_cents, amount);
            appliedCoupon = c.code;
          }
        }

        const id = uid();
        await env.DB.prepare(
          `INSERT INTO orders (id,shop_id,product_id,variant_id,buyer_email,amount_cents,currency,status,quantity,coupon_code,discount_cents,affiliate_code,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(id, product.shop_id, product.id, variant_id || null, buyer_email, amount - discount, product.currency, 'pending', qty, appliedCoupon, discount, affiliate_code || null, now()).run();

        // Subscribe to newsletter (best-effort)
        if (subscribeNl) {
          ctx.waitUntil(env.DB.prepare('INSERT OR IGNORE INTO newsletter (id,shop_id,email,created_at) VALUES (?,?,?,?)')
            .bind(uid(), product.shop_id, buyer_email, now()).run());
        }

        return json({ order_id: id, total_cents: amount - discount, discount_cents: discount });
      }

      // Pay (mock)
      const payMatch = path.match(/^\/api\/public\/orders\/([^/]+)\/pay$/);
      if (payMatch && req.method === 'POST') {
        const orderId = payMatch[1];
        const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any;
        if (!order) return json({ error: 'Commande introuvable' }, 404);
        if (order.status !== 'pending') return json({ error: 'Commande déjà traitée' }, 400);

        const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(order.product_id).first() as any;
        let delivery = product.delivery_payload || '';

        // Variant payload override
        if (order.variant_id) {
          const v = await env.DB.prepare('SELECT delivery_payload FROM product_variants WHERE id = ?').bind(order.variant_id).first() as any;
          if (v?.delivery_payload) delivery = v.delivery_payload;
        }

        const qty = order.quantity || 1;
        if (product.delivery_type === 'serials') {
          const serials = await env.DB.prepare('SELECT * FROM product_serials WHERE product_id = ? AND used = 0 LIMIT ?').bind(product.id, qty).all();
          if ((serials.results as any[]).length < qty) return json({ error: 'Stock épuisé' }, 410);
          delivery = (serials.results as any[]).map(s => s.serial).join('\n');
          await env.DB.batch((serials.results as any[]).map(s =>
            env.DB.prepare('UPDATE product_serials SET used = 1, used_at = ? WHERE id = ?').bind(now(), s.id)
          ));
        }

        await env.DB.prepare('UPDATE orders SET status = ?, delivery_content = ? WHERE id = ?').bind('delivered', delivery, orderId).run();

        // Credit shop balance (mock — in production, split per real gateway used)
        // Round-robin between methods for demo variety
        const methodPool = ['stripe', 'paypal', 'crypto'];
        const methodPick = methodPool[Math.abs(hashStr(orderId)) % methodPool.length];
        ctx.waitUntil(creditBalance(env, order.shop_id, order.amount_cents, order.currency || 'EUR', methodPick));

        if (order.coupon_code) {
          await env.DB.prepare('UPDATE coupons SET uses = uses + 1 WHERE shop_id = ? AND code = ?').bind(order.shop_id, order.coupon_code).run();
        }

        // Affiliate commission tracking
        if (order.affiliate_code) {
          const aff = await env.DB.prepare('SELECT * FROM affiliates WHERE shop_id = ? AND code = ?').bind(order.shop_id, order.affiliate_code).first() as any;
          if (aff) {
            const commission = Math.round(order.amount_cents * aff.commission_percent / 100);
            await env.DB.prepare('UPDATE affiliates SET sales = sales + 1, earnings_cents = earnings_cents + ? WHERE id = ?').bind(commission, aff.id).run();
          }
        }

        const shop = await env.DB.prepare('SELECT discord_webhook,name FROM shops WHERE id = ?').bind(order.shop_id).first() as any;
        if (shop?.discord_webhook) {
          ctx.waitUntil(notifyDiscord(shop.discord_webhook, {
            embeds: [{
              title: '💰 Nouvelle vente !',
              description: `**${product.name}** × ${qty}\nMontant: **${(order.amount_cents / 100).toFixed(2)} ${order.currency}**\nAcheteur: \`${order.buyer_email}\``,
              color: 0x7C3AED,
              footer: { text: `${shop.name} • SellUp` },
              timestamp: new Date().toISOString(),
            }]
          }));
        }
        return json({ ok: true, order_id: orderId });
      }

      const getOrderMatch = path.match(/^\/api\/public\/orders\/([^/]+)$/);
      if (getOrderMatch && req.method === 'GET') {
        const order = await env.DB.prepare(
          `SELECT o.id,o.status,o.buyer_email,o.amount_cents,o.currency,o.delivery_content,o.created_at,o.quantity,o.discount_cents,o.coupon_code,
                  p.name as product_name, p.delivery_type, p.id as product_id,
                  s.name as shop_name, s.slug as shop_slug,
                  v.name as variant_name
           FROM orders o JOIN products p ON p.id = o.product_id JOIN shops s ON s.id = o.shop_id
           LEFT JOIN product_variants v ON v.id = o.variant_id
           WHERE o.id = ?`
        ).bind(getOrderMatch[1]).first();
        if (!order) return json({ error: 'Commande introuvable' }, 404);
        return json({ order });
      }

      if (path === '/api/public/review' && req.method === 'POST') {
        const { order_id, rating, comment } = await req.json() as any;
        if (!order_id || !rating || rating < 1 || rating > 5) return json({ error: 'order_id et rating (1-5) requis' }, 400);
        const order = await env.DB.prepare(`SELECT * FROM orders WHERE id = ? AND status = ?`).bind(order_id, 'delivered').first() as any;
        if (!order) return json({ error: 'Commande invalide' }, 404);
        const existing = await env.DB.prepare('SELECT id FROM reviews WHERE order_id = ?').bind(order_id).first();
        if (existing) return json({ error: 'Vous avez déjà laissé un avis' }, 409);
        const id = uid();
        await env.DB.prepare('INSERT INTO reviews (id,product_id,shop_id,order_id,buyer_email,rating,comment,created_at) VALUES (?,?,?,?,?,?,?,?)')
          .bind(id, order.product_id, order.shop_id, order_id, order.buyer_email, rating, comment || null, now()).run();
        return json({ ok: true });
      }

      // Newsletter signup
      if (path === '/api/public/newsletter' && req.method === 'POST') {
        const { shop_slug, email } = await req.json() as any;
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ error: 'Not found' }, 404);
        try {
          await env.DB.prepare('INSERT INTO newsletter (id,shop_id,email,created_at) VALUES (?,?,?,?)')
            .bind(uid(), shop.id, email, now()).run();
        } catch {}
        return json({ ok: true });
      }

      // Wishlist toggle
      if (path === '/api/public/wishlist' && req.method === 'POST') {
        const { customer_email, shop_slug, product_id, action } = await req.json() as any;
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ error: 'Not found' }, 404);
        if (action === 'add') {
          try {
            await env.DB.prepare('INSERT INTO wishlists (id,customer_email,shop_id,product_id,created_at) VALUES (?,?,?,?,?)')
              .bind(uid(), customer_email, shop.id, product_id, now()).run();
          } catch {}
        } else {
          await env.DB.prepare('DELETE FROM wishlists WHERE customer_email = ? AND product_id = ?').bind(customer_email, product_id).run();
        }
        return json({ ok: true });
      }
      const wlMatch = path.match(/^\/api\/public\/wishlist\/([^/]+)\/([^/]+)$/);
      if (wlMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(wlMatch[1]).first() as any;
        if (!shop) return json({ items: [] });
        const items = await env.DB.prepare(
          `SELECT p.id,p.name,p.price_cents,p.currency,p.image_url FROM wishlists w
           JOIN products p ON p.id = w.product_id WHERE w.customer_email = ? AND w.shop_id = ?`
        ).bind(wlMatch[2], shop.id).all();
        return json({ items: items.results });
      }

      // Live viewer heartbeat (visitor pings every 15s)
      if (path === '/api/public/heartbeat' && req.method === 'POST') {
        const { shop_slug, session_id, page } = await req.json() as any;
        if (!shop_slug || !session_id) return json({ ok: false });
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ ok: false });
        const r = await env.DB.prepare('UPDATE live_viewers SET last_seen = ?, page = ? WHERE shop_id = ? AND session_id = ?')
          .bind(now(), page || 'shop', shop.id, session_id).run();
        if ((r.meta as any)?.changes === 0) {
          await env.DB.prepare('INSERT INTO live_viewers (id,shop_id,session_id,last_seen,page) VALUES (?,?,?,?,?)')
            .bind(uid(), shop.id, session_id, now(), page || 'shop').run();
        }
        return json({ ok: true });
      }

      // Stock alert
      if (path === '/api/public/stock-alert' && req.method === 'POST') {
        const { product_id, email } = await req.json() as any;
        try {
          await env.DB.prepare('INSERT INTO stock_alerts (id,product_id,email,created_at) VALUES (?,?,?,?)')
            .bind(uid(), product_id, email, now()).run();
        } catch {}
        return json({ ok: true });
      }

      // Affiliate click tracking
      const affClickMatch = path.match(/^\/api\/public\/affiliate\/([^/]+)\/click$/);
      if (affClickMatch && req.method === 'POST') {
        const { shop_slug } = await req.json() as any;
        const shop = await env.DB.prepare('SELECT id FROM shops WHERE slug = ?').bind(shop_slug).first() as any;
        if (!shop) return json({ ok: false });
        await env.DB.prepare('UPDATE affiliates SET clicks = clicks + 1 WHERE shop_id = ? AND code = ?').bind(shop.id, affClickMatch[1]).run();
        return json({ ok: true });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err: any) {
      return json({ error: err.message || 'Server error' }, 500);
    }
  },
};
