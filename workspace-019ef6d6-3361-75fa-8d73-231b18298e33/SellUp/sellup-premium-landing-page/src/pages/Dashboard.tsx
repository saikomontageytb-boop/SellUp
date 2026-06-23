import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, formatPrice, timeAgo, getToken } from '../lib/api';
import {
  Package, ShoppingBag, Settings, LogOut, Plus, ExternalLink,
  Edit2, Trash2, Key, Euro, TrendingUp, Store, BarChart3, Tag,
  Download, Sparkles, Copy as CopyIcon, Star, Eye, Palette, BookOpen,
  FileText, Users, MessageSquare, FolderTree, Link as LinkIcon, Wallet,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import { themes } from '../lib/themes';
import { ShopSwitcher } from '../components/ShopSwitcher';
import { LiveViewers } from '../components/LiveViewers';
import { WalletTab } from '../components/WalletTab';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { AIChatBubble } from '../components/AIChatBubble';

type Tab = 'overview' | 'products' | 'categories' | 'orders' | 'coupons' | 'reviews' | 'pages' | 'blog' | 'affiliates' | 'wallet' | 'design' | 'settings';

export default function Dashboard() {
  const { user, shop, logout, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [blog, setBlog] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [serialModalFor, setSerialModalFor] = useState<any>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, o, c, a, cats, pgs, bl, af, rv] = await Promise.all([
        api.listProducts(), api.listOrders(), api.listCoupons(), api.analytics(),
        fetch('/api/categories', { headers: { authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/pages', { headers: { authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/blog', { headers: { authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/affiliates', { headers: { authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/reviews', { headers: { authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
      ]);
      setProducts(p.products); setOrders(o.orders); setCoupons(c.coupons); setAnalytics(a);
      setCategories(cats.categories || []); setPages(pgs.pages || []); setBlog(bl.posts || []);
      setAffiliates(af.affiliates || []); setReviews(rv.reviews || []);
    } catch (e: any) { toast('error', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadAll();
  }, [user]);

  if (!user || !shop) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-white/10 p-4 hidden lg:flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
        <Link to="/" className="flex items-center gap-2 mb-4 px-2">
          <img src="/logo/logo-256.png" alt="SellUp" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-base">Sell<span className="text-brand-purple">Up</span></span>
        </Link>

        {/* Multi-shop switcher */}
        <div className="mb-4 pb-4 border-b border-white/5">
          <ShopSwitcher />
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem icon={BarChart3} label="Vue d'ensemble" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <NavSection label="CATALOGUE" />
          <NavItem icon={Package} label="Produits" active={tab === 'products'} onClick={() => setTab('products')} badge={products.length} />
          <NavItem icon={FolderTree} label="Catégories" active={tab === 'categories'} onClick={() => setTab('categories')} badge={categories.length} />
          <NavItem icon={Tag} label="Codes promo" active={tab === 'coupons'} onClick={() => setTab('coupons')} badge={coupons.length} />
          <NavSection label="VENTES" />
          <NavItem icon={ShoppingBag} label="Commandes" active={tab === 'orders'} onClick={() => setTab('orders')} badge={orders.length} />
          <NavItem icon={Wallet} label="Solde & Retraits" active={tab === 'wallet'} onClick={() => setTab('wallet')} />
          <NavItem icon={MessageSquare} label="Avis clients" active={tab === 'reviews'} onClick={() => setTab('reviews')} badge={reviews.length} />
          <NavItem icon={Users} label="Affiliés" active={tab === 'affiliates'} onClick={() => setTab('affiliates')} badge={affiliates.length} />
          <NavSection label="CONTENU" />
          <NavItem icon={FileText} label="Pages" active={tab === 'pages'} onClick={() => setTab('pages')} badge={pages.length} />
          <NavItem icon={BookOpen} label="Blog" active={tab === 'blog'} onClick={() => setTab('blog')} badge={blog.length} />
          <NavSection label="BOUTIQUE" />
          <NavItem icon={Palette} label="Apparence" active={tab === 'design'} onClick={() => setTab('design')} />
          <NavItem icon={Settings} label="Paramètres" active={tab === 'settings'} onClick={() => setTab('settings')} />
        </nav>

        <a href={`/s/${shop.slug}`} target="_blank" rel="noopener"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 mb-2 mt-2">
          <Store className="w-4 h-4" /> Voir ma boutique
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>
        <button onClick={() => { logout(); nav('/'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:bg-white/5 transition text-left text-sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2"><img src="/logo/logo-256.png" alt="SU" className="w-7 h-7 rounded" /><span className="font-extrabold text-xl">Sell<span className="text-brand-purple">Up</span></span></Link>
          <button onClick={() => { logout(); nav('/'); }} className="text-white/60"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto">
          {([
            ['overview','Aperçu'],['products','Produits'],['categories','Catégories'],['orders','Commandes'],
            ['wallet','💰 Solde'],
            ['coupons','Codes'],['reviews','Avis'],['affiliates','Affiliés'],['pages','Pages'],['blog','Blog'],
            ['design','Design'],['settings','Réglages'],
          ] as [Tab,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${tab === t ? 'bg-brand-purple' : 'bg-white/5'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/40 text-center py-20">Chargement...</div>
        ) : (
          <>
            {tab === 'overview' && <OverviewTab analytics={analytics} orders={orders} shop={shop} />}
            {tab === 'products' && (
              <ProductsTab products={products} categories={categories}
                onAdd={() => { setEditingProduct(null); setShowProductModal(true); }}
                onEdit={(p: any) => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={async (id: string) => {
                  if (!confirm('Supprimer ce produit ?')) return;
                  await api.deleteProduct(id); toast('success', 'Supprimé'); loadAll();
                }}
                onManageSerials={(p: any) => setSerialModalFor(p)}
              />
            )}
            {tab === 'categories' && <CategoriesTab categories={categories} onChange={loadAll} />}
            {tab === 'orders' && <OrdersTab orders={orders} />}
            {tab === 'wallet' && <WalletTab />}
            {tab === 'coupons' && <CouponsTab coupons={coupons} onChange={loadAll} />}
            {tab === 'reviews' && <ReviewsTab reviews={reviews} onChange={loadAll} />}
            {tab === 'affiliates' && <AffiliatesTab affiliates={affiliates} shop={shop} onChange={loadAll} />}
            {tab === 'pages' && <PagesTab pages={pages} onChange={loadAll} />}
            {tab === 'blog' && <BlogTab posts={blog} onChange={loadAll} />}
            {tab === 'design' && <DesignTab shop={shop} onSaved={refresh} />}
            {tab === 'settings' && <SettingsTab shop={shop} onSaved={refresh} />}
          </>
        )}
      </main>

      {showProductModal && (
        <ProductModal product={editingProduct} categories={categories}
          onClose={() => setShowProductModal(false)}
          onSaved={() => { setShowProductModal(false); loadAll(); toast('success', editingProduct ? 'Modifié' : 'Créé'); }}
        />
      )}
      {serialModalFor && (
        <SerialsModal product={serialModalFor}
          onClose={() => setSerialModalFor(null)}
          onSaved={() => { setSerialModalFor(null); loadAll(); }}
        />
      )}

      {/* Floating AI chat — accessible everywhere in dashboard */}
      <AIChatBubble />
    </div>
  );
}

function NavSection({ label }: any) {
  return <div className="px-3 py-1 mt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">{label}</div>;
}

function NavItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm ${active ? 'bg-brand-purple/20 text-white' : 'text-white/60 hover:bg-white/5'}`}>
      <Icon className="w-4 h-4" /> {label}
      {badge !== undefined && badge > 0 && (
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${active ? 'bg-brand-purple/30' : 'bg-white/10'}`}>{badge}</span>
      )}
    </button>
  );
}

// ============ OVERVIEW ============

function OverviewTab({ analytics, orders, shop }: any) {
  const a = analytics || {};
  const maxRevenue = Math.max(...(a.daily || []).map((d: any) => d.revenue), 1);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Tableau de bord</h2>
      <p className="text-white/60 mb-6">Bonjour 👋 voici votre activité.</p>

      {/* AI insights — proactive advisor */}
      <AIInsightsPanel />

      {/* Live viewers — always visible */}
      <LiveViewers />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Euro} label="Revenus 7j" value={formatPrice(a.last_7d?.revenue || 0)} sub={`${a.last_7d?.count || 0} ventes`} color="text-green-400" />
        <Kpi icon={TrendingUp} label="Revenus 30j" value={formatPrice(a.last_30d?.revenue || 0)} sub={`${a.last_30d?.count || 0} ventes`} color="text-blue-400" />
        <Kpi icon={ShoppingBag} label="Total ventes" value={a.all_time?.count || 0} sub={formatPrice(a.all_time?.revenue || 0)} color="text-purple-400" />
        <Kpi icon={Eye} label="Vues" value={a.total_views || 0} sub={`${a.newsletter_count || 0} abonnés news`} color="text-yellow-400" />
      </div>

      <div className="glass-card p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Ventes 7 derniers jours</h3>
        <div className="flex items-end gap-2 h-40">
          {(a.daily || []).map((d: any, i: number) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-white/40 mb-1">{d.count || ''}</div>
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="w-full rounded-t-md bg-gradient-to-t from-brand-purple to-brand-indigo min-h-[2px]"
                title={`${formatPrice(d.revenue)}`}
              />
              <div className="text-xs text-white/40">{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Top produits</h3>
          {!a.top_products?.length ? <p className="text-white/40 text-sm">Aucune donnée.</p> : (
            <div className="space-y-3">
              {a.top_products.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="text-xs font-bold text-white/40 w-5">#{i + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                    {p.image_url && <img src={p.image_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-white/40">{p.sales || 0} ventes</div>
                  </div>
                  <div className="font-bold text-sm">{formatPrice(p.revenue || 0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-green-400" /> Activité récente</h3>
          {orders.length === 0 ? <p className="text-white/40 text-sm">Aucune commande.</p> : (
            <div className="space-y-2">
              {orders.slice(0, 6).map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${o.status === 'delivered' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate">{o.product_name}</span>
                    <span className="text-white/40 text-xs ml-2">{o.buyer_email.replace(/(.{2}).*@/, '$1***@')}</span>
                  </div>
                  <div className="text-xs text-white/40 shrink-0">{timeAgo(o.created_at)}</div>
                  <div className="font-bold text-sm shrink-0">{formatPrice(o.amount_cents, o.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ShareBox shop={shop} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 text-sm text-white/60 mb-2"><Icon className={`w-4 h-4 ${color}`} /> {label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </motion.div>
  );
}

function ShareBox({ shop }: any) {
  const toast = useToast();
  const url = `${window.location.origin}/s/${shop.slug}`;
  return (
    <div className="glass-card p-5 mt-6">
      <h3 className="font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-purple" /> Partagez votre boutique</h3>
      <div className="flex gap-2">
        <input value={url} readOnly className="input flex-1 font-mono text-sm" onClick={e => (e.target as HTMLInputElement).select()} />
        <button onClick={async () => { await navigator.clipboard.writeText(url); toast('success', 'Lien copié !'); }}
          className="px-4 py-2 bg-brand-purple rounded-lg font-medium hover:scale-105 transition flex items-center gap-2 text-sm">
          <CopyIcon className="w-4 h-4" /> Copier
        </button>
      </div>
    </div>
  );
}

// ============ PRODUCTS ============

function ProductsTab({ products, onAdd, onEdit, onDelete, onManageSerials }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Vos produits</h2>
          <p className="text-white/50 text-sm">{products.length} produit(s)</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>
      {products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-white/30 mb-4" />
          <p className="text-white/60 mb-4">Aucun produit</p>
          <button onClick={onAdd} className="px-6 py-2 bg-brand-purple rounded-lg font-medium">Créer mon premier produit</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((p: any) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-brand-purple" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{p.name}</span>
                  {p.featured ? <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">⭐ Vedette</span> : null}
                  {!p.active ? <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">Brouillon</span> : null}
                  {p.category_name && <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60">{p.category_name}</span>}
                </div>
                <div className="text-sm text-white/50 truncate">{p.description || 'Sans description'}</div>
                <div className="text-xs text-white/30 mt-0.5">{p.view_count} vues</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(p.price_cents, p.currency)}</div>
                <div className="text-xs text-white/40">{p.delivery_type === 'serials' ? 'Clés' : p.delivery_type === 'file' ? 'Fichier' : p.delivery_type === 'discord' ? 'Discord' : 'Texte'}</div>
              </div>
              <div className="flex gap-2">
                {p.delivery_type === 'serials' && <button onClick={() => onManageSerials(p)} title="Stock" className="p-2 hover:bg-white/10 rounded-lg"><Key className="w-4 h-4" /></button>}
                <button onClick={() => onEdit(p)} className="p-2 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(p.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ CATEGORIES ============

function CategoriesTab({ categories, onChange }: any) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/categories', {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name }),
      });
      setName(''); onChange(); toast('success', 'Catégorie créée');
    } catch { toast('error', 'Erreur'); }
    finally { setCreating(false); }
  };
  const del = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${getToken()}` } });
    onChange(); toast('success', 'Supprimé');
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Catégories</h2>
      <p className="text-white/60 mb-6">Organisez vos produits par thématiques</p>
      <div className="glass-card p-4 mb-4 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la catégorie (ex: 🎮 Jeux vidéo)" className="input flex-1" />
        <button onClick={create} disabled={!name || creating} className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50">
          <Plus className="w-4 h-4 inline" /> Créer
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="text-white/40 text-center py-12">Pas encore de catégorie</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((c: any) => (
            <div key={c.id} className="glass-card p-4 flex items-center gap-3">
              <FolderTree className="w-5 h-5 text-brand-purple" />
              <div className="flex-1">
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-white/40 font-mono">/c/{c.slug}</div>
              </div>
              <button onClick={() => del(c.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ ORDERS ============

// eslint-disable-next-line
function OrdersTab({ orders }: any) {
  const downloadCsv = async () => {
    const token = getToken();
    const res = await fetch('/api/orders/export', { headers: { authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'commandes.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Commandes</h2>
        {orders.length > 0 && (
          <button onClick={downloadCsv} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        )}
      </div>
      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center"><ShoppingBag className="w-12 h-12 mx-auto text-white/30 mb-4" /><p className="text-white/60">Aucune commande</p></div>
      ) : (
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/60">
                <th className="p-3">Produit</th>
                <th className="p-3 hidden md:table-cell">Client</th>
                <th className="p-3 hidden lg:table-cell">Qté</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
                <th className="p-3 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 font-medium">{o.product_name}</td>
                  <td className="p-3 hidden md:table-cell text-white/60">{o.buyer_email}</td>
                  <td className="p-3 hidden lg:table-cell">×{o.quantity || 1}</td>
                  <td className="p-3">{formatPrice(o.amount_cents, o.currency)}
                    {o.coupon_code && <div className="text-xs text-green-400">{o.coupon_code}</div>}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${o.status === 'delivered' ? 'bg-green-500/20 text-green-400' : o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10'}`}>
                      {o.status === 'delivered' ? 'Livrée' : o.status === 'pending' ? 'En attente' : o.status}
                    </span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-white/40 text-xs">{timeAgo(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ COUPONS ============

function CouponsTab({ coupons, onChange }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Codes promo</h2><p className="text-white/50 text-sm">Boostez vos ventes</p></div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
          <Plus className="w-4 h-4" /> Nouveau code
        </button>
      </div>
      {coupons.length === 0 ? (
        <div className="glass-card p-12 text-center"><Tag className="w-12 h-12 mx-auto text-white/30 mb-4" /><p className="text-white/60">Aucun code</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {coupons.map((c: any) => (
            <div key={c.id} className="glass-card p-4 flex items-center gap-3">
              <Tag className="w-5 h-5 text-brand-purple" />
              <div className="flex-1">
                <div className="font-mono font-bold text-lg">{c.code}</div>
                <div className="text-sm text-white/60">
                  {c.discount_percent ? `-${c.discount_percent}%` : `-${formatPrice(c.discount_cents)}`}
                  {' • '}{c.uses} util.{c.max_uses !== -1 && ` / ${c.max_uses}`}
                </div>
              </div>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await api.deleteCoupon(c.id); onChange(); } }}
                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {show && <CouponModal onClose={() => setShow(false)} onSaved={() => { setShow(false); onChange(); }} />}
    </div>
  );
}

// ============ REVIEWS ============

function ReviewsTab({ reviews, onChange }: any) {
  const toast = useToast();
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const submit = async (id: string) => {
    await fetch(`/api/reviews/${id}/reply`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ reply: replyText }),
    });
    toast('success', 'Réponse publiée');
    setReplyFor(null); setReplyText(''); onChange();
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Avis clients</h2>
      <p className="text-white/60 mb-6">Répondez à vos clients pour montrer votre engagement</p>
      {reviews.length === 0 ? (
        <p className="text-white/40 text-center py-12">Aucun avis pour le moment</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold">{r.product_name}</span>
                  <span className="text-white/40 text-sm ml-2">par {r.buyer_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-white/40">{timeAgo(r.created_at)}</span>
                </div>
              </div>
              {r.comment && <p className="text-white/80 mt-2">{r.comment}</p>}
              {r.reply ? (
                <div className="mt-3 pl-4 border-l-2 border-brand-purple text-sm">
                  <div className="font-bold text-brand-purple mb-1">Votre réponse</div>
                  <p className="text-white/70">{r.reply}</p>
                </div>
              ) : replyFor === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                    className="input" placeholder="Votre réponse..." />
                  <div className="flex gap-2">
                    <button onClick={() => setReplyFor(null)} className="px-3 py-1 text-sm hover:bg-white/5 rounded">Annuler</button>
                    <button onClick={() => submit(r.id)} className="px-3 py-1 bg-brand-purple rounded text-sm">Publier</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyFor(r.id); setReplyText(''); }}
                  className="mt-3 text-sm text-brand-purple hover:underline">↩ Répondre</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ AFFILIATES ============

function AffiliatesTab({ affiliates, shop, onChange }: any) {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [code, setCode] = useState(''); const [email, setEmail] = useState(''); const [pct, setPct] = useState('10');
  const create = async () => {
    await fetch('/api/affiliates', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ code, email, commission_percent: parseInt(pct) || 10 }),
    });
    toast('success', 'Affilié créé');
    setShow(false); setCode(''); setEmail(''); onChange();
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Programme d'affiliation</h2><p className="text-white/50 text-sm">Récompensez ceux qui parlent de vous</p></div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium"><Plus className="w-4 h-4" /> Nouvel affilié</button>
      </div>
      {affiliates.length === 0 ? (
        <div className="glass-card p-12 text-center"><Users className="w-12 h-12 mx-auto text-white/30 mb-4" /><p className="text-white/60">Aucun affilié</p></div>
      ) : (
        <div className="space-y-3">
          {affiliates.map((a: any) => (
            <div key={a.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
              <LinkIcon className="w-5 h-5 text-brand-purple" />
              <div className="flex-1">
                <div className="font-mono font-bold">{a.code} <span className="text-xs text-white/40">({a.commission_percent}%)</span></div>
                <div className="text-xs text-white/50">{a.email}</div>
                <div className="text-xs text-white/40 mt-1">{`${window.location.origin}/s/${shop.slug}?ref=${a.code}`}</div>
              </div>
              <div className="text-right text-sm">
                <div>{a.clicks} clics • {a.sales} ventes</div>
                <div className="font-bold text-green-400">{formatPrice(a.earnings_cents || 0)}</div>
              </div>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await fetch(`/api/affiliates/${a.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${getToken()}` } }); onChange(); } }}
                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nouvel affilié</h3>
            <div className="space-y-3">
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Code (ex: CREATOR10)" className="input font-mono uppercase" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email de l'affilié" type="email" className="input" />
              <input value={pct} onChange={e => setPct(e.target.value)} placeholder="Commission %" type="number" className="input" />
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
              <button onClick={create} className="px-5 py-2 bg-brand-purple rounded-lg font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PAGES ============

function PagesTab({ pages, onChange }: any) {
  const toast = useToast();
  const [edit, setEdit] = useState<any>(null);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Pages personnalisées</h2><p className="text-white/50 text-sm">CGV, contact, politique...</p></div>
        <button onClick={() => setEdit({ title: '', content: '', slug: '' })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium"><Plus className="w-4 h-4" /> Nouvelle page</button>
      </div>
      {pages.length === 0 ? (
        <div className="glass-card p-12 text-center"><FileText className="w-12 h-12 mx-auto text-white/30 mb-4" /><p className="text-white/60">Aucune page</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {pages.map((p: any) => (
            <div key={p.id} className="glass-card p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand-purple" />
              <div className="flex-1">
                <div className="font-bold">{p.title}</div>
                <div className="text-xs text-white/40 font-mono">/p/{p.slug}</div>
              </div>
              <button onClick={() => setEdit(p)} className="p-2 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await fetch(`/api/pages/${p.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${getToken()}` } }); onChange(); toast('success', 'Supprimée'); } }}
                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {edit && <PageEditor page={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onChange(); }} />}
    </div>
  );
}

function PageEditor({ page, onClose, onSaved }: any) {
  const isNew = !page.id;
  const [title, setTitle] = useState(page.title || '');
  const [slug, setSlug] = useState(page.slug || '');
  const [content, setContent] = useState(page.content || '');
  const [showInFooter, setShowInFooter] = useState(page.show_in_footer !== 0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { title, slug, content, show_in_footer: showInFooter ? 1 : 0 };
    if (isNew) {
      await fetch('/api/pages', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/pages/${page.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
    }
    onSaved();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="glass-card p-6 w-full max-w-2xl my-8">
        <h3 className="text-xl font-bold mb-4">{isNew ? 'Nouvelle page' : 'Modifier la page'}</h3>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" className="input" required />
          {isNew && <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (ex: tos, contact)" className="input font-mono" />}
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={15} placeholder="Contenu (Markdown supporté)" className="input font-mono text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showInFooter} onChange={e => setShowInFooter(e.target.checked)} />
            Afficher dans le footer de la boutique
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
          <button type="submit" className="px-5 py-2 bg-brand-purple rounded-lg font-medium">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

// ============ BLOG ============

function BlogTab({ posts, onChange }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Blog</h2><p className="text-white/50 text-sm">Engagez votre audience avec du contenu</p></div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium"><Plus className="w-4 h-4" /> Nouvel article</button>
      </div>
      {posts.length === 0 ? (
        <div className="glass-card p-12 text-center"><BookOpen className="w-12 h-12 mx-auto text-white/30 mb-4" /><p className="text-white/60">Aucun article</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {posts.map((p: any) => (
            <div key={p.id} className="glass-card p-4 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-brand-purple" />
              <div className="flex-1">
                <div className="font-bold">{p.title}</div>
                <div className="text-xs text-white/40">{timeAgo(p.created_at)}</div>
              </div>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await fetch(`/api/blog/${p.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${getToken()}` } }); onChange(); } }}
                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {show && <BlogEditor onClose={() => setShow(false)} onSaved={() => { setShow(false); onChange(); }} />}
    </div>
  );
}

function BlogEditor({ onClose, onSaved }: any) {
  const [title, setTitle] = useState(''); const [slug, setSlug] = useState(''); const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState(''); const [image, setImage] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/blog', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title, slug, excerpt, content, image_url: image }),
    });
    onSaved();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="glass-card p-6 w-full max-w-2xl my-8">
        <h3 className="text-xl font-bold mb-4">Nouvel article</h3>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" className="input" required />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (laisser vide pour auto)" className="input font-mono" />
          <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL image (optionnel)" className="input" />
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="Résumé court" className="input" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} placeholder="Contenu (Markdown)" className="input font-mono text-sm" />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
          <button type="submit" className="px-5 py-2 bg-brand-purple rounded-lg font-medium">Publier</button>
        </div>
      </form>
    </div>
  );
}

// ============ DESIGN ============

function DesignTab({ shop, onSaved }: any) { // eslint-disable-line
  const toast = useToast();
  const [s, setS] = useState({
    theme_preset: shop.theme_preset || 'default',
    theme_color: shop.theme_color || '#7C3AED',
    secondary_color: shop.secondary_color || '#6366F1',
    accent_color: shop.accent_color || '#F59E0B',
    background_color: shop.background_color || '#08080C',
    background_pattern: shop.background_pattern || 'glow',
    font_family: shop.font_family || 'Inter',
    border_radius: shop.border_radius || 'lg',
    product_layout: shop.product_layout || 'grid3',
    hero_enabled: shop.hero_enabled !== 0,
    hero_title: shop.hero_title || '',
    hero_subtitle: shop.hero_subtitle || '',
    hero_cta_text: shop.hero_cta_text || '',
    show_stats: shop.show_stats !== 0,
    custom_css: shop.custom_css || '',
    footer_text: shop.footer_text || '',
  });
  const [saving, setSaving] = useState(false);

  const applyPreset = (id: string) => {
    const preset = themes[id];
    setS((prev: any) => ({
      ...prev,
      theme_preset: id,
      theme_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      background_color: preset.bg,
      background_pattern: preset.bgPattern,
      font_family: preset.font,
      border_radius: preset.radius,
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateShop({ ...s, hero_enabled: s.hero_enabled ? 1 : 0, show_stats: s.show_stats ? 1 : 0 });
      toast('success', 'Design mis à jour 🎨');
      onSaved?.();
    } catch (e: any) { toast('error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Apparence de la boutique</h2>
          <p className="text-white/60">Personnalisez l'identité visuelle</p>
        </div>
        <a href={`/s/${shop.slug}`} target="_blank" rel="noopener"
          className="px-4 py-2 bg-white/5 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10">
          <Eye className="w-4 h-4" /> Aperçu live <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* THEME PRESETS */}
      <div className="glass-card p-6 mb-4">
        <h3 className="font-bold mb-1">🎨 Thèmes prédéfinis</h3>
        <p className="text-sm text-white/60 mb-4">Choisissez une base et personnalisez ensuite</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(themes).map(t => (
            <button key={t.id} onClick={() => applyPreset(t.id)}
              className={`p-4 rounded-xl border-2 text-left transition ${s.theme_preset === t.id ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10 hover:border-white/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                <div className="w-6 h-6 rounded" style={{ background: t.primary }} />
                <div className="w-6 h-6 rounded" style={{ background: t.secondary }} />
                <div className="w-6 h-6 rounded" style={{ background: t.accent }} />
                <div className="w-6 h-6 rounded border border-white/20" style={{ background: t.bg }} />
              </div>
              <p className="text-xs text-white/50">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* COLORS */}
      <div className="glass-card p-6 mb-4">
        <h3 className="font-bold mb-4">🎨 Couleurs</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorPicker label="Couleur principale" value={s.theme_color} onChange={(v: string) => setS({...s, theme_color: v})} />
          <ColorPicker label="Couleur secondaire" value={s.secondary_color} onChange={(v: string) => setS({...s, secondary_color: v})} />
          <ColorPicker label="Couleur d'accent" value={s.accent_color} onChange={(v: string) => setS({...s, accent_color: v})} />
          <ColorPicker label="Arrière-plan" value={s.background_color} onChange={(v: string) => setS({...s, background_color: v})} />
        </div>
      </div>

      {/* PATTERNS + FONT + RADIUS + LAYOUT */}
      <div className="glass-card p-6 mb-4 space-y-4">
        <h3 className="font-bold">✨ Style</h3>

        <div>
          <label className="block text-sm text-white/70 mb-2">Motif d'arrière-plan</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {['glow', 'grid', 'dots', 'gradient', 'noise', 'none'].map(p => (
              <button key={p} onClick={() => setS({...s, background_pattern: p})}
                className={`p-3 rounded-lg border-2 text-xs capitalize ${s.background_pattern === p ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10 hover:border-white/20'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Police de caractères (Google Fonts)</label>
          <select value={s.font_family} onChange={e => setS({...s, font_family: e.target.value})} className="input">
            {['Inter', 'Poppins', 'Rajdhani', 'Orbitron', 'Playfair Display', 'Roboto', 'Montserrat', 'Bebas Neue', 'Oswald', 'Space Grotesk'].map(f =>
              <option key={f} value={f}>{f}</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Arrondi des cartes</label>
          <div className="grid grid-cols-6 gap-2">
            {['none', 'sm', 'md', 'lg', 'xl', 'full'].map(r => (
              <button key={r} onClick={() => setS({...s, border_radius: r})}
                className={`p-3 border-2 text-xs ${s.border_radius === r ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10'}`}
                style={{ borderRadius: r === 'none' ? 0 : r === 'sm' ? 4 : r === 'md' ? 8 : r === 'lg' ? 12 : r === 'xl' ? 16 : 9999 }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Disposition des produits</label>
          <div className="grid grid-cols-4 gap-2">
            {[['grid2','2 col'],['grid3','3 col'],['grid4','4 col'],['list','Liste']].map(([id,l]) => (
              <button key={id} onClick={() => setS({...s, product_layout: id})}
                className={`p-3 rounded-lg border-2 text-xs ${s.product_layout === id ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="glass-card p-6 mb-4 space-y-4">
        <h3 className="font-bold">🎬 Hero (bannière d'accueil)</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={s.hero_enabled} onChange={e => setS({...s, hero_enabled: e.target.checked})} />
          <span className="text-sm">Afficher le hero sur la boutique</span>
        </label>
        {s.hero_enabled && (
          <>
            <input value={s.hero_title} onChange={e => setS({...s, hero_title: e.target.value})}
              placeholder="Titre principal" className="input" />
            <textarea value={s.hero_subtitle} onChange={e => setS({...s, hero_subtitle: e.target.value})}
              placeholder="Sous-titre" rows={2} className="input" />
            <input value={s.hero_cta_text} onChange={e => setS({...s, hero_cta_text: e.target.value})}
              placeholder="Texte du bouton (ex: Voir les produits)" className="input" />
          </>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={s.show_stats} onChange={e => setS({...s, show_stats: e.target.checked})} />
          <span className="text-sm">Afficher les stats publiques (ventes, clients, note)</span>
        </label>
      </div>

      {/* FOOTER */}
      <div className="glass-card p-6 mb-4 space-y-3">
        <h3 className="font-bold">📄 Footer</h3>
        <input value={s.footer_text} onChange={e => setS({...s, footer_text: e.target.value})}
          placeholder="Texte du footer (ex: © 2026 Ma Boutique)" className="input" />
      </div>

      {/* CUSTOM CSS */}
      <details className="glass-card p-6 mb-4">
        <summary className="font-bold cursor-pointer">🧙 CSS personnalisé (avancé)</summary>
        <textarea value={s.custom_css} onChange={e => setS({...s, custom_css: e.target.value})}
          rows={8} placeholder="/* Votre CSS ici */" className="input font-mono text-xs mt-3" />
      </details>

      <button onClick={save} disabled={saving}
        className="w-full px-6 py-3 bg-brand-purple rounded-xl font-bold hover:scale-[1.01] transition disabled:opacity-50">
        {saving ? 'Enregistrement...' : '💾 Enregistrer le design'}
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-12 h-10 rounded bg-transparent border border-white/10 cursor-pointer" />
        <input value={value} onChange={e => onChange(e.target.value)} className="input flex-1 font-mono" />
      </div>
    </div>
  );
}

// ============ SETTINGS (general) ============

function SettingsTab({ shop, onSaved }: any) {
  const toast = useToast();
  const [s, setS] = useState({
    name: shop.name, slug: shop.slug, description: shop.description || '',
    logo_url: shop.logo_url || '', banner_url: shop.banner_url || '',
    announcement: shop.announcement || '',
    discord_webhook: shop.discord_webhook || '',
    social_twitter: shop.social_twitter || '',
    social_discord: shop.social_discord || '',
    social_telegram: shop.social_telegram || '',
    social_instagram: shop.social_instagram || '',
    maintenance: !!shop.maintenance,
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.updateShop({ ...s, maintenance: s.maintenance ? 1 : 0 });
      toast('success', 'Mis à jour'); onSaved?.();
    } catch (e: any) { toast('error', e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Paramètres de la boutique</h2>
      <div className="glass-card p-6 space-y-4 mb-4">
        <Field label="Nom"><input value={s.name} onChange={e => setS({...s, name: e.target.value})} className="input" /></Field>
        <Field label="URL" hint={`${window.location.host}/s/${s.slug}`}>
          <input value={s.slug} onChange={e => setS({...s, slug: e.target.value})} className="input" />
        </Field>
        <Field label="Description">
          <textarea value={s.description} onChange={e => setS({...s, description: e.target.value})} rows={3} className="input" />
        </Field>
        <Field label="📣 Bannière d'annonce">
          <input value={s.announcement} onChange={e => setS({...s, announcement: e.target.value})} className="input" placeholder="🔥 Soldes ce week-end !" />
        </Field>
        <Field label="URL du logo"><input value={s.logo_url} onChange={e => setS({...s, logo_url: e.target.value})} className="input" /></Field>
        <Field label="URL de la bannière"><input value={s.banner_url} onChange={e => setS({...s, banner_url: e.target.value})} className="input" /></Field>
      </div>

      <div className="glass-card p-6 space-y-4 mb-4">
        <h3 className="font-bold">🌐 Réseaux sociaux</h3>
        <Field label="Discord (lien serveur)"><input value={s.social_discord} onChange={e => setS({...s, social_discord: e.target.value})} className="input" placeholder="https://discord.gg/..." /></Field>
        <Field label="Twitter / X"><input value={s.social_twitter} onChange={e => setS({...s, social_twitter: e.target.value})} className="input" placeholder="https://x.com/..." /></Field>
        <Field label="Telegram"><input value={s.social_telegram} onChange={e => setS({...s, social_telegram: e.target.value})} className="input" placeholder="https://t.me/..." /></Field>
        <Field label="Instagram"><input value={s.social_instagram} onChange={e => setS({...s, social_instagram: e.target.value})} className="input" placeholder="https://instagram.com/..." /></Field>
      </div>

      <div className="glass-card p-6 space-y-4 mb-4">
        <h3 className="font-bold">🔔 Webhook Discord (notifs ventes)</h3>
        <input value={s.discord_webhook} onChange={e => setS({...s, discord_webhook: e.target.value})}
          className="input" placeholder="https://discord.com/api/webhooks/..." />
      </div>

      <div className="glass-card p-6 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={s.maintenance} onChange={e => setS({...s, maintenance: e.target.checked})} className="mt-1" />
          <div>
            <div className="font-bold">🛠️ Mode maintenance</div>
            <div className="text-sm text-white/60">Affiche un message au lieu des produits</div>
          </div>
        </label>
      </div>

      <button onClick={save} disabled={saving}
        className="px-6 py-2.5 bg-brand-purple rounded-lg font-medium hover:scale-105 transition disabled:opacity-50">
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

// ============ MODALS (Product, Serials, Coupon) ============

function ProductModal({ product, categories, onClose, onSaved }: any) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? (product.price_cents / 100).toString() : '');
  const [currency, setCurrency] = useState(product?.currency || 'EUR');
  const [image, setImage] = useState(product?.image_url || '');
  const [galleryText, setGalleryText] = useState(product?.images ? (JSON.parse(product.images) as string[]).join('\n') : '');
  const [type, setType] = useState(product?.delivery_type || 'text');
  const [payload, setPayload] = useState(product?.delivery_payload || '');
  const [featured, setFeatured] = useState(!!product?.featured);
  const [active, setActive] = useState(product ? !!product.active : true);
  const [maxQty, setMaxQty] = useState((product?.max_quantity || 10).toString());
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const gallery = galleryText.split('\n').map(s => s.trim()).filter(Boolean);
      const data = {
        name, description,
        price_cents: Math.round(parseFloat(price) * 100), currency,
        image_url: image || null, images: gallery.length ? JSON.stringify(gallery) : null,
        delivery_type: type, delivery_payload: type === 'serials' ? null : payload,
        featured: featured ? 1 : 0, active: active ? 1 : 0,
        max_quantity: parseInt(maxQty) || 10,
        category_id: categoryId || null,
      };
      if (isEdit) await api.updateProduct(product.id, data); else await api.createProduct(data);
      onSaved();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card p-6 w-full max-w-lg my-8">
        <h3 className="text-xl font-bold mb-4">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h3>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nom"><input required value={name} onChange={e => setName(e.target.value)} className="input" /></Field>
          <Field label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix"><input type="number" step="0.01" min="0" required value={price} onChange={e => setPrice(e.target.value)} className="input" /></Field>
            <Field label="Devise"><select value={currency} onChange={e => setCurrency(e.target.value)} className="input"><option>EUR</option><option>USD</option><option>GBP</option></select></Field>
          </div>
          <Field label="Catégorie">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input">
              <option value="">Aucune</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Image principale (URL)"><input value={image} onChange={e => setImage(e.target.value)} className="input" /></Field>
          <Field label="Galerie (une URL par ligne)"><textarea value={galleryText} onChange={e => setGalleryText(e.target.value)} rows={2} className="input font-mono text-xs" /></Field>
          <Field label="Type de livraison">
            <select value={type} onChange={e => setType(e.target.value)} className="input">
              <option value="text">Texte / Lien</option>
              <option value="serials">Clés / Serials</option>
              <option value="discord">Invitation Discord</option>
              <option value="file">Fichier</option>
            </select>
          </Field>
          {type !== 'serials' && (
            <Field label="Contenu livré"><textarea value={payload} onChange={e => setPayload(e.target.value)} rows={2} className="input" /></Field>
          )}
          <Field label="Quantité max"><input type="number" min={1} value={maxQty} onChange={e => setMaxQty(e.target.value)} className="input" /></Field>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} /> ⭐ Vedette</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Actif</label>
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50">
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SerialsModal({ product, onClose, onSaved }: any) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState<any>(null);
  useEffect(() => { api.countSerials(product.id).then(setCount).catch(() => {}); }, [product.id]);
  const submit = async () => {
    const serials = text.split('\n').map(s => s.trim()).filter(Boolean);
    if (!serials.length) return;
    setSaving(true);
    try {
      const { added } = await api.addSerials(product.id, serials);
      toast('success', `${added} clé(s) ajoutée(s)`);
      setText(''); const c = await api.countSerials(product.id); setCount(c);
      setTimeout(onSaved, 600);
    } catch (e: any) { toast('error', e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-2">Stock — {product.name}</h3>
        {count && <p className="text-sm text-white/60 mb-3">📊 <strong>{count.available}</strong> dispo / {count.total} total</p>}
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="input font-mono text-sm" placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY" />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Fermer</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50">
            {saving ? '...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponModal({ onClose, onSaved }: any) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('-1');
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCoupon({
        code: code.toUpperCase(),
        discount_percent: type === 'percent' ? parseInt(value) : null,
        discount_cents: type === 'fixed' ? Math.round(parseFloat(value) * 100) : null,
        max_uses: parseInt(maxUses) || -1,
      });
      onSaved();
    } catch (e: any) { toast('error', e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5" /> Nouveau code</h3>
        <div className="space-y-3">
          <Field label="Code"><input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="input font-mono uppercase" placeholder="WELCOME10" /></Field>
          <Field label="Type">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('percent')} className={`p-3 rounded-lg border text-sm ${type === 'percent' ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10'}`}>%</button>
              <button type="button" onClick={() => setType('fixed')} className={`p-3 rounded-lg border text-sm ${type === 'fixed' ? 'border-brand-purple bg-brand-purple/10' : 'border-white/10'}`}>€ fixe</button>
            </div>
          </Field>
          <Field label="Valeur"><input required type="number" step={type === 'percent' ? 1 : 0.01} min={1} value={value} onChange={e => setValue(e.target.value)} className="input" /></Field>
          <Field label="Max usages (-1 = illimité)"><input type="number" min={-1} value={maxUses} onChange={e => setMaxUses(e.target.value)} className="input" /></Field>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Annuler</button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50">{saving ? '...' : 'Créer'}</button>
        </div>
      </form>
    </div>
  );
}
