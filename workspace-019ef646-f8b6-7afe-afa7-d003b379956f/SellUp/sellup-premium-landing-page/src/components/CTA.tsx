import { motion } from 'framer-motion';

export const CTA = () => {
  return (
    <section className="py-32 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto glass-card bg-gradient-to-br from-brand-purple/20 via-brand-indigo/10 to-transparent p-12 md:p-24 rounded-[3rem] text-center relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
            Prêt à lancer <br />
            <span className="text-gradient">ta boutique ?</span>
          </h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Rejoignez plus de 10 000 créateurs et commencez à vendre vos produits numériques en quelques minutes seulement.
          </p>
          <button className="px-12 py-6 bg-white text-brand-black rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl hover:shadow-white/20">
            Commencer maintenant — C'est gratuit
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-brand-purple blur-[120px] opacity-20" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-brand-indigo blur-[120px] opacity-20" />
        </div>
      </motion.div>
    </section>
  );
};
