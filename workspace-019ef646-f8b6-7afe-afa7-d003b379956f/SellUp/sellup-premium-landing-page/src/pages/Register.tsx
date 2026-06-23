import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await register(email, password); nav('/dashboard'); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="purple-glow w-[500px] h-[500px] top-1/4 -left-40 opacity-30" />
      <div className="indigo-glow w-[500px] h-[500px] bottom-1/4 -right-40 opacity-20" />

      <div className="w-full max-w-md glass-card p-8 relative z-10">
        <Link to="/" className="text-sm text-white/50 hover:text-white mb-6 inline-block">← Retour</Link>
        <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/30 rounded-full px-3 py-1 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
          <span className="text-xs font-medium">Gratuit pour commencer</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Lancez votre boutique</h1>
        <p className="text-white/60 mb-8">Créez votre compte vendeur en 30 secondes</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-purple transition"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Mot de passe (6 caractères min)</label>
            <input
              type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-purple transition"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full px-6 py-3 bg-brand-purple rounded-xl font-bold hover:scale-[1.02] transition disabled:opacity-50 shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? 'Création...' : <>Créer ma boutique <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-white/60 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-brand-purple hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
