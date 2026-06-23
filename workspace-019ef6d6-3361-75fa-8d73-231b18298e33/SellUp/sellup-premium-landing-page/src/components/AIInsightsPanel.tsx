import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, FileText, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

type Insight = {
  type: 'alert' | 'suggestion' | 'explanation';
  title: string;
  message: string;
  action?: string;
};

const STYLES = {
  alert: {
    icon: AlertTriangle,
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    label: 'Alerte',
  },
  suggestion: {
    icon: Lightbulb,
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    label: 'Suggestion',
  },
  explanation: {
    icon: FileText,
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    label: 'Insight',
  },
};

export function AIInsightsPanel() {
  const toast = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cached, setCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  const load = async (force = false) => {
    try {
      if (force) {
        setRefreshing(true);
        await api.aiInsightsRefresh();
      } else {
        setLoading(true);
      }
      const r = await api.aiInsights();
      setInsights(r.insights || []);
      setCached(r.cached);
      setGeneratedAt(r.generated_at);
      if (r.quota) setQuota({ used: r.quota.used, limit: r.quota.limit });
      // Refresh quota separately too
      try {
        const q = await api.aiQuota();
        setQuota({ used: q.used, limit: q.limit });
      } catch {}
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(false); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 mb-6 border border-brand-purple/30 relative overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-indigo/10" />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-indigo flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!loading && !refreshing && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-lg bg-brand-purple"
              />
            )}
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              Assistant IA
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple font-bold">BETA</span>
            </h3>
            <p className="text-xs text-white/40">
              {loading ? 'Analyse en cours...' :
               refreshing ? 'Actualisation...' :
               cached && generatedAt ? `Généré ${timeAgoShort(generatedAt)}` : 'Insights frais'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {quota && (
            <div className="text-xs text-white/40">
              {quota.used}/{quota.limit} req. aujourd'hui
            </div>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 transition"
            title="Régénérer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
          Ajoutez quelques produits et commandes pour obtenir des insights pertinents.
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, i) => (
              <InsightCard key={`${generatedAt}-${i}`} insight={insight} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const style = STYLES[insight.type] || STYLES.explanation;
  const Icon = style.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`rounded-lg p-4 border ${style.border} ${style.bg}`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] uppercase tracking-wider font-bold ${style.iconColor} mb-0.5`}>{style.label}</div>
          <div className="font-bold text-sm leading-tight">{insight.title}</div>
        </div>
      </div>
      <p className="text-xs text-white/70 leading-relaxed">{insight.message}</p>
      {insight.action && (
        <div className={`mt-3 pt-3 border-t border-white/5 text-xs font-medium ${style.iconColor}`}>
          → {insight.action}
        </div>
      )}
    </motion.div>
  );
}

function timeAgoShort(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  return `il y a ${h}h`;
}
