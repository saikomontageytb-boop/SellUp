import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <div className="purple-glow w-[500px] h-[500px] top-1/4 -left-40 opacity-20" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <div className="text-[120px] font-extrabold leading-none bg-gradient-to-br from-brand-purple to-brand-indigo bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-white/60 mb-8 max-w-md">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="px-6 py-2.5 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
            Retour à l'accueil
          </Link>
          <Link to="/demo" className="px-6 py-2.5 glass rounded-lg font-medium hover:bg-white/10 transition">
            Essayer la démo
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
