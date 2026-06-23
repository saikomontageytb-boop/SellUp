import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "Quels types de produits puis-je vendre ?",
    answer: "Absolument tout ce qui est numérique : fichiers (PDF, ZIP, images), accès à des serveurs Discord, clés de licence logicielles, abonnements récurrents, et même des services personnalisés."
  },
  {
    question: "Est-ce que SellUp prend une commission ?",
    answer: "Cela dépend de votre plan. Le plan Starter a une commission de 1%, le plan Pro 0.5%, et le plan Business est à 0%. Nous voulons que vous gardiez le maximum de vos revenus."
  },
  {
    question: "Puis-je utiliser mon propre nom de domaine ?",
    answer: "Oui ! À partir du plan Pro, vous pouvez lier votre propre nom de domaine (ex: boutique.votrenom.com) pour une expérience de marque totale."
  },
  {
    question: "Comment sont livrés les produits ?",
    answer: "La livraison est instantanée. Dès que le paiement est confirmé par Stripe ou PayPal, le client reçoit un email avec ses accès et peut également les retrouver dans son espace client sur votre boutique."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 relative">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Questions fréquentes</h2>
          <p className="text-white/60">Tout ce que vous devez savoir pour bien démarrer.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-white/60 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
