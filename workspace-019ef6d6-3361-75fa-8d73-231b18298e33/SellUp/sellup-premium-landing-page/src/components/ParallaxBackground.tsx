import { useScroll, useTransform, motion, useSpring } from 'framer-motion';

export function ParallaxBackground() {
  const { scrollY } = useScroll();

  // Move the background up slower than the scroll (factor 0.4)
  // The image is taller than the viewport so it can scroll without revealing the bottom
  const rawY = useTransform(scrollY, (v) => -v * 0.4);

  // Smooth with a spring for buttery feel
  const y = useSpring(rawY, { stiffness: 80, damping: 30, mass: 0.5 });

  return (
    <>
      {/* Parallax image */}
      <motion.div
        className="fixed inset-0 -z-20 bg-brand-black"
        style={{
          y,
          height: '200vh',
          backgroundImage: 'url(/bg-neon.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.45,
          filter: 'blur(6px)',
          willChange: 'transform',
        }}
      />
      {/* Dark veil to keep text readable */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-brand-black/60 via-brand-black/80 to-brand-black pointer-events-none" />
    </>
  );
}
