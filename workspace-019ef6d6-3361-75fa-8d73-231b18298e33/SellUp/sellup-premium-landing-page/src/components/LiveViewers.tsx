import { useEffect, useState } from 'react';
import { Eye, ShoppingCart, Package } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewerStats {
  total: number;
  on_shop: number;
  on_product: number;
  on_checkout: number;
}

export function LiveViewers() {
  const [stats, setStats] = useState<ViewerStats>({ total: 0, on_shop: 0, on_product: 0, on_checkout: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await api.viewerCount();
        setStats({
          total: r.total || 0,
          on_shop: r.on_shop || 0,
          on_product: r.on_product || 0,
          on_checkout: r.on_checkout || 0,
        });
      } catch {}
    };
    fetch();
    const i = setInterval(fetch, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 mb-6 border border-brand-purple/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="block w-3 h-3 rounded-full bg-green-400" />
            <span className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={stats.total}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="tabular-nums"
                >
                  {stats.total}
                </motion.span>
              </AnimatePresence>
              {' '}
              {stats.total === 1 ? 'visiteur en ligne' : 'visiteurs en ligne'}
            </h3>
            <p className="text-xs text-white/40">Mis à jour toutes les 10s</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ViewerBubble icon={Eye} label="Boutique" value={stats.on_shop} color="text-blue-400" />
        <ViewerBubble icon={Package} label="Produits" value={stats.on_product} color="text-purple-400" />
        <ViewerBubble icon={ShoppingCart} label="Checkout" value={stats.on_checkout} color="text-green-400" />
      </div>
    </motion.div>
  );
}

function ViewerBubble({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className="text-xl font-bold tabular-nums">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="text-[10px] text-white/40 mt-1">{label}</div>
    </div>
  );
}
