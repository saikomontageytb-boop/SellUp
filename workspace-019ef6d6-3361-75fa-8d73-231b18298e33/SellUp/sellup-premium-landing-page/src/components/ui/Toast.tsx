import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }

const Ctx = createContext<{ push: (kind: ToastKind, message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`glass-card px-4 py-3 pr-10 max-w-sm flex items-center gap-3 pointer-events-auto relative ${
                t.kind === 'success' ? 'border-green-500/30' :
                t.kind === 'error' ? 'border-red-500/30' : 'border-blue-500/30'
              }`}
            >
              {t.kind === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
              {t.kind === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {t.kind === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
              <span className="text-sm">{t.message}</span>
              <button
                onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}
                className="absolute right-2 top-2 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.push;
}
