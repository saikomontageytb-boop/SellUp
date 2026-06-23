import { motion } from 'framer-motion';
import { Store, PackagePlus, Wallet } from 'lucide-react';

const steps = [
  {
    title: "Créez votre boutique",
    description: "Configurez votre espace de vente en moins de 2 minutes avec votre propre nom de domaine.",
    icon: Store,
  },
  {
    title: "Ajoutez vos produits",
    description: "Uploadez vos fichiers, générez des licences ou configurez vos accès abonnés.",
    icon: PackagePlus,
  },
  {
    title: "Recevez vos paiements",
    description: "L'argent arrive directement sur votre compte Stripe ou PayPal. Sans intermédiaire.",
    icon: Wallet,
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-32 relative overflow-hidden">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-purple/20 to-transparent hidden lg:block" />
        
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Comment ça marche ?</h2>
                <p className="text-xl text-white/60">Trois étapes simples pour commencer à vendre dès aujourd'hui.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 relative">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="relative z-10 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-purple to-brand-indigo flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(124,58,237,0.3)] relative">
                            <step.icon className="w-10 h-10 text-white" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-black border-4 border-brand-purple flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                        <p className="text-white/60 text-lg leading-relaxed max-w-sm">
                            {step.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
  );
};
