import { Link } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Send, BookOpen } from 'lucide-react';
import { applyTheme, getBackgroundStyle, loadFont, getTheme } from '../lib/themes';
import { useCart } from '../lib/cart';

interface Props {
  shop: any;
  children: ReactNode;
  pages?: Array<{ slug: string; title: string }>;
  hasBlog?: boolean;
}

export function ShopLayout({ shop, children, pages = [], hasBlog }: Props) {
  const cart = useCart();
  const cartShopItems = cart.items.filter(i => i.shop_slug === shop.slug);
  const preset = getTheme(shop);

  useEffect(() => {
    loadFont(shop.font_family || preset.font);
  }, [shop.font_family, preset.font]);

  return (
    <div
      style={{
        ...applyTheme(shop),
        ...getBackgroundStyle(shop),
        fontFamily: `var(--shop-font)`,
        minHeight: '100vh',
      }}
      className="relative"
    >
      {/* Custom CSS */}
      {shop.custom_css && <style>{shop.custom_css}</style>}

      {/* Shop nav */}
      <header className="sticky top-0 z-40 backdrop-blur-lg border-b" style={{ background: `${shop.background_color || preset.bg}cc`, borderColor: `${shop.theme_color || preset.primary}20` }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={`/s/${shop.slug}`} className="flex items-center gap-3 min-w-0">
            {shop.logo_url ? (
              <img src={shop.logo_url} className="w-9 h-9 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ background: `linear-gradient(135deg, var(--shop-primary), var(--shop-secondary))` }}>
                {shop.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold truncate">{shop.name}</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link to={`/s/${shop.slug}`} className="hidden sm:block px-3 py-1.5 hover:bg-white/5 rounded">Boutique</Link>
            {hasBlog && (
              <Link to={`/s/${shop.slug}/blog`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 hover:bg-white/5 rounded">
                <BookOpen className="w-3.5 h-3.5" /> Blog
              </Link>
            )}
            <button onClick={() => cart.setOpen(true)} className="relative px-3 py-1.5 hover:bg-white/5 rounded flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" />
              {cartShopItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--shop-primary)' }}>
                  {cartShopItems.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </nav>
        </div>
        {shop.announcement && (
          <div className="px-4 py-2 text-sm font-medium text-center"
            style={{ background: `var(--shop-primary)15`, color: 'var(--shop-primary)' }}>
            {shop.announcement}
          </div>
        )}
      </header>

      {/* Glow background (for 'glow' pattern only) */}
      {(shop.background_pattern || preset.bgPattern) === 'glow' && (
        <>
          <div className="fixed w-[600px] h-[600px] rounded-full pointer-events-none -z-10"
            style={{ top: '10%', left: '-10%', background: shop.theme_color || preset.primary, filter: 'blur(120px)', opacity: 0.15 }} />
          <div className="fixed w-[500px] h-[500px] rounded-full pointer-events-none -z-10"
            style={{ bottom: '10%', right: '-10%', background: shop.secondary_color || preset.secondary, filter: 'blur(120px)', opacity: 0.12 }} />
        </>
      )}

      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="border-t mt-20 py-10 px-4" style={{ borderColor: `${shop.theme_color || preset.primary}20` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-3">{shop.name}</h4>
              <p className="text-sm opacity-60">{shop.description || ''}</p>
            </div>
            {pages.length > 0 && (
              <div>
                <h4 className="font-bold mb-3 text-sm uppercase tracking-wider">Informations</h4>
                <div className="space-y-1">
                  {pages.map(p => (
                    <Link key={p.slug} to={`/s/${shop.slug}/p/${p.slug}`} className="block text-sm opacity-70 hover:opacity-100">
                      {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-bold mb-3 text-sm uppercase tracking-wider">Réseaux</h4>
              <div className="flex gap-3">
                {shop.social_discord && (
                  <a href={shop.social_discord} target="_blank" rel="noopener" className="p-2 rounded-lg hover:scale-110 transition" style={{ background: 'var(--shop-primary)20' }}>
                    <MessageCircle className="w-4 h-4" style={{ color: 'var(--shop-primary)' }} />
                  </a>
                )}
                {shop.social_twitter && (
                  <a href={shop.social_twitter} target="_blank" rel="noopener" className="p-2 rounded-lg hover:scale-110 transition flex items-center justify-center" style={{ background: 'var(--shop-primary)20', color: 'var(--shop-primary)' }}>
                    <span className="text-sm font-bold">𝕏</span>
                  </a>
                )}
                {shop.social_telegram && (
                  <a href={shop.social_telegram} target="_blank" rel="noopener" className="p-2 rounded-lg hover:scale-110 transition" style={{ background: 'var(--shop-primary)20' }}>
                    <Send className="w-4 h-4" style={{ color: 'var(--shop-primary)' }} />
                  </a>
                )}
                {shop.social_instagram && (
                  <a href={shop.social_instagram} target="_blank" rel="noopener" className="p-2 rounded-lg hover:scale-110 transition flex items-center justify-center" style={{ background: 'var(--shop-primary)20', color: 'var(--shop-primary)' }}>
                    <span className="text-sm font-bold">📷</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs opacity-50 text-center pt-6 border-t" style={{ borderColor: `${shop.theme_color || preset.primary}10` }}>
            {shop.footer_text || `© ${new Date().getFullYear()} ${shop.name}`} • <Link to="/" className="hover:opacity-100">Propulsé par <strong>SellUp</strong></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
