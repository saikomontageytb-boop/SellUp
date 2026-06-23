import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Pour tester et lancer votre première boutique.",
    features: ["Paiements Stripe & PayPal", "Produits illimités", "1% de frais de transaction", "Support communautaire"],
    popular: false
  },
  {
    name: "Pro",
    price: "29",
    description: "Le meilleur choix pour les vendeurs en croissance.",
    features: ["Tout du plan Starter", "0.5% de frais de transaction", "Domaine personnalisé", "Support prioritaire 24/7"],
    popular: true
  },
  {
    name: "Business",
    price: "99",
    description: "Pour les entreprises et les gros volumes.",
    features: ["Tout du plan Pro", "0% de frais de transaction", "API dédiée", "Account Manager dédié"],
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Tarifs simples et transparents</h2>
          <p className="text-xl text-white/60">Pas de frais cachés, choisissez le plan qui vous correspond.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-card p-10 flex flex-col ${plan.popular ? 'border-brand-purple/50 bg-brand-purple/5 shadow-[0_0_40px_rgba(124,58,237,0.1)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Populaire
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{plan.price}€</span>
                <span className="text-white/40">/mois</span>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-purple/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-purple" />
                    </div>
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-brand-purple hover:bg-brand-purple/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]' : 'glass hover:bg-white/10'}`}>
                Choisir ce plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
