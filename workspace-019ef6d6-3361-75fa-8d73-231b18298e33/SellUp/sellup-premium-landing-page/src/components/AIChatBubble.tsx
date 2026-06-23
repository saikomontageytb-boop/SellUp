import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'sellup_ai_chat';
const SUGGESTIONS = [
  'Que recommandes-tu pour booster mes ventes ?',
  'Analyse mes 7 derniers jours',
  'Mes prix sont-ils bien calibrés ?',
  'Donne-moi une idée de code promo',
];

export function AIChatBubble() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      api.aiQuota().then(q => setQuota({ used: q.used, limit: q.limit })).catch(() => {});
    }
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    try {
      const r = await api.aiChat(newMessages);
      setMessages(m => [...m, { role: 'assistant', content: r.message }]);
      if (r.quota) setQuota({ used: r.quota.used, limit: r.quota.limit });
    } catch (e: any) {
      toast('error', e.message);
      setMessages(m => [...m, { role: 'assistant', content: '❌ ' + e.message }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearHistory = () => {
    if (!confirm('Effacer toute la conversation ?')) return;
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-indigo shadow-2xl shadow-brand-purple/40 flex items-center justify-center group"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            {messages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-black animate-pulse" />
            )}
            <div className="absolute inset-0 rounded-full bg-brand-purple opacity-0 group-hover:opacity-30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-3rem)] glass-card border border-brand-purple/30 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-brand-purple/20 to-brand-indigo/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-indigo flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    Assistant IA
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-purple/30 text-white font-bold">BETA</span>
                  </div>
                  <div className="text-[10px] text-white/50">
                    {quota ? `${quota.used}/${quota.limit} requêtes aujourd'hui` : 'Connecté'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clearHistory} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-red-400" title="Effacer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-indigo/30 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-brand-purple" />
                  </div>
                  <h4 className="font-bold mb-1">Bonjour 👋</h4>
                  <p className="text-xs text-white/50 mb-4">Je connais ta boutique et je peux t'aider à l'optimiser. Pose-moi tes questions !</p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => send(s)}
                        className="w-full text-left px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition"
                      >
                        💬 {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-brand-purple text-white rounded-br-sm'
                        : 'bg-white/5 border border-white/10 rounded-bl-sm'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))
              )}
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                    <span className="text-xs text-white/50">L'IA réfléchit...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={e => { e.preventDefault(); send(input); }}
              className="p-3 border-t border-white/10 bg-white/[0.02]"
            >
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Pose ta question..."
                  disabled={sending}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-purple disabled:opacity-50 max-h-24"
                  style={{ minHeight: 38 }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-brand-purple hover:scale-105 transition disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-white/30 text-center mt-1.5">
                Llama 3.3 70B • Cloudflare Workers AI
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
