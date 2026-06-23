import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { CheckCircle2, Copy, Mail, Star, MessageSquare } from 'lucide-react';
import { Confetti } from '../components/ui/Confetti';
import { StarsInput } from '../components/ui/Stars';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId).then(d => {
      setOrder(d.order);
      setTimeout(() => setShowConfetti(true), 200);
    }).catch(console.error);
  }, [orderId]);

  if (!order) return <div className="min-h-screen flex items-center justify-center text-white/40">Chargement...</div>;

  const copy = async () => {
    await navigator.clipboard.writeText(order.delivery_content || '');
    setCopied(true);
    toast('success', 'Copié dans le presse-papier');
    setTimeout(() => setCopied(false), 2000);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.submitReview(orderId!, rating, comment);
      setReviewSubmitted(true);
      toast('success', 'Merci pour votre avis ! ⭐');
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const isMultiple = order.delivery_content?.includes('\n');
  const lines = order.delivery_content?.split('\n').filter(Boolean) || [];

  return (
    <>
      <Confetti trigger={showConfetti} />
      <div className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Merci pour votre achat ! 🎉</h1>
            <p className="text-white/60 mb-6">
              Votre commande de <strong>{order.product_name}</strong>{order.quantity > 1 && <> (×{order.quantity})</>} a été confirmée.
            </p>

            <div className="bg-white/5 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-white/60">Montant payé</span>
                <span className="font-bold">{formatPrice(order.amount_cents, order.currency)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between text-green-400 text-xs">
                  <span>Code "{order.coupon_code}"</span>
                  <span>-{formatPrice(order.discount_cents || 0, order.currency)}</span>
                </div>
              )}
            </div>

            {order.delivery_content && (
              <div className="text-left mb-4">
                <p className="text-sm text-white/70 mb-2">
                  {isMultiple ? `Vos ${lines.length} livraisons :` : 'Votre livraison :'}
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 flex items-start gap-3">
                  <div className="flex-1 break-all font-mono text-sm whitespace-pre-line">
                    {order.delivery_type === 'discord' || (!isMultiple && order.delivery_content?.startsWith('http')) ? (
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
                {copied && <p className="text-xs text-green-400 mb-3">✓ Copié</p>}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-6">
              <Mail className="w-4 h-4" /> Copie envoyée à <strong>{order.buyer_email}</strong>
            </div>

            <div className="flex flex-col gap-2">
              {!showReviewForm && !reviewSubmitted && (
                <button onClick={() => setShowReviewForm(true)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Laisser un avis
                </button>
              )}
              <Link to={`/s/${order.shop_slug}`}
                className="inline-block px-6 py-2.5 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
                Retour à la boutique
              </Link>
            </div>
          </motion.div>

          {/* Review form */}
          {showReviewForm && !reviewSubmitted && (
            <motion.form
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={submitReview}
              className="glass-card p-6 mt-4"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Votre avis
              </h3>
              <div className="mb-3">
                <label className="block text-sm text-white/70 mb-2">Note</label>
                <StarsInput value={rating} onChange={setRating} />
              </div>
              <div className="mb-3">
                <label className="block text-sm text-white/70 mb-2">Commentaire (optionnel)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  className="input" placeholder="Comment s'est passée votre expérience ?" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm">Annuler</button>
                <button type="submit" disabled={submittingReview}
                  className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50 text-sm">
                  {submittingReview ? '...' : 'Publier l\'avis'}
                </button>
              </div>
            </motion.form>
          )}
          {reviewSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 mt-4 text-center text-sm text-green-400"
            >
              ⭐ Merci d'avoir partagé votre expérience !
            </motion.div>
          )}

          <p className="text-center text-xs text-white/30 mt-6">
            Commande #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </>
  );
}
