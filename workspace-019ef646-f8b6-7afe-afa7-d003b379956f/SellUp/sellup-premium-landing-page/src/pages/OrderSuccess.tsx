import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { CheckCircle2, Copy, Mail } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId).then(d => setOrder(d.order)).catch(console.error);
  }, [orderId]);

  if (!order) return <div className="min-h-screen flex items-center justify-center text-white/40">Chargement...</div>;

  const copy = async () => {
    await navigator.clipboard.writeText(order.delivery_content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Merci pour votre achat !</h1>
          <p className="text-white/60 mb-6">
            Votre commande de <strong>{order.product_name}</strong> pour {formatPrice(order.amount_cents, order.currency)} a été confirmée.
          </p>

          {order.delivery_content && (
            <div className="text-left">
              <p className="text-sm text-white/70 mb-2">Votre livraison :</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 flex items-start gap-3">
                <div className="flex-1 break-all font-mono text-sm">
                  {order.delivery_type === 'discord' || order.delivery_content?.startsWith('http') ? (
                    <a href={order.delivery_content} target="_blank" rel="noopener" className="text-brand-purple underline">
                      {order.delivery_content}
                    </a>
                  ) : (
                    <span>{order.delivery_content}</span>
                  )}
                </div>
                <button onClick={copy} className="p-2 hover:bg-white/10 rounded-lg shrink-0" title="Copier">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mb-3">✓ Copié dans le presse-papier</p>}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-6">
            <Mail className="w-4 h-4" /> Une copie a été envoyée à <strong>{order.buyer_email}</strong>
          </div>

          <Link to={`/s/${order.shop_slug}`}
            className="inline-block px-6 py-2.5 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
            Retour à la boutique
          </Link>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Commande #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
}
