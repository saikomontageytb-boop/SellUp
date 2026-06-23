import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { useCart } from '../lib/cart';
import { useToast } from '../components/ui/Toast';
import { ShopLayout } from '../components/ShopLayout';
import { useHeartbeat } from '../lib/heartbeat';
import { ShoppingCart, ArrowLeft, Tag, X, Trash2, Plus, Minus } from 'lucide-react';

export default function Cart() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const [shopData, setShopData] = useState<any>(null);
  const [email, setEmail] = useState(localStorage.getItem('sellup_buyer_email') || '');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  useHeartbeat(slug, 'checkout');

  useEffect(() => {
    if (!slug) return;
    api.getShop(slug).then(setShopData);
  }, [slug]);

  if (!slug || !shopData) return <div className="min-h-screen flex items-center justify-center opacity-50">Chargement...</div>;

  const items = cart.items.filter(i => i.shop_slug === slug);
  const subtotal = cart.total(slug);
  const discount = appliedCoupon
    ? (appliedCoupon.discount_percent
        ? Math.round(subtotal * appliedCoupon.discount_percent / 100)
        : Math.min(appliedCoupon.discount_cents, subtotal))
    : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setValidating(true);
    try {
      const c = await api.validateCoupon(slug, coupon.trim());
      setAppliedCoupon(c);
      toast('success', `Code "${c.code}" appliqué`);
    } catch (e: any) { toast('error', e.message); }
    finally { setValidating(false); }
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    localStorage.setItem('sellup_buyer_email', email);
    setPaying(true);
    try {
      const affCode = localStorage.getItem(`sellup_aff_${slug}`) || undefined;
      // Multi-product cart: we checkout each item separately and store IDs.
      // Then redirect to first checkout. Simpler: checkout the first item only, store full cart in metadata.
      // For MVP we treat each item as one order. Group into a single "cart_checkout":
      const orderIds: string[] = [];
      for (const item of items) {
        const res = await fetch('/api/public/checkout', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            product_id: item.product_id,
            variant_id: item.variant_id || undefined,
            buyer_email: email,
            quantity: item.quantity,
            coupon_code: appliedCoupon?.code,
            affiliate_code: affCode,
            newsletter,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Erreur');
        orderIds.push(j.order_id);
      }
      // Redirect to checkout of the first order; for multi-cart you'd build a multi-pay page
      cart.clear(slug);
      nav(`/checkout/${orderIds[0]}${orderIds.length > 1 ? `?multi=${orderIds.slice(1).join(',')}` : ''}`);
    } catch (e: any) {
      toast('error', e.message);
      setPaying(false);
    }
  };

  return (
    <ShopLayout shop={shopData.shop} pages={shopData.pages} hasBlog={shopData.has_blog}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to={`/s/${slug}`} className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Continuer mes achats
        </Link>
        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7" /> Mon panier
        </h1>
        <p className="opacity-60 mb-8">{items.length} article(s) chez <strong>{shopData.shop.name}</strong></p>

        {items.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto opacity-30 mb-4" />
            <p className="opacity-60 mb-4">Votre panier est vide</p>
            <Link to={`/s/${slug}`} className="inline-block px-6 py-2 rounded-lg font-medium text-white"
              style={{ background: 'var(--shop-primary)' }}>
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.product_id + (item.variant_id || '')} className="glass-card p-4 flex gap-4">
                  <Link to={`/p/${item.product_id}`} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-white/5">
                    {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/p/${item.product_id}`} className="font-bold hover:underline">{item.name}</Link>
                    {item.variant_name && <div className="text-sm opacity-60">{item.variant_name}</div>}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => cart.updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                          className="p-1 bg-white/5 hover:bg-white/10 rounded"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => cart.updateQty(item.product_id, item.variant_id, item.quantity + 1)}
                          className="p-1 bg-white/5 hover:bg-white/10 rounded"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => cart.remove(item.product_id, item.variant_id)}
                        className="p-1 hover:bg-red-500/10 text-red-400 rounded ml-auto"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: 'var(--shop-primary)' }}>
                      {formatPrice(item.price_cents * item.quantity, item.currency)}
                    </div>
                    <div className="text-xs opacity-50 mt-1">{formatPrice(item.price_cents, item.currency)} × {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <form onSubmit={checkout} className="glass-card p-5 h-fit lg:sticky lg:top-24">
              <h3 className="font-bold mb-4">Résumé</h3>

              {appliedCoupon ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                  <Tag className="w-4 h-4 text-green-400" />
                  <span className="flex-1 font-mono font-bold text-green-400 text-sm">{appliedCoupon.code}</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Code promo" className="input flex-1 font-mono uppercase text-sm" />
                  <button type="button" onClick={applyCoupon} disabled={!coupon || validating}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">OK</button>
                </div>
              )}

              <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between"><span className="opacity-70">Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400"><span>Réduction</span><span>-{formatPrice(discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span>Total</span><span style={{ color: 'var(--shop-primary)' }}>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email de livraison</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="vous@email.com" className="input" />
              </div>

              <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
                <span className="opacity-80">Recevoir les promos et nouveautés</span>
              </label>

              <button type="submit" disabled={paying}
                className="w-full px-6 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition disabled:opacity-50"
                style={{ background: 'var(--shop-primary)', boxShadow: `0 0 30px var(--shop-primary)60` }}>
                {paying ? 'Préparation...' : `Payer ${formatPrice(total)}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
