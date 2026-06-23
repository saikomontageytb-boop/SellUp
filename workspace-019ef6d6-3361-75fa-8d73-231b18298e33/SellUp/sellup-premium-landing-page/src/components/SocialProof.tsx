import { motion } from 'framer-motion';

const brands = ["Stripe", "PayPal", "Discord", "Apple Pay", "Google Pay", "Visa", "Mastercard"];

export const SocialProof = () => {
  return (
    <div className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-12"
        >
          Ils nous font confiance
        </motion.p>

        {/* Infinite marquee */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex gap-16 md:gap-24 whitespace-nowrap w-max"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="text-2xl font-black text-white/40 hover:text-white transition-colors cursor-default shrink-0"
              >
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
