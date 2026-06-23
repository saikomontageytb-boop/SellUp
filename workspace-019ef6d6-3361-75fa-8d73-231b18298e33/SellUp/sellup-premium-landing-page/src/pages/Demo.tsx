import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Demo() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true); setError('');
    try {
      const r = await api.demoSeed();
      setToken(r.token);
      await refresh();
      // Open shop in new tab + go to dashboard
      window.open(`/s/${r.shop.slug}`, '_blank');
      nav('/dashboard');
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="purple-glow w-[600px] h-[600px] top-1/4 -left-40 opacity-30" />
      <div className="indigo-glow w-[600px] h-[600px] bottom-1/4 -right-40 opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl glass-card p-10 text-center relative z-10"
      >
        <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/30 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-sm font-medium">Démo interactive</span>
        </div>

        <h1 className="text-4xl font-extrabold mb-3">
          Testez SellUp <span className="text-gradient">en 1 clic</span>
        </h1>
        <p className="text-white/60 mb-8">
          On crée pour vous une boutique de démo remplie de vrais produits, codes promo, avis... pour que vous puissiez explorer toutes les fonctionnalités immédiatement.
        </p>

        <div className="space-y-3 text-left mb-8 text-sm">
          <Item>🎮 6 produits digitaux pré-remplis (clés Steam, Discord, etc.)</Item>
          <Item>🔑 Stock de clés/serials déjà chargé</Item>
          <Item>🏷️ Code promo "WEEKEND20" actif</Item>
          <Item>⭐ Un avis client de démo</Item>
          <Item>📣 Bannière d'annonce configurée</Item>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={start} disabled={loading}
          className="w-full px-8 py-4 bg-brand-purple rounded-xl font-bold text-lg hover:scale-[1.02] transition shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Création de votre démo...</>
          ) : (
            <>Lancer la démo <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        <p className="text-xs text-white/40 mt-4">
          Un compte temporaire sera créé. Aucune carte requise.
        </p>
      </motion.div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2 shrink-0" />
      <span className="text-white/80">{children}</span>
    </div>
  );
}
