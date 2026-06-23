import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glows */}
      <div className="purple-glow w-[500px] h-[500px] -top-20 -left-20 opacity-30" />
      <div className="indigo-glow w-[500px] h-[500px] top-40 -right-20 opacity-20" />
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-brand-purple animate-pulse" />
            <span className="text-sm font-medium text-white/80">⚡ +10 000 vendeurs nous font confiance</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] mb-6">
            <span className="text-gradient">Vendez vos produits</span><br />
            <span className="bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">en ligne, sans limite.</span>
          </h1>
          
          <p className="text-xl text-white/60 mb-10 max-w-xl leading-relaxed">
            La plateforme SaaS tout-en-un pour gérer vos abonnements, fichiers, licences et bien plus. Une interface moderne conçue pour la conversion.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-brand-purple rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2">
              Lancer ma boutique
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 glass rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Voir la démo
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: -5 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative hidden lg:block"
        >
          {/* Main Mockup */}
          <div className="relative z-10 glass-card p-4 aspect-[4/3] w-full transform rotate-6 hover:rotate-2 transition-transform duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="h-full w-full bg-[#0C0C14] rounded-lg border border-white/5 overflow-hidden">
                {/* Simulated UI */}
                <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="w-32 h-4 bg-white/5 rounded-full" />
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 glass rounded-xl" />
                        ))}
                    </div>
                    <div className="h-48 glass rounded-xl w-full" />
                </div>
            </div>
          </div>

          {/* Floating Cards */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 z-20 glass-card p-4 w-48 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 text-lg">+$</span>
                </div>
                <div>
                    <div className="text-xs text-white/50">Vente réussie</div>
                    <div className="font-bold">49.00 €</div>
                </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 z-20 glass-card p-4 w-56 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded bg-brand-purple" />
                </div>
                <span className="text-sm font-semibold">Nouveau client</span>
            </div>
            <div className="text-xs text-white/40">thomas@example.com</div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10 bg-brand-purple/20 blur-[100px] rounded-full" />
          
          <motion.div
            animate={{ 
                y: [0, 15, 0],
                rotate: [0, 10, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 left-20 w-12 h-12 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"
          >
            <div className="w-6 h-6 bg-brand-purple rounded-md opacity-50" />
          </motion.div>

          <motion.div
            animate={{ 
                y: [0, -25, 0],
                rotate: [0, -15, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 -right-12 w-16 h-16 bg-white/5 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl"
          >
            <div className="w-8 h-8 bg-brand-indigo rounded-full opacity-40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
