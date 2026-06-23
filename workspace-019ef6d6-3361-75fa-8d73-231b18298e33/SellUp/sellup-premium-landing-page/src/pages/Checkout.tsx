import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CreditCard, Bitcoin, Lock, AlertCircle } from 'lucide-react';

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const nav = useNavigate();
  const [method, setMethod] = useState<'card' | 'crypto'>('card');
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState('');

  const pay = async () => {
    if (!orderId) return;
    setPaying(true); setErr('');
    try {
      await api.payOrder(orderId);
      nav(`/order/${orderId}`);
    } catch (e: any) { setErr(e.message); setPaying(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="text-sm text-white/50 hover:text-white mb-4 inline-block">← Annuler</Link>

        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold mb-1">Paiement</h1>
          <p className="text-white/60 text-sm mb-6 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Connexion sécurisée
          </p>

          <div className="mb-6">
            <p className="text-sm text-white/70 mb-2">Choisissez votre moyen de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMethod('card')}
                className={`p-4 rounded-xl border transition ${method === 'card' ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10 hover:bg-white/5'}`}>
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Carte</div>
              </button>
              <button onClick={() => setMethod('crypto')}
                className={`p-4 rounded-xl border transition ${method === 'crypto' ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10 hover:bg-white/5'}`}>
                <Bitcoin className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Crypto</div>
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 flex items-start gap-2 text-xs text-yellow-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Mode démo :</strong> Aucun paiement réel n'est traité. Cliquer sur "Payer" simule un paiement réussi et déclenche la livraison.
            </div>
          </div>

          {method === 'card' && (
            <div className="space-y-3 mb-4">
              <input className="input" placeholder="Numéro de carte" disabled />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="MM/AA" disabled />
                <input className="input" placeholder="CVC" disabled />
              </div>
            </div>
          )}
          {method === 'crypto' && (
            <div className="text-sm text-white/60 mb-4 p-4 bg-white/5 rounded-lg text-center">
              [Adresse de wallet apparaîtrait ici en production]
            </div>
          )}

          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <button onClick={pay} disabled={paying}
            className="w-full px-6 py-3 bg-brand-purple rounded-xl font-bold hover:scale-[1.02] transition disabled:opacity-50">
            {paying ? 'Traitement...' : 'Payer (démo)'}
          </button>
        </div>
      </div>
    </div>
  );
}
