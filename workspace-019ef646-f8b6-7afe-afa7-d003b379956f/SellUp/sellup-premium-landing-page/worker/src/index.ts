/**
 * SellUp API — Cloudflare Worker
 * Routes:
 *   POST   /api/auth/register         { email, password }
 *   POST   /api/auth/login            { email, password }   -> { token, user, shop }
 *   GET    /api/me                    (auth) -> { user, shop }
 *   PATCH  /api/shop                  (auth) { name, description, slug, theme_color }
 *   GET    /api/products              (auth) -> seller's products
 *   POST   /api/products              (auth) create product
 *   PATCH  /api/products/:id          (auth) update
 *   DELETE /api/products/:id          (auth) delete
 *   POST   /api/products/:id/serials  (auth) { serials: string[] } add stock
 *   GET    /api/orders                (auth) seller's orders
 *
 *   GET    /api/public/shop/:slug                    -> shop + active products
 *   GET    /api/public/product/:id                   -> product details
 *   POST   /api/public/checkout                      { product_id, buyer_email } -> { order_id }
 *   POST   /api/public/orders/:id/pay  (MOCK)        -> marks paid + delivers
 *   GET    /api/public/orders/:id                    -> delivery info
 */

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;
  JWT_SECRET: string;
}

// ---------- Helpers ----------

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
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'shop';

// Password hashing using Web Crypto (PBKDF2)
async function hashPassword(password: string, salt?: string): Promise<string> {
  const enc = new TextEncoder();
  const useSalt = salt ?? crypto.randomUUID();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
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

// Simple HS256 JWT
function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
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
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
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

// ---------- Router ----------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return json({}, 204);
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // ============ AUTH ============
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
        let slug = baseSlug;
        let i = 0;
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
          { id: userId, email, exp: Math.floor(Date.now() / 1000) + 7 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, user: { id: userId, email }, shop: { id: shopId, slug } });
      }

      if (path === '/api/auth/login' && req.method === 'POST') {
        const { email, password } = await req.json() as any;
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any;
        if (!user || !await verifyPassword(password, user.password_hash))
          return json({ error: 'Identifiants invalides' }, 401);
        const shop = await env.DB.prepare('SELECT id,slug,name FROM shops WHERE user_id = ?').bind(user.id).first();
        const token = await signJWT(
          { id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 7 * 86400 },
          env.JWT_SECRET
        );
        return json({ token, user: { id: user.id, email: user.email }, shop });
      }

      // ============ AUTHENTICATED ============
      if (path.startsWith('/api/') && !path.startsWith('/api/auth/') && !path.startsWith('/api/public/')) {
        const user = await authUser(req, env);
        if (!user) return json({ error: 'Non authentifié' }, 401);

        const shop = await env.DB.prepare('SELECT * FROM shops WHERE user_id = ?').bind(user.id).first() as any;
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);

        if (path === '/api/me' && req.method === 'GET') {
          return json({ user, shop });
        }

        if (path === '/api/shop' && req.method === 'PATCH') {
          const body = await req.json() as any;
          const fields: string[] = []; const values: any[] = [];
          for (const k of ['name', 'description', 'theme_color', 'logo_url', 'banner_url']) {
            if (body[k] !== undefined) { fields.push(`${k} = ?`); values.push(body[k]); }
          }
          if (body.slug !== undefined) {
            const newSlug = slugify(body.slug);
            const taken = await env.DB.prepare('SELECT id FROM shops WHERE slug = ? AND id != ?')
              .bind(newSlug, shop.id).first();
            if (taken) return json({ error: 'Slug déjà pris' }, 409);
            fields.push('slug = ?'); values.push(newSlug);
          }
          if (fields.length === 0) return json({ error: 'Rien à mettre à jour' }, 400);
          values.push(shop.id);
          await env.DB.prepare(`UPDATE shops SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
          const updated = await env.DB.prepare('SELECT * FROM shops WHERE id = ?').bind(shop.id).first();
          return json({ shop: updated });
        }

        if (path === '/api/products' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            'SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC'
          ).bind(shop.id).all();
          return json({ products: rows.results });
        }

        if (path === '/api/products' && req.method === 'POST') {
          const b = await req.json() as any;
          if (!b.name || !b.price_cents || !b.delivery_type)
            return json({ error: 'name, price_cents, delivery_type requis' }, 400);
          const id = uid();
          await env.DB.prepare(
            `INSERT INTO products (id,shop_id,name,description,price_cents,currency,image_url,delivery_type,delivery_payload,stock,active,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            id, shop.id, b.name, b.description ?? null, b.price_cents,
            b.currency ?? 'EUR', b.image_url ?? null, b.delivery_type,
            b.delivery_payload ?? null, b.stock ?? -1, 1, now()
          ).run();
          const p = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
          return json({ product: p });
        }

        const prodMatch = path.match(/^\/api\/products\/([^/]+)$/);
        if (prodMatch) {
          const pid = prodMatch[1];
          const product = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND shop_id = ?')
            .bind(pid, shop.id).first();
          if (!product) return json({ error: 'Produit introuvable' }, 404);

          if (req.method === 'PATCH') {
            const b = await req.json() as any;
            const fields: string[] = []; const values: any[] = [];
            for (const k of ['name','description','price_cents','currency','image_url','delivery_type','delivery_payload','stock','active']) {
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
          const product = await env.DB.prepare('SELECT id FROM products WHERE id = ? AND shop_id = ?')
            .bind(pid, shop.id).first();
          if (!product) return json({ error: 'Produit introuvable' }, 404);
          const { serials } = await req.json() as any;
          if (!Array.isArray(serials) || serials.length === 0)
            return json({ error: 'serials[] requis' }, 400);
          const stmts = serials.map((s: string) =>
            env.DB.prepare('INSERT INTO product_serials (id,product_id,serial) VALUES (?,?,?)')
              .bind(uid(), pid, s)
          );
          await env.DB.batch(stmts);
          return json({ added: serials.length });
        }

        if (path === '/api/orders' && req.method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT o.*, p.name as product_name FROM orders o
             JOIN products p ON p.id = o.product_id
             WHERE o.shop_id = ? ORDER BY o.created_at DESC LIMIT 100`
          ).bind(shop.id).all();
          return json({ orders: rows.results });
        }

        return json({ error: 'Not found' }, 404);
      }

      // ============ PUBLIC ============
      const shopMatch = path.match(/^\/api\/public\/shop\/([^/]+)$/);
      if (shopMatch && req.method === 'GET') {
        const shop = await env.DB.prepare('SELECT id,slug,name,description,logo_url,banner_url,theme_color FROM shops WHERE slug = ?')
          .bind(shopMatch[1]).first();
        if (!shop) return json({ error: 'Boutique introuvable' }, 404);
        const products = await env.DB.prepare(
          'SELECT id,name,description,price_cents,currency,image_url,stock FROM products WHERE shop_id = ? AND active = 1 ORDER BY created_at DESC'
        ).bind((shop as any).id).all();
        return json({ shop, products: products.results });
      }

      const pubProdMatch = path.match(/^\/api\/public\/product\/([^/]+)$/);
      if (pubProdMatch && req.method === 'GET') {
        const product = await env.DB.prepare(
          `SELECT p.id,p.name,p.description,p.price_cents,p.currency,p.image_url,p.stock,p.delivery_type,
                  s.slug as shop_slug, s.name as shop_name, s.theme_color
           FROM products p JOIN shops s ON s.id = p.shop_id
           WHERE p.id = ? AND p.active = 1`
        ).bind(pubProdMatch[1]).first();
        if (!product) return json({ error: 'Produit introuvable' }, 404);
        return json({ product });
      }

      if (path === '/api/public/checkout' && req.method === 'POST') {
        const { product_id, buyer_email } = await req.json() as any;
        if (!product_id || !buyer_email) return json({ error: 'product_id, buyer_email requis' }, 400);
        const product = await env.DB.prepare('SELECT * FROM products WHERE id = ? AND active = 1').bind(product_id).first() as any;
        if (!product) return json({ error: 'Produit introuvable' }, 404);
        const id = uid();
        await env.DB.prepare(
          `INSERT INTO orders (id,shop_id,product_id,buyer_email,amount_cents,currency,status,created_at)
           VALUES (?,?,?,?,?,?,?,?)`
        ).bind(id, product.shop_id, product.id, buyer_email, product.price_cents, product.currency, 'pending', now()).run();
        return json({ order_id: id });
      }

      const payMatch = path.match(/^\/api\/public\/orders\/([^/]+)\/pay$/);
      if (payMatch && req.method === 'POST') {
        const orderId = payMatch[1];
        const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any;
        if (!order) return json({ error: 'Commande introuvable' }, 404);
        if (order.status !== 'pending') return json({ error: 'Commande déjà traitée' }, 400);

        const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(order.product_id).first() as any;
        let delivery = product.delivery_payload || '';

        if (product.delivery_type === 'serials') {
          const serial = await env.DB.prepare(
            'SELECT * FROM product_serials WHERE product_id = ? AND used = 0 LIMIT 1'
          ).bind(product.id).first() as any;
          if (!serial) return json({ error: 'Stock épuisé' }, 410);
          await env.DB.prepare('UPDATE product_serials SET used = 1, used_at = ? WHERE id = ?')
            .bind(now(), serial.id).run();
          delivery = serial.serial;
        }

        await env.DB.prepare('UPDATE orders SET status = ?, delivery_content = ? WHERE id = ?')
          .bind('delivered', delivery, orderId).run();
        return json({ ok: true, order_id: orderId });
      }

      const getOrderMatch = path.match(/^\/api\/public\/orders\/([^/]+)$/);
      if (getOrderMatch && req.method === 'GET') {
        const order = await env.DB.prepare(
          `SELECT o.id,o.status,o.buyer_email,o.amount_cents,o.currency,o.delivery_content,o.created_at,
                  p.name as product_name, p.delivery_type, s.name as shop_name, s.slug as shop_slug
           FROM orders o JOIN products p ON p.id = o.product_id JOIN shops s ON s.id = o.shop_id
           WHERE o.id = ?`
        ).bind(getOrderMatch[1]).first();
        if (!order) return json({ error: 'Commande introuvable' }, 404);
        return json({ order });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err: any) {
      return json({ error: err.message || 'Server error' }, 500);
    }
  },
};
