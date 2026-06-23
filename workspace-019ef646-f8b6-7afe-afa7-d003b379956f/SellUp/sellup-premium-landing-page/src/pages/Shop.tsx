import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { Package, ShoppingBag, Store } from 'lucide-react';

export default function Shop() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ shop: any; products: any[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getShop(slug)
      .then(setData)
      .catch(e => setError(e.message));
  }, [slug]);

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

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/40">Chargement...</div>;

  const { shop, products } = data;
  const themeColor = shop.theme_color || '#7C3AED';

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden border-b border-white/10"
        style={{ background: shop.banner_url ? `url(${shop.banner_url}) center/cover` : `linear-gradient(135deg, ${themeColor}40, #08080C)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative">
        <div className="flex items-end gap-5 mb-8 flex-wrap">
          <div className="w-24 h-24 rounded-2xl border-4 border-brand-black shrink-0 overflow-hidden"
            style={{ background: shop.logo_url ? `url(${shop.logo_url}) center/cover` : themeColor }}>
            {!shop.logo_url && (
              <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold">{shop.name}</h1>
            {shop.description && <p className="text-white/60 mt-1 max-w-2xl">{shop.description}</p>}
          </div>
          <Link to="/" className="text-xs text-white/40 hover:text-white">
            Propulsé par <span className="font-bold text-white/70">SellUp</span>
          </Link>
        </div>

        {/* Products */}
        <div className="mb-20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Produits
          </h2>

          {products.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <p className="text-white/60">Cette boutique n'a pas encore de produits.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => (
                <Link key={p.id} to={`/p/${p.id}`} className="glass-card overflow-hidden hover:scale-[1.02] transition group">
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${themeColor}30, transparent)` }}>
                        <Package className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1 truncate">{p.name}</h3>
                    <p className="text-sm text-white/50 line-clamp-2 mb-3 h-10">{p.description || ' '}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold" style={{ color: themeColor }}>
                        {formatPrice(p.price_cents, p.currency)}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full"
                        style={{ background: `${themeColor}20`, color: themeColor }}>
                        Acheter →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
