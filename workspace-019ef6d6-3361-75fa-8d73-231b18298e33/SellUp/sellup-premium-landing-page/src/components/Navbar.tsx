// Placeholder for Navbar.tsx
import { Menu, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export const Navbar = () => {
  const { user } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl glass h-16 rounded-full px-6 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo/logo-256.png" alt="SellUp" className="w-9 h-9 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight">SellUp</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="/#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="/#pricing" className="hover:text-white transition-colors">Tarifs</a>
          <Link to="/demo" className="hover:text-white transition-colors">Démo</Link>
          <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-1 text-sm font-medium hover:text-white transition-colors text-white/70">
            <Globe className="w-4 h-4" />
            <span>FR</span>
          </button>
          {user ? (
            <Link to="/dashboard" className="bg-brand-purple hover:bg-brand-purple/90 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Mon dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden md:block text-sm font-medium hover:text-white transition-colors text-white/70">
                Se connecter
              </Link>
              <Link to="/register" className="bg-brand-purple hover:bg-brand-purple/90 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                Commencer
              </Link>
            </>
          )}
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </nav>
  );
};
