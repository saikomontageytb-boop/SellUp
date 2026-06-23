import { motion } from 'framer-motion';

export const DashboardShowcase = () => {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative glass-card border-white/5 bg-black/40 overflow-hidden"
        >
          {/* Mac OS Window Header */}
          <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/30" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
            <div className="w-3 h-3 rounded-full bg-green-500/30" />
            <div className="ml-4 px-3 py-1 bg-white/5 rounded-md text-[10px] text-white/40 font-mono tracking-wider">
              sellup.app/dashboard
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Simulation */}
              <div className="hidden lg:flex flex-col gap-6">
                <div className="h-4 w-24 bg-brand-purple/20 rounded-full" />
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'bg-white/10' : 'bg-transparent'} border border-white/5 w-full`} />
                  ))}
                </div>
              </div>

              {/* Main Content Simulation */}
              <div className="lg:col-span-3">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h4 className="text-white/40 text-sm mb-1 uppercase tracking-widest font-bold">Aperçu des ventes</h4>
                    <div className="text-4xl font-black">12,482.50 €</div>
                  </div>
                  <div className="text-green-500 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full">
                    +24% ce mois
                  </div>
                </div>

                {/* Simulated Chart */}
                <div className="relative h-64 w-full flex items-end gap-2">
                  {[40, 70, 45, 90, 65, 80, 55, 95, 100, 85, 75, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      className="flex-1 bg-gradient-to-t from-brand-purple/40 to-brand-purple rounded-t-lg relative group"
                    >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-brand-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {h*12}€
                        </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="h-32 glass rounded-2xl p-6 border-white/5">
                        <div className="text-white/40 text-xs mb-2">Nouveaux clients</div>
                        <div className="text-2xl font-bold">1,204</div>
                    </div>
                    <div className="h-32 glass rounded-2xl p-6 border-white/5">
                        <div className="text-white/40 text-xs mb-2">Taux de conversion</div>
                        <div className="text-2xl font-bold">12.5%</div>
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decoration */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-purple/20 blur-[100px] rounded-full" />
        </motion.div>
      </div>
    </section>
  );
};
