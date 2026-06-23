import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Play, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background glows — subtle parallax */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="purple-glow w-[500px] h-[500px] -top-20 -left-20 opacity-30"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="indigo-glow w-[500px] h-[500px] top-40 -right-20 opacity-20"
      />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT — Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 mt-4">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-gradient block"
            >
              Vendez vos produits
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent block"
            >
              en ligne, sans limite.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-white/60 mb-10 max-w-xl leading-relaxed"
          >
            La plateforme SaaS tout-en-un pour gérer vos abonnements, fichiers, licences et bien plus. Une interface moderne conçue pour la conversion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-brand-purple rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 group">
              Lancer ma boutique
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/demo" className="w-full sm:w-auto px-8 py-4 glass rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Voir la démo
            </Link>
          </motion.div>
        </motion.div>

        {/* RIGHT — Clean animated dashboard with cursor tilt */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="relative hidden lg:block"
        >
          <TiltDashboard />
        </motion.div>
      </div>
    </section>
  );
};

function TiltDashboard() {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position normalized [-0.5, 0.5]
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Smooth spring for natural feel
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const sx = useSpring(mx, springConfig);
  const sy = useSpring(my, springConfig);

  // Map to rotation (subtle: max ~12°)
  const rotateY = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-10, 10]);

  // Shine position follows cursor
  const shineX = useTransform(sx, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(sy, [-0.5, 0.5], ['0%', '100%']);
  const shineBg = useTransform(
    [shineX, shineY] as any,
    ([x, y]: any) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.12) 0%, transparent 40%)`
  );

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(x);
    my.set(y);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative"
      style={{ perspective: 1200 }}
    >
      {/* Soft glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] -z-10 bg-gradient-to-br from-brand-purple/25 to-brand-indigo/15 blur-[100px] rounded-full" />

      {/* Tilting card */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
      >
        {/* Floating idle animation (only when mouse is out) */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative glass-card p-6 shadow-[0_50px_100px_-20px_rgba(124,58,237,0.5)] overflow-hidden"
        >
          {/* Cursor-following shine */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{ background: shineBg }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="w-8 h-8 rounded-md" />
              <div>
                <div className="font-bold text-sm">GamerKeys Store</div>
                <div className="text-[10px] text-white/40">Dashboard</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
          </div>

          {/* Two KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-6 relative" style={{ transform: 'translateZ(40px)' }}>
            <Kpi label="Revenus 7j" value="12 450 €" delta="+18%" delay={0.7} />
            <Kpi label="Ventes" value="247" delta="+12 aujourd'hui" delay={0.85} />
          </div>

          {/* Animated chart */}
          <div className="bg-white/5 rounded-lg p-4 mb-2 relative" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-white/50 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-purple" />
                Évolution des ventes
              </div>
              <div className="text-[10px] text-white/30">7 jours</div>
            </div>
            <Chart />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Kpi({ label, value, delta, delay }: { label: string; value: string; delta: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 rounded-lg p-3.5"
    >
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-green-400 mt-1">{delta}</div>
    </motion.div>
  );
}

function Chart() {
  const bars = [40, 58, 48, 72, 55, 88, 95];
  return (
    <div className="relative h-24">
      {/* Bars */}
      <div className="flex items-end gap-2 h-full">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: `${h}%`, opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 + i * 0.08, ease: 'easeOut' }}
            className="flex-1 rounded-t bg-gradient-to-t from-brand-purple to-brand-indigo relative"
          >
            {/* Glow on top */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: 1.6 + i * 0.08, repeat: Infinity, repeatDelay: 3 }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-purple blur-sm"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
