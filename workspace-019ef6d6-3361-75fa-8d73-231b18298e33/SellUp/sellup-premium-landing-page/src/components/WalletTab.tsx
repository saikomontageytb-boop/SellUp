import { useEffect, useState } from 'react';
import { Wallet, CreditCard, Bitcoin, Download, ArrowDownToLine, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api, formatPrice, timeAgo } from '../lib/api';
import { useToast } from './ui/Toast';
import { motion } from 'framer-motion';

const METHOD_META: Record<string, { name: string; icon: any; color: string; bg: string; destLabel: string; destPlaceholder: string }> = {
  stripe: {
    name: 'Stripe (Carte)',
    icon: CreditCard,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    destLabel: 'IBAN du compte bancaire',
    destPlaceholder: 'FR76 1234 5678 9012 3456 7890 123',
  },
  paypal: {
    name: 'PayPal',
    icon: () => <span className="font-extrabold text-base">𝙋</span>,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    destLabel: 'Email PayPal',
    destPlaceholder: 'vous@paypal.com',
  },
  crypto: {
    name: 'Crypto (BTC/USDT)',
    icon: Bitcoin,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    destLabel: 'Adresse wallet',
    destPlaceholder: 'bc1q... ou 0x...',
  },
};

export function WalletTab() {
  const toast = useToast();
  const [data, setData] = useState<{ balances: any[]; withdrawals: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawFor, setWithdrawFor] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getBalance();
      setData(r);
    } catch (e: any) { toast('error', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) return <div className="text-white/40 text-center py-20">Chargement...</div>;

  const totalAvailable = data.balances.reduce((s, b) => s + (b.available_cents || 0), 0);
  const totalPending = data.balances.reduce((s, b) => s + (b.pending_cents || 0), 0);
  const totalEarned = data.balances.reduce((s, b) => s + (b.total_earned_cents || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Wallet className="w-7 h-7 text-brand-purple" />
        <h2 className="text-2xl font-bold">Solde & Retraits</h2>
      </div>
      <p className="text-white/60 mb-6">Suivez vos revenus et retirez votre argent vers la méthode de votre choix</p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border border-green-500/20"
        >
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">💰 Disponible</div>
          <div className="text-3xl font-extrabold text-green-400">{formatPrice(totalAvailable)}</div>
          <div className="text-xs text-white/40 mt-1">À retirer maintenant</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">⏳ En attente</div>
          <div className="text-3xl font-extrabold text-yellow-400">{formatPrice(totalPending)}</div>
          <div className="text-xs text-white/40 mt-1">Retraits en cours</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">📊 Total gagné</div>
          <div className="text-3xl font-extrabold">{formatPrice(totalEarned)}</div>
          <div className="text-xs text-white/40 mt-1">Depuis le début</div>
        </motion.div>
      </div>

      {/* Balances per method */}
      <h3 className="font-bold mb-3 text-white/80">Solde par moyen de paiement</h3>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {data.balances.map((b: any) => {
          const meta = METHOD_META[b.method];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <motion.div
              key={b.method}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-5 border ${meta.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-white/50">{meta.name}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{formatPrice(b.available_cents || 0)}</div>
              <div className="text-xs text-white/40 mb-3">
                {b.pending_cents > 0 && <>+{formatPrice(b.pending_cents)} en attente · </>}
                Total: {formatPrice(b.total_earned_cents || 0)}
              </div>
              <button
                onClick={() => setWithdrawFor(b)}
                disabled={(b.available_cents || 0) < 1000}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${(b.available_cents || 0) >= 1000 ? 'bg-brand-purple hover:scale-[1.02]' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                {(b.available_cents || 0) >= 1000 ? 'Retirer' : 'Min. 10 €'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Withdrawals history */}
      <h3 className="font-bold mb-3 text-white/80">Historique des retraits</h3>
      {data.withdrawals.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Download className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-white/60 text-sm">Aucun retrait pour le moment</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/60">
                <th className="p-3">Date</th>
                <th className="p-3">Méthode</th>
                <th className="p-3">Montant</th>
                <th className="p-3 hidden sm:table-cell">Destination</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.withdrawals.map((w: any) => {
                const meta = METHOD_META[w.method];
                return (
                  <tr key={w.id} className="border-t border-white/5">
                    <td className="p-3 text-white/50 text-xs">{timeAgo(w.created_at)}</td>
                    <td className="p-3">{meta?.name || w.method}</td>
                    <td className="p-3 font-bold">
                      {formatPrice(w.amount_cents, w.currency)}
                      {w.fee_cents > 0 && <div className="text-[10px] text-white/40">-{formatPrice(w.fee_cents)} frais</div>}
                    </td>
                    <td className="p-3 hidden sm:table-cell font-mono text-xs text-white/50 truncate max-w-[200px]">{w.destination}</td>
                    <td className="p-3">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {withdrawFor && (
        <WithdrawModal
          balance={withdrawFor}
          meta={METHOD_META[withdrawFor.method]}
          onClose={() => setWithdrawFor(null)}
          onDone={() => { setWithdrawFor(null); load(); toast('success', 'Retrait demandé ✓'); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: any = {
    pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    processing: { label: 'En cours', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
    completed: { label: 'Effectué', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
    rejected: { label: 'Refusé', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  };
  const c = cfg[status] || cfg.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.color}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
}

function WithdrawModal({ balance, meta, onClose, onDone }: any) {
  const toast = useToast();
  const max = balance.available_cents || 0;
  const [amount, setAmount] = useState((max / 100).toFixed(2));
  const [destination, setDestination] = useState('');
  const [saving, setSaving] = useState(false);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);
  const fee = Math.round(amountCents * 0.02);
  const net = amountCents - fee;
  const Icon = meta.icon;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountCents < 1000) return toast('error', 'Minimum 10 €');
    if (amountCents > max) return toast('error', 'Montant supérieur au solde');
    if (!destination.trim()) return toast('error', `${meta.destLabel} requis`);
    setSaving(true);
    try {
      await api.requestWithdrawal(balance.method, amountCents, destination.trim());
      onDone();
    } catch (e: any) {
      toast('error', e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Retrait via {meta.name}</h3>
            <p className="text-xs text-white/50">Solde disponible : {formatPrice(max)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Montant (€)</label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" min="10" max={max / 100}
                value={amount} onChange={e => setAmount(e.target.value)}
                className="input flex-1" required
              />
              <button type="button" onClick={() => setAmount((max / 100).toFixed(2))}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                MAX
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">{meta.destLabel}</label>
            <input
              value={destination} onChange={e => setDestination(e.target.value)}
              placeholder={meta.destPlaceholder}
              className="input font-mono text-sm" required
            />
          </div>

          {amountCents >= 1000 && (
            <div className="bg-white/5 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-white/60">Montant brut</span><span>{formatPrice(amountCents)}</span></div>
              <div className="flex justify-between text-orange-400"><span>Frais (2%)</span><span>-{formatPrice(fee)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-white/10"><span>Vous recevrez</span><span className="text-green-400">{formatPrice(net)}</span></div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
          <button type="submit" disabled={saving || amountCents < 1000 || amountCents > max}
            className="px-5 py-2 bg-brand-purple rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            {saving ? '...' : `Retirer ${formatPrice(amountCents)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
