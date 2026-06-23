import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, formatPrice, timeAgo } from '../lib/api';
import { Package, Search, Store, Star, TrendingUp, Eye, ShoppingBag, Users, Award, Heart, Mail } from 'lucide-react';
import { Stars } from '../components/ui/Stars';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { ShopLayout } from '../components/ShopLayout';
import { useCart } from '../lib/cart';
import { useToast } from '../components/ui/Toast';
import { useHeartbeat } from '../lib/heartbeat';
import { motion } from 'framer-motion';

type Sort = 'featured' | 'price_asc' | 'price_desc' | 'popular' | 'recent';

export default function Shop() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const cart = useCart();
  const toast = useToast();
  const customerEmail = localStorage.getItem('sellup_buyer_email') || '';
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useHeartbeat(slug, 'shop');

  // Affiliate tracking
  useEffect(() => {
    const ref = params.get('ref');
    if (ref && slug) {
      localStorage.setItem(`sellup_aff_${slug}`, ref);
      fetch(`/api/public/affiliate/${ref}/click`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shop_slug: slug }),
      }).catch(() => {});
    }
  }, [params, slug]);

  useEffect(() => {
    if (!slug) return;
    api.getShop(slug).then(setData).catch(e => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (data?.shop) {
      document.title = `${data.shop.name} • SellUp`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', data.shop.description || `Boutique ${data.shop.name}`);
    }
  }, [data]);

  // Load wishlist
  useEffect(() => {
    if (!slug || !customerEmail) return;
    fetch(`/api/public/wishlist/${slug}/${encodeURIComponent(customerEmail)}`)
      .then(r => r.json())
      .then(d => setWishlist(new Set((d.items || []).map((i: any) => i.id))));
  }, [slug, customerEmail]);

  const filtered = useMemo(() => {
    if (!data?.products) return [];
    let p = [...data.products];
    if (activeCat) p = p.filter((x: any) => x.category_id === activeCat);
    if (search) {
      const q = search.toLowerCase();
      p = p.filter((x: any) => x.name.toLowerCase().includes(q) || (x.description || '').toLowerCase().includes(q));
    }
    switch (sort) {
      case 'price_asc': p.sort((a, b) => a.price_cents - b.price_cents); break;
      case 'price_desc': p.sort((a, b) => b.price_cents - a.price_cents); break;
      case 'popular': p.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)); break;
      case 'recent': p.sort((a, b) => (b.created_at || 0) - (a.created_at || 0)); break;
      default: p.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return p;
  }, [data, search, sort, activeCat]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <Store className="w-12 h-12 text-white/30 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Boutique introuvable</h1>
        <p className="text-white/60 mb-6">{error}</p>
        <Link to="/" className="px-5 py-2 bg-brand-purple rounded-lg">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <div className="h-48 md:h-64 bg-white/5 animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-16 relative">
          <div className="w-24 h-24 rounded-2xl bg-white/10 animate-pulse border-4 border-brand-black mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const { shop, products, stats, categories, reviews, pages, has_blog, maintenance } = data;

  if (maintenance) {
    return (
      <ShopLayout shop={shop} pages={pages} hasBlog={has_blog}>
        <div className="flex flex-col items-center justify-center text-center py-32 px-6">
          <div className="text-6xl mb-4">🛠️</div>
          <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
          <p className="opacity-60 mb-2">La boutique est temporairement en maintenance.</p>
          <p className="opacity-40 text-sm">Revenez très bientôt !</p>
        </div>
      </ShopLayout>
    );
  }

  const layoutMap: Record<string, string> = {
    grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    grid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    grid4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
    list: 'flex flex-col gap-3',
  };
  const layoutGrid = layoutMap[shop.product_layout || 'grid3'] || layoutMap.grid3;

  const toggleWishlist = async (productId: string) => {
    if (!customerEmail) {
      const em = prompt('Votre email pour la wishlist :');
      if (!em) return;
      localStorage.setItem('sellup_buyer_email', em);
    }
    const email = localStorage.getItem('sellup_buyer_email')!;
    const inWl = wishlist.has(productId);
    await fetch('/api/public/wishlist', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customer_email: email, shop_slug: slug, product_id: productId, action: inWl ? 'remove' : 'add' }),
    });
    setWishlist(s => {
      const n = new Set(s);
      if (inWl) n.delete(productId); else n.add(productId);
      return n;
    });
    toast('success', inWl ? 'Retiré des favoris' : '❤️ Ajouté aux favoris');
  };

  const quickAdd = (p: any) => {
    cart.add({
      product_id: p.id, name: p.name, image_url: p.image_url,
      price_cents: p.price_cents, currency: p.currency,
      quantity: 1, shop_slug: shop.slug,
    });
    cart.setOpen(true);
  };

  return (
    <ShopLayout shop={shop} pages={pages} hasBlog={has_blog}>
      {/* Hero */}
      {shop.hero_enabled !== 0 && (
        <section className="relative py-16 md:py-24 px-6 overflow-hidden">
          {shop.banner_url && (
            <div className="absolute inset-0 -z-10" style={{ background: `url(${shop.banner_url}) center/cover`, opacity: 0.3 }} />
          )}
          <div className="max-w-5xl mx-auto text-center">
            {shop.logo_url ? (
              <img src={shop.logo_url} className="w-20 h-20 mx-auto rounded-2xl mb-6 shadow-2xl" alt="" />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-2xl mb-6 flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl"
                style={{ background: `linear-gradient(135deg, var(--shop-primary), var(--shop-secondary))` }}>
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold mb-4"
              style={{ background: `linear-gradient(135deg, currentColor, var(--shop-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {shop.hero_title || shop.name}
            </motion.h1>
            <p className="text-lg opacity-70 max-w-2xl mx-auto mb-8">
              {shop.hero_subtitle || shop.description}
            </p>

            {/* Public stats */}
            {shop.show_stats !== 0 && stats && (
              <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap mb-8">
                {stats.total_sales > 0 && (
                  <StatBubble icon={ShoppingBag} value={stats.total_sales} label="ventes" />
                )}
                {stats.unique_buyers > 0 && (
                  <StatBubble icon={Users} value={stats.unique_buyers} label="clients" />
                )}
                {stats.avg_rating && (
                  <div className="text-center">
                    <Stars rating={stats.avg_rating} size={20} />
                    <div className="text-xs opacity-60 mt-1">{Number(stats.avg_rating).toFixed(1)}/5 ({stats.review_count})</div>
                  </div>
                )}
                <StatBubble icon={Award} value={products.length} label="produits" />
              </div>
            )}

            {shop.hero_cta_text && (
              <a href="#products" className="inline-block px-8 py-3 rounded-lg font-bold text-white shadow-2xl hover:scale-105 transition"
                style={{ background: 'var(--shop-primary)', boxShadow: `0 10px 40px var(--shop-primary)60` }}>
                {shop.hero_cta_text} →
              </a>
            )}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Catégories</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              <button onClick={() => setActiveCat(null)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition border-2 ${activeCat === null ? 'text-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={activeCat === null ? { background: 'var(--shop-primary)', borderColor: 'var(--shop-primary)' } : { borderColor: 'currentColor' }}
              >
                Tout ({products.length})
              </button>
              {categories.map((c: any) => {
                const n = products.filter((p: any) => p.category_id === c.id).length;
                if (n === 0) return null;
                return (
                  <button key={c.id} onClick={() => setActiveCat(c.id)}
                    className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition border-2 ${activeCat === c.id ? 'text-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={activeCat === c.id ? { background: 'var(--shop-primary)', borderColor: 'var(--shop-primary)' } : { borderColor: 'currentColor' }}
                  >
                    {c.name} ({n})
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Search + sort */}
      <section id="products" className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..." className="input pl-10" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="input sm:w-48">
            <option value="featured">Mis en avant</option>
            <option value="popular">Plus populaires</option>
            <option value="recent">Plus récents</option>
            <option value="price_asc">Prix ↑</option>
            <option value="price_desc">Prix ↓</option>
          </select>
        </div>

        <div className="max-w-6xl mx-auto pb-12">
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 mx-auto opacity-30 mb-4" />
              <p className="opacity-60">{search ? 'Aucun produit ne correspond.' : 'Pas de produits dans cette catégorie.'}</p>
            </div>
          ) : (
            <div className={layoutGrid}>
              {filtered.map((p: any) => (
                <ProductCard key={p.id} p={p}
                  inWishlist={wishlist.has(p.id)}
                  onToggleWishlist={() => toggleWishlist(p.id)}
                  onQuickAdd={() => quickAdd(p)}
                  layout={shop.product_layout || 'grid3'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vouches/Reviews showcase */}
      {reviews?.length > 0 && (
        <section className="px-6 py-12 border-t" style={{ borderColor: `var(--shop-primary)15` }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">⭐ Ce que disent nos clients</h2>
            <p className="text-center opacity-60 mb-8">{stats.review_count} avis · note moyenne {Number(stats.avg_rating).toFixed(1)}/5</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.slice(0, 6).map((r: any) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="glass-card p-5"
                >
                  <Stars rating={r.rating} size={14} />
                  <p className="mt-3 mb-3 text-sm leading-relaxed">"{r.comment}"</p>
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <span>{r.buyer_email.replace(/(.{2}).*@/, '$1***@')}</span>
                    <span>{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="mt-2 text-xs opacity-50">sur {r.product_name}</div>
                  {r.reply && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs opacity-70">
                      <div className="font-bold mb-1" style={{ color: 'var(--shop-primary)' }}>Réponse du vendeur :</div>
                      <p>{r.reply}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="px-6 py-12 border-t" style={{ borderColor: `var(--shop-primary)15` }}>
        <Newsletter shop_slug={shop.slug} />
      </section>
    </ShopLayout>
  );
}

function StatBubble({ icon: Icon, value, label }: any) {
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--shop-primary)' }} />
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}

function ProductCard({ p, inWishlist, onToggleWishlist, onQuickAdd, layout }: any) {
  const lowStock = p.available_stock && p.available_stock <= 5 && p.available_stock > 0;
  const outOfStock = p.available_stock === 0;
  const priceDisplay = p.min_variant_price ? `Dès ${formatPrice(p.min_variant_price, p.currency)}` : formatPrice(p.price_cents, p.currency);

  if (layout === 'list') {
    return (
      <div className="glass-card p-4 flex gap-4 items-center hover:scale-[1.01] transition group">
        <Link to={`/p/${p.id}`} className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-white/5">
          {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-8 h-8 m-auto opacity-30" />}
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/p/${p.id}`} className="font-bold hover:underline">{p.name}</Link>
          <p className="text-sm opacity-60 line-clamp-1">{p.description}</p>
          <div className="mt-1 flex items-center gap-3 text-xs">
            {p.avg_rating ? <Stars rating={p.avg_rating} size={11} showNumber count={p.review_count} /> : <span className="opacity-30">Pas d'avis</span>}
            {p.sales_count > 0 && <span className="opacity-50">• {p.sales_count} vendus</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg" style={{ color: 'var(--shop-primary)' }}>{priceDisplay}</div>
          <button onClick={onQuickAdd} disabled={outOfStock}
            className="mt-2 px-3 py-1.5 rounded text-xs font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--shop-primary)' }}>
            {outOfStock ? 'Épuisé' : 'Acheter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/p/${p.id}`} className="glass-card overflow-hidden hover:scale-[1.02] transition group relative block"
      style={{ borderRadius: 'var(--shop-radius)' }}>
      {p.featured && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 text-white"
          style={{ background: 'var(--shop-primary)' }}>
          <Star className="w-3 h-3 fill-current" /> VEDETTE
        </div>
      )}
      {lowStock && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/90 text-white animate-pulse">
          🔥 Plus que {p.available_stock} !
        </div>
      )}
      {outOfStock && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/90 text-white">ÉPUISÉ</div>
      )}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(); }}
        className="absolute bottom-2 right-2 z-10 p-2 rounded-full backdrop-blur-md transition hover:scale-110"
        style={{ background: inWishlist ? 'var(--shop-primary)' : 'rgba(0,0,0,0.4)' }}
      >
        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white text-white' : 'text-white'}`} />
      </button>
      <div className="aspect-video bg-white/5 relative overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, var(--shop-primary)30, transparent)` }}>
            <Package className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold mb-1 truncate">{p.name}</h3>
        <p className="text-sm opacity-50 line-clamp-2 mb-3 h-10">{p.description || ' '}</p>
        <div className="flex items-center gap-2 mb-3 text-xs">
          {p.avg_rating ? (
            <Stars rating={p.avg_rating} size={12} showNumber count={p.review_count} />
          ) : (
            <span className="opacity-30">Pas d'avis</span>
          )}
          {p.sales_count > 0 && (
            <span className="opacity-50 flex items-center gap-1 ml-auto">
              <TrendingUp className="w-3 h-3" /> {p.sales_count}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: 'var(--shop-primary)' }}>{priceDisplay}</span>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: `var(--shop-primary)20`, color: 'var(--shop-primary)' }}>
            {outOfStock ? 'Indisponible' : 'Acheter →'}
          </span>
        </div>
        {p.view_count > 0 && (
          <div className="mt-2 text-xs opacity-30 flex items-center gap-1">
            <Eye className="w-3 h-3" /> {p.view_count} vues
          </div>
        )}
      </div>
    </Link>
  );
}

function Newsletter({ shop_slug }: { shop_slug: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const toast = useToast();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/public/newsletter', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shop_slug, email }),
      });
      setDone(true);
      toast('success', '🎉 Inscription confirmée !');
    } catch {}
  };
  return (
    <div className="max-w-2xl mx-auto text-center">
      <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--shop-primary)' }} />
      <h3 className="text-2xl font-bold mb-2">Ne ratez aucune nouveauté</h3>
      <p className="opacity-60 mb-6">Recevez nos meilleures offres et codes promo en exclusivité</p>
      {done ? (
        <p className="text-green-400">✓ Vous êtes inscrit !</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 max-w-md mx-auto">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="vous@email.com" className="input flex-1" />
          <button type="submit" className="px-5 py-2 rounded-lg font-bold text-white"
            style={{ background: 'var(--shop-primary)' }}>S'inscrire</button>
        </form>
      )}
    </div>
  );
}
