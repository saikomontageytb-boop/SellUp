import { motion } from 'framer-motion';
import { CreditCard, Zap, ShieldCheck, Globe, BarChart3, MessageSquare } from 'lucide-react';

const features = [
  {
    title: "Paiements automatiques",
    description: "Acceptez des paiements du monde entier en quelques minutes grâce à nos intégrations natives.",
    icon: CreditCard,
    color: "text-blue-400",
    glow: "group-hover:shadow-blue-500/20"
  },
  {
    title: "Livraison instantanée",
    description: "Vos clients reçoivent leurs fichiers, licences ou accès Discord immédiatement après l'achat.",
    icon: Zap,
    color: "text-yellow-400",
    glow: "group-hover:shadow-yellow-500/20"
  },
  {
    title: "Protection Anti-fraude",
    description: "Système avancé de détection de fraudes et blocage de VPN pour sécuriser vos revenus.",
    icon: ShieldCheck,
    color: "text-green-400",
    glow: "group-hover:shadow-green-500/20"
  },
  {
    title: "Multi-devises",
    description: "Vendez dans plus de 135 devises. Conversion automatique au taux du marché en temps réel.",
    icon: Globe,
    color: "text-purple-400",
    glow: "group-hover:shadow-purple-500/20"
  },
  {
    title: "Analytics Avancés",
    description: "Suivez vos revenus, taux de conversion et comportement client via un dashboard intuitif.",
    icon: BarChart3,
    color: "text-red-400",
    glow: "group-hover:shadow-red-500/20"
  },
  {
    title: "Intégration Discord",
    description: "Gérez vos rôles et accès Discord automatiquement après chaque abonnement ou achat.",
    icon: MessageSquare,
    color: "text-indigo-400",
    glow: "group-hover:shadow-indigo-500/20"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Tout ce dont vous avez besoin
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            Une suite d'outils puissants conçus pour scaler votre business numérique sans aucune barrière technique.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`group glass-card p-8 hover:translate-y-[-4px] transition-all duration-300 ${feature.glow}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 ${feature.color} border border-white/10 group-hover:border-white/20 group-hover:scale-110 transition-all`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
