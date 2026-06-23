// Placeholder for Navbar.tsx
import { Menu, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl glass h-16 rounded-full px-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight">SellUp</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-1 text-sm font-medium hover:text-white transition-colors text-white/70">
            <Globe className="w-4 h-4" />
            <span>FR</span>
          </button>
          <button className="hidden md:block text-sm font-medium hover:text-white transition-colors text-white/70">
            Se connecter
          </button>
          <button className="bg-brand-purple hover:bg-brand-purple/90 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            Commencer
          </button>
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </nav>
  );
};
