const brands = [
  "Stripe", "PayPal", "Discord", "Apple Pay", "Google Pay", "Visa", "Mastercard"
];

export const SocialProof = () => {
  return (
    <div className="py-20 relative border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-12">
          Ils nous font confiance
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {brands.map((brand) => (
            <span key={brand} className="text-2xl font-black text-white/80 hover:text-white transition-colors cursor-default">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
