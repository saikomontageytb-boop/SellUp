import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { Package, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getProduct(id).then(d => setProduct(d.product)).catch(e => setError(e.message));
  }, [id]);

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setBuying(true);
    try {
      const { order_id } = await api.checkout(product.id, email);
      nav(`/checkout/${order_id}`);
    } catch (e: any) { setError(e.message); setBuying(false); }
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
  if (!product) return <div className="min-h-screen flex items-center justify-center text-white/40">Chargement...</div>;

  const themeColor = product.theme_color || '#7C3AED';

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link to={`/s/${product.shop_slug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à {product.shop_name}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="glass-card aspect-square overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${themeColor}30, transparent)` }}>
                <Package className="w-20 h-20 text-white/30" />
              </div>
            )}
          </div>

          {/* Info + Buy */}
          <div>
            <h1 className="text-3xl font-extrabold mb-3">{product.name}</h1>
            <div className="text-3xl font-bold mb-6" style={{ color: themeColor }}>
              {formatPrice(product.price_cents, product.currency)}
            </div>
            {product.description && (
              <p className="text-white/70 mb-6 whitespace-pre-line">{product.description}</p>
            )}

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center gap-2 text-white/70"><Zap className="w-4 h-4 text-yellow-400" /> Livraison instantanée par email</div>
              <div className="flex items-center gap-2 text-white/70"><ShieldCheck className="w-4 h-4 text-green-400" /> Paiement 100% sécurisé</div>
            </div>

            <form onSubmit={buy} className="glass-card p-5">
              <label className="block text-sm font-medium mb-2">Votre email pour la livraison</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com" className="input mb-3" />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button type="submit" disabled={buying}
                className="w-full px-6 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition disabled:opacity-50"
                style={{ background: themeColor, boxShadow: `0 0 30px ${themeColor}60` }}>
                {buying ? 'Préparation...' : `Acheter pour ${formatPrice(product.price_cents, product.currency)}`}
              </button>
              <p className="text-xs text-white/40 text-center mt-3">
                En continuant, vous acceptez les conditions de vente.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
