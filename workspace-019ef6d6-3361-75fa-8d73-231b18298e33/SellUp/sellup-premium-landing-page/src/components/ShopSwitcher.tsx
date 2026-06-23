import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronDown, ExternalLink, Plus, Crown, Check, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useToast } from './ui/Toast';

export function ShopSwitcher() {
  const { shop, shops, plan, limit, switchShop, createShop } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  if (!shop) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const s = await createShop(name.trim());
      setName(''); setShowCreate(false); setOpen(false);
      await switchShop(s.id);
      toast('success', `Boutique "${s.name}" créée 🎉`);
      window.location.reload();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = async (id: string) => {
    if (id === shop.id) { setOpen(false); return; }
    await switchShop(id);
    setOpen(false);
    window.location.reload();
  };

  const isFull = shops.length >= limit;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition group"
      >
        <div className="w-8 h-8 rounded-md bg-brand-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
          {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover" alt="" /> : <Store className="w-4 h-4 text-brand-purple" />}
        </div>
        <span className="flex-1 text-left text-sm font-semibold truncate">{shop.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition ${open ? 'rotate-180' : ''}`} />
        <a
          href={`/s/${shop.slug}`}
          target="_blank"
          rel="noopener"
          onClick={e => e.stopPropagation()}
          className="p-1 hover:bg-white/10 rounded"
          title="Voir la boutique"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white/50" />
        </a>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#13131A] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-72 overflow-y-auto p-1.5">
              {shops.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => handleSwitch(s.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition ${s.id === shop.id ? 'bg-brand-purple/20' : 'hover:bg-white/5'}`}
                >
                  <div className="w-7 h-7 rounded-md bg-brand-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" alt="" /> : <Store className="w-3.5 h-3.5 text-brand-purple" />}
                  </div>
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  {s.id === shop.id && <Check className="w-3.5 h-3.5 text-brand-purple" />}
                  {plan === 'pro' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                </button>
              ))}
            </div>
            <div className="border-t border-white/5 p-1.5">
              {!showCreate ? (
                <button
                  onClick={() => isFull ? toast('error', `Limite ${limit} boutiques atteinte. Passez Pro pour 5.`) : setShowCreate(true)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition ${isFull ? 'text-white/30' : 'text-white/70 hover:bg-white/5'}`}
                >
                  {isFull ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isFull ? `Limite atteinte (${shops.length}/${limit})` : `Créer une nouvelle boutique`}
                  {!isFull && <span className="ml-auto text-xs text-white/40">{shops.length}/{limit}</span>}
                </button>
              ) : (
                <div className="p-1.5 space-y-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nom de la boutique"
                    className="input text-sm"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => { setShowCreate(false); setName(''); }} className="flex-1 px-2 py-1.5 text-xs rounded hover:bg-white/5">Annuler</button>
                    <button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1 px-2 py-1.5 text-xs rounded bg-brand-purple disabled:opacity-50">
                      {creating ? '...' : 'Créer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {plan === 'free' && (
              <Link to="/dashboard?tab=billing" className="block border-t border-white/5 p-2.5 text-xs text-center hover:bg-white/5 text-white/60">
                <Crown className="w-3.5 h-3.5 inline text-yellow-400 mr-1" />
                Passez <strong className="text-yellow-400">Pro</strong> pour 5 boutiques
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
