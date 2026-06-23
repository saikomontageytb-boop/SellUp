import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, formatPrice, timeAgo } from '../lib/api';
import { Package, ShieldCheck, Zap, ArrowLeft, Minus, Plus, Eye, Users, Tag, X, MessageSquare, ShoppingCart, BellRing } from 'lucide-react';
import { Stars } from '../components/ui/Stars';
import { useToast } from '../components/ui/Toast';
import { useCart } from '../lib/cart';
import { useHeartbeat } from '../lib/heartbeat';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopLayout } from '../components/ShopLayout';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('sellup_buyer_email') || '');
  const [quantity, setQuantity] = useState(1);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [watchers] = useState(Math.floor(Math.random() * 12) + 3);
  const [stockAlertEmail, setStockAlertEmail] = useState('');
  const [stockAlertSent, setStockAlertSent] = useState(false);

  useHeartbeat(data?.product?.shop_slug, `product:${id}`);

  useEffect(() => {
    if (!id) return;
    api.getProduct(id).then(d => {
      setData(d);
      if ((d as any).variants?.length) setSelectedVariantId((d as any).variants[0].id);
    }).catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (data?.product) document.title = `${data.product.name} • ${data.product.shop_name}`;
  }, [data]);

  const product = data?.product;
  const reviews = data?.reviews || [];
  const variants = data?.variants || [];
  const related = data?.related || [];
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId);
  const [shopData, setShopData] = useState<any>(null);

  // Load shop for layout
  useEffect(() => {
    if (!product?.shop_slug) return;
    api.getShop(product.shop_slug).then(setShopData).catch(() => {});
  }, [product?.shop_slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images) {
      try {
        const arr = JSON.parse(product.images);
        if (Array.isArray(arr)) imgs.push(...arr);
      } catch {}
    }
    return imgs;
  }, [product]);

  const unitPrice = selectedVariant?.price_cents ?? product?.price_cents ?? 0;
  const baseTotal = unitPrice * quantity;
  const discount = appliedCoupon
    ? (appliedCoupon.discount_percent
        ? Math.round(baseTotal * appliedCoupon.discount_percent / 100)
        : Math.min(appliedCoupon.discount_cents, baseTotal))
    : 0;
  const total = baseTotal - discount;

  const applyCoupon = async () => {
    if (!couponInput.trim() || !product) return;
    setValidatingCoupon(true);
    try {
      const c = await api.validateCoupon(product.shop_slug, couponInput.trim());
      setAppliedCoupon(c);
      toast('success', `Code "${c.code}" appliqué ! 🎉`);
    } catch (e: any) { toast('error', e.message); }
    finally { setValidatingCoupon(false); }
  };

  const addToCart = () => {
    if (!product) return;
    cart.add({
      product_id: product.id,
      variant_id: selectedVariantId || undefined,
      name: product.name,
      variant_name: selectedVariant?.name,
      image_url: product.image_url,
      price_cents: unitPrice,
      currency: product.currency,
      quantity,
      shop_slug: product.shop_slug,
    });
    toast('success', '🛒 Ajouté au panier');
    cart.setOpen(true);
  };

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (email) localStorage.setItem('sellup_buyer_email', email);
    setBuying(true);
    try {
      const affCode = localStorage.getItem(`sellup_aff_${product.shop_slug}`) || undefined;
      const res = await fetch('/api/public/checkout', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariantId || undefined,
          buyer_email: email,
          quantity,
          coupon_code: appliedCoupon?.code,
          affiliate_code: affCode,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur');
      nav(`/checkout/${j.order_id}`);
    } catch (e: any) {
      toast('error', e.message);
      setBuying(false);
    }
  };

  const submitStockAlert = async () => {
    try {
      await fetch('/api/public/stock-alert', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, email: stockAlertEmail }),
      });
      setStockAlertSent(true);
      toast('success', 'Vous serez notifié dès le restock');
    } catch (e: any) { toast('error', e.message); }
  };

  if (error && !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
        <p className="text-white/60 mb-6">{error}</p>
        <Link to="/" className="px-5 py-2 bg-brand-purple rounded-lg">Retour</Link>
      </div>
    );
  }
  if (!product || !shopData) return <div className="min-h-screen flex items-center justify-center text-white/40">Chargement...</div>;

  const outOfStock = product.delivery_type === 'serials' && product.available_stock === 0;
  const lowStock = product.delivery_type === 'serials' && product.available_stock <= 5 && product.available_stock > 0;
  const maxQty = product.delivery_type === 'serials'
    ? Math.min(product.max_quantity || 10, product.available_stock || 0)
    : (product.max_quantity || 10);

  return (
    <ShopLayout shop={shopData.shop} pages={shopData.pages} hasBlog={shopData.has_blog}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to={`/s/${product.shop_slug}`} className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à {product.shop_name}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="glass-card aspect-square overflow-hidden mb-3" style={{ borderRadius: 'var(--shop-radius)' }}>
              {gallery[activeImage] ? (
                <motion.img key={activeImage}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  src={gallery[activeImage]} alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, var(--shop-primary)30, transparent)` }}>
                  <Package className="w-20 h-20 opacity-30" />
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${activeImage === i ? '' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={activeImage === i ? { borderColor: 'var(--shop-primary)' } : {}}>
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + Buy */}
          <div>
            <h1 className="text-3xl font-extrabold mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4 text-sm flex-wrap">
              {product.avg_rating ? (
                <Stars rating={product.avg_rating} size={16} showNumber count={product.review_count} />
              ) : <span className="opacity-40">Aucun avis</span>}
              {product.sales_count > 0 && (
                <span className="opacity-60">• <strong>{product.sales_count}</strong> vendus</span>
              )}
              {product.view_count > 0 && (
                <span className="opacity-40 flex items-center gap-1"><Eye className="w-3 h-3" /> {product.view_count} vues</span>
              )}
            </div>

            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--shop-primary)' }}>
              {formatPrice(unitPrice, product.currency)}
              {selectedVariant && <span className="text-sm opacity-50 ml-2">({selectedVariant.name})</span>}
            </div>

            <div className="text-xs opacity-50 mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <Users className="w-3 h-3" /> {watchers} personnes regardent ce produit
            </div>

            {product.description && (
              <p className="opacity-70 mb-6 whitespace-pre-line">{product.description}</p>
            )}

            {/* VARIANTS */}
            {variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Choisissez une option</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {variants.map((v: any) => (
                    <button key={v.id} onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition ${selectedVariantId === v.id ? 'text-white' : 'opacity-70 hover:opacity-100'}`}
                      style={selectedVariantId === v.id
                        ? { background: 'var(--shop-primary)', borderColor: 'var(--shop-primary)' }
                        : { borderColor: 'var(--shop-primary)40' }
                      }
                    >
                      <div>{v.name}</div>
                      <div className="text-xs mt-1 opacity-80">{formatPrice(v.price_cents, product.currency)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center gap-2 opacity-70"><Zap className="w-4 h-4 text-yellow-400" /> Livraison instantanée par email</div>
              <div className="flex items-center gap-2 opacity-70"><ShieldCheck className="w-4 h-4 text-green-400" /> Paiement 100% sécurisé</div>
              {product.delivery_type === 'serials' && product.available_stock !== null && (
                <div className="flex items-center gap-2 opacity-70">
                  <Package className="w-4 h-4 text-blue-400" />
                  {outOfStock ? <span className="text-red-400 font-medium">Rupture de stock</span> :
                   lowStock ? <span className="text-orange-400 font-medium">⚡ Plus que {product.available_stock} !</span> :
                   `${product.available_stock} en stock`}
                </div>
              )}
            </div>

            {!outOfStock && (
              <form onSubmit={buy} className="glass-card p-5" style={{ borderRadius: 'var(--shop-radius)' }}>
                {maxQty > 1 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Quantité</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg" disabled={quantity <= 1}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <input type="number" min={1} max={maxQty} value={quantity}
                        onChange={e => setQuantity(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
                        className="input text-center w-20" />
                      <button type="button" onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg" disabled={quantity >= maxQty}>
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs opacity-40 ml-2">Max. {maxQty}</span>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Code promo</label>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <Tag className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <div className="font-mono font-bold text-green-400">{appliedCoupon.code}</div>
                        <div className="text-xs opacity-60">
                          {appliedCoupon.discount_percent ? `-${appliedCoupon.discount_percent}%` : `-${formatPrice(appliedCoupon.discount_cents, product.currency)}`}
                        </div>
                      </div>
                      <button type="button" onClick={() => setAppliedCoupon(null)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Code promo (optionnel)" className="input flex-1 font-mono uppercase" />
                      <button type="button" onClick={applyCoupon} disabled={validatingCoupon || !couponInput.trim()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium disabled:opacity-50">
                        {validatingCoupon ? '...' : 'OK'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Votre email pour la livraison</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@email.com" className="input" />
                </div>

                <div className="border-t border-white/10 pt-3 mb-3">
                  {discount > 0 && (
                    <div className="flex justify-between text-sm opacity-60 mb-1">
                      <span>Sous-total</span><span>{formatPrice(baseTotal, product.currency)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-400 mb-1">
                      <span>Réduction ({appliedCoupon.code})</span><span>-{formatPrice(discount, product.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span><span style={{ color: 'var(--shop-primary)' }}>{formatPrice(total, product.currency)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={addToCart}
                    className="flex-1 px-4 py-3 rounded-xl font-bold border-2 hover:bg-white/5 transition flex items-center justify-center gap-2"
                    style={{ borderColor: 'var(--shop-primary)', color: 'var(--shop-primary)' }}>
                    <ShoppingCart className="w-4 h-4" /> Panier
                  </button>
                  <button type="submit" disabled={buying}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition disabled:opacity-50"
                    style={{ background: 'var(--shop-primary)', boxShadow: `0 0 30px var(--shop-primary)60` }}>
                    {buying ? '...' : `Acheter`}
                  </button>
                </div>
              </form>
            )}

            {outOfStock && (
              <div className="glass-card p-6">
                <p className="text-lg font-bold text-red-400 mb-2 text-center">😢 Rupture de stock</p>
                <p className="opacity-60 text-sm text-center mb-4">Soyez notifié dès le restock :</p>
                {stockAlertSent ? (
                  <p className="text-center text-green-400 text-sm">✓ Nous vous préviendrons dès que possible !</p>
                ) : (
                  <div className="flex gap-2">
                    <input type="email" value={stockAlertEmail} onChange={e => setStockAlertEmail(e.target.value)}
                      placeholder="vous@email.com" className="input flex-1" />
                    <button onClick={submitStockAlert} disabled={!stockAlertEmail}
                      className="px-4 py-2 rounded-lg font-bold text-white"
                      style={{ background: 'var(--shop-primary)' }}>
                      <BellRing className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-4">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} to={`/p/${r.id}`} className="glass-card overflow-hidden hover:scale-[1.02] transition">
                  <div className="aspect-video bg-white/5">
                    {r.image_url && <img src={r.image_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: 'var(--shop-primary)' }}>
                      {formatPrice(r.price_cents, r.currency)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-16 max-w-3xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Avis clients
            {reviews.length > 0 && <span className="opacity-40 text-sm font-normal">({reviews.length})</span>}
          </h2>
          {reviews.length === 0 ? (
            <p className="opacity-50">Aucun avis pour ce produit. Soyez le premier !</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {reviews.map((r: any) => (
                  <motion.div key={r.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'var(--shop-primary)' }}>
                          {r.buyer_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{r.buyer_email.replace(/(.{2}).*@/, '$1***@')}</div>
                          <Stars rating={r.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs opacity-40">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="text-sm opacity-80 mt-2">{r.comment}</p>}
                    {r.reply && (
                      <div className="mt-3 ml-10 pl-3 border-l-2" style={{ borderColor: 'var(--shop-primary)' }}>
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--shop-primary)' }}>Réponse du vendeur</div>
                        <p className="text-xs opacity-70">{r.reply}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
