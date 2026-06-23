import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Alexandre Durant",
    role: "Créateur de contenu",
    content: "SellUp a littéralement transformé ma façon de vendre mes formations. L'interface est intuitive et le support est réactif.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
  },
  {
    name: "Sophie Martin",
    role: "Développeuse Indie",
    content: "J'utilise SellUp pour vendre mes scripts et plugins. La gestion des licences est un énorme gain de temps pour moi.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie"
  },
  {
    name: "Thomas Dubois",
    role: "Fondateur de SaaS",
    content: "La meilleure plateforme pour gérer les abonnements Discord. Tout est automatisé, je n'ai plus rien à faire manuellement.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas"
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ils parlent de nous</h2>
          <p className="text-xl text-white/60">Rejoignez des milliers d'entrepreneurs qui ont choisi l'excellence.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-lg text-white/80 italic mb-8 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full border border-white/10" />
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-white/40">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
