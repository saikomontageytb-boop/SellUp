import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/api';

export function CartDrawer() {
  const cart = useCart();
  const shops = cart.byShop();

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-brand-black border-l border-white/10 z-[81] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Mon panier ({cart.totalItems})
              </h2>
              <button onClick={() => cart.setOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(shops).map(([slug, items]) => (
                    <div key={slug}>
                      <Link to={`/s/${slug}`} onClick={() => cart.setOpen(false)}
                        className="text-xs uppercase tracking-wider text-white/40 mb-2 block hover:text-white">
                        Boutique : {slug}
                      </Link>
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.product_id + (item.variant_id || '')} className="glass-card p-3 flex gap-3">
                            <div className="w-16 h-16 rounded bg-white/5 overflow-hidden shrink-0">
                              {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{item.name}</div>
                              {item.variant_name && <div className="text-xs text-white/50">{item.variant_name}</div>}
                              <div className="text-sm font-bold mt-1" style={{ color: 'var(--shop-primary, #7C3AED)' }}>
                                {formatPrice(item.price_cents * item.quantity, item.currency)}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => cart.updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                                  className="p-1 bg-white/5 hover:bg-white/10 rounded">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <button onClick={() => cart.updateQty(item.product_id, item.variant_id, item.quantity + 1)}
                                  className="p-1 bg-white/5 hover:bg-white/10 rounded">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => cart.remove(item.product_id, item.variant_id)}
                                  className="p-1 hover:bg-red-500/10 text-red-400 rounded ml-auto">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                        <span className="text-white/60">Sous-total</span>
                        <span className="font-bold">{formatPrice(cart.total(slug))}</span>
                      </div>
                      <Link to={`/cart/${slug}`} onClick={() => cart.setOpen(false)}
                        className="block mt-3 px-4 py-2.5 bg-brand-purple rounded-lg text-center font-medium hover:scale-[1.02] transition">
                        Passer commande →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="p-5 border-t border-white/10">
                <button onClick={() => cart.clear()} className="text-xs text-white/50 hover:text-red-400">
                  Vider le panier
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
