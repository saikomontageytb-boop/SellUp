import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, formatPrice } from '../lib/api';
import {
  Package, ShoppingBag, Settings, LogOut, Plus, ExternalLink,
  Edit2, Trash2, Key, Euro, TrendingUp, Store
} from 'lucide-react';

type Tab = 'products' | 'orders' | 'settings';

export default function Dashboard() {
  const { user, shop, logout, refresh } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [serialModalFor, setSerialModalFor] = useState<any>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([api.listProducts(), api.listOrders()]);
      setProducts(p.products);
      setOrders(o.orders);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadAll();
  }, [user]);

  if (!user || !shop) return null;

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.amount_cents, 0);
  const totalSales = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 hidden md:flex flex-col">
        <Link to="/" className="font-extrabold text-2xl mb-10">
          Sell<span className="text-brand-purple">Up</span>
        </Link>

        <nav className="space-y-1 flex-1">
          <button onClick={() => setTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${tab === 'products' ? 'bg-brand-purple/20 text-white' : 'text-white/60 hover:bg-white/5'}`}>
            <Package className="w-4 h-4" /> Produits
          </button>
          <button onClick={() => setTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${tab === 'orders' ? 'bg-brand-purple/20 text-white' : 'text-white/60 hover:bg-white/5'}`}>
            <ShoppingBag className="w-4 h-4" /> Commandes
          </button>
          <button onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${tab === 'settings' ? 'bg-brand-purple/20 text-white' : 'text-white/60 hover:bg-white/5'}`}>
            <Settings className="w-4 h-4" /> Boutique
          </button>
        </nav>

        <a href={`/s/${shop.slug}`} target="_blank" rel="noopener"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 mb-2">
          <Store className="w-4 h-4" /> Voir ma boutique
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>

        <button onClick={() => { logout(); nav('/'); }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/5 transition text-left">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <Link to="/" className="font-extrabold text-xl">Sell<span className="text-brand-purple">Up</span></Link>
          <button onClick={() => { logout(); nav('/'); }} className="text-white/60"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 text-white/60 text-sm mb-2"><Euro className="w-4 h-4" /> Revenus</div>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 text-white/60 text-sm mb-2"><TrendingUp className="w-4 h-4" /> Ventes</div>
            <div className="text-2xl font-bold">{totalSales}</div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 text-white/60 text-sm mb-2"><Package className="w-4 h-4" /> Produits actifs</div>
            <div className="text-2xl font-bold">{products.filter(p => p.active).length}</div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto">
          {(['products','orders','settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${tab === t ? 'bg-brand-purple' : 'bg-white/5'}`}>
              {t === 'products' ? 'Produits' : t === 'orders' ? 'Commandes' : 'Boutique'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/40 text-center py-20">Chargement...</div>
        ) : (
          <>
            {tab === 'products' && (
              <ProductsTab
                products={products}
                onAdd={() => { setEditingProduct(null); setShowProductModal(true); }}
                onEdit={(p: any) => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={async (id: string) => {
                  if (!confirm('Supprimer ce produit ?')) return;
                  await api.deleteProduct(id); loadAll();
                }}
                onManageSerials={(p: any) => setSerialModalFor(p)}
              />
            )}
            {tab === 'orders' && <OrdersTab orders={orders} />}
            {tab === 'settings' && <SettingsTab shop={shop} onSaved={refresh} />}
          </>
        )}
      </main>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowProductModal(false)}
          onSaved={() => { setShowProductModal(false); loadAll(); }}
        />
      )}
      {serialModalFor && (
        <SerialsModal
          product={serialModalFor}
          onClose={() => setSerialModalFor(null)}
          onSaved={() => { setSerialModalFor(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// ============ PRODUCTS TAB ============

function ProductsTab({ products, onAdd, onEdit, onDelete, onManageSerials }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vos produits</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-purple rounded-lg font-medium hover:scale-105 transition">
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      {products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-white/30 mb-4" />
          <p className="text-white/60 mb-4">Aucun produit pour l'instant</p>
          <button onClick={onAdd} className="px-6 py-2 bg-brand-purple rounded-lg font-medium">
            Créer mon premier produit
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-brand-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-sm text-white/50 truncate">{p.description || 'Sans description'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(p.price_cents, p.currency)}</div>
                <div className="text-xs text-white/40">
                  {p.delivery_type === 'serials' ? 'Clés/Serials' :
                   p.delivery_type === 'file' ? 'Fichier' :
                   p.delivery_type === 'discord' ? 'Discord' : 'Texte'}
                </div>
              </div>
              <div className="flex gap-2">
                {p.delivery_type === 'serials' && (
                  <button onClick={() => onManageSerials(p)} title="Gérer les clés"
                    className="p-2 hover:bg-white/10 rounded-lg"><Key className="w-4 h-4" /></button>
                )}
                <button onClick={() => onEdit(p)} className="p-2 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(p.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ ORDERS TAB ============

function OrdersTab({ orders }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Commandes récentes</h2>
      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-white/30 mb-4" />
          <p className="text-white/60">Aucune commande pour le moment</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/60">
                <th className="p-3">Produit</th>
                <th className="p-3 hidden md:table-cell">Client</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
                <th className="p-3 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-white/5">
                  <td className="p-3 font-medium">{o.product_name}</td>
                  <td className="p-3 hidden md:table-cell text-white/60">{o.buyer_email}</td>
                  <td className="p-3">{formatPrice(o.amount_cents, o.currency)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      o.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-white/60'
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-white/40 text-xs">
                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============

function SettingsTab({ shop, onSaved }: any) {
  const [name, setName] = useState(shop.name);
  const [slug, setSlug] = useState(shop.slug);
  const [description, setDescription] = useState(shop.description || '');
  const [theme, setTheme] = useState(shop.theme_color || '#7C3AED');
  const [logo, setLogo] = useState(shop.logo_url || '');
  const [banner, setBanner] = useState(shop.banner_url || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateShop({ name, slug, description, theme_color: theme, logo_url: logo, banner_url: banner });
      setMsg('✅ Enregistré');
      onSaved?.();
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Paramètres de la boutique</h2>
      <div className="glass-card p-6 space-y-4">
        <Field label="Nom de la boutique">
          <input value={name} onChange={e => setName(e.target.value)} className="input" />
        </Field>
        <Field label="URL de la boutique" hint={`sellup.app/s/${slug}`}>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="input" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input" />
        </Field>
        <Field label="URL du logo (carré, recommandé 200×200)">
          <input value={logo} onChange={e => setLogo(e.target.value)} className="input" placeholder="https://..." />
        </Field>
        <Field label="URL de la bannière (16:9, recommandé 1600×400)">
          <input value={banner} onChange={e => setBanner(e.target.value)} className="input" placeholder="https://..." />
        </Field>
        <Field label="Couleur principale">
          <div className="flex items-center gap-3">
            <input type="color" value={theme} onChange={e => setTheme(e.target.value)} className="w-12 h-10 rounded bg-transparent border border-white/10" />
            <input value={theme} onChange={e => setTheme(e.target.value)} className="input flex-1" />
          </div>
        </Field>

        {msg && <p className="text-sm">{msg}</p>}
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-brand-purple rounded-lg font-medium hover:scale-105 transition disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

// ============ PRODUCT MODAL ============

function ProductModal({ product, onClose, onSaved }: any) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? (product.price_cents / 100).toString() : '');
  const [currency, setCurrency] = useState(product?.currency || 'EUR');
  const [image, setImage] = useState(product?.image_url || '');
  const [type, setType] = useState(product?.delivery_type || 'text');
  const [payload, setPayload] = useState(product?.delivery_payload || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const data = {
        name, description,
        price_cents: Math.round(parseFloat(price) * 100),
        currency, image_url: image || null,
        delivery_type: type,
        delivery_payload: type === 'serials' ? null : payload,
      };
      if (isEdit) await api.updateProduct(product.id, data);
      else await api.createProduct(data);
      onSaved();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card p-6 w-full max-w-lg my-8">
        <h3 className="text-xl font-bold mb-4">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h3>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nom du produit">
            <input required value={name} onChange={e => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix">
              <input type="number" step="0.01" min="0" required value={price} onChange={e => setPrice(e.target.value)} className="input" />
            </Field>
            <Field label="Devise">
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="input">
                <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
            </Field>
          </div>
          <Field label="URL image du produit (optionnel)">
            <input value={image} onChange={e => setImage(e.target.value)} className="input" placeholder="https://..." />
          </Field>
          <Field label="Type de livraison">
            <select value={type} onChange={e => setType(e.target.value)} className="input">
              <option value="text">Texte / Lien (le même pour tous)</option>
              <option value="serials">Clés / Serials (unique par achat)</option>
              <option value="discord">Invitation Discord</option>
              <option value="file">Fichier (URL R2)</option>
            </select>
          </Field>
          {type !== 'serials' && (
            <Field label={
              type === 'discord' ? 'Lien d\'invitation Discord' :
              type === 'file' ? 'URL du fichier (R2)' :
              'Contenu livré (lien, code, message...)'
            }>
              <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={2} className="input" />
            </Field>
          )}
          {type === 'serials' && isEdit && (
            <p className="text-xs text-white/50">💡 Ajoutez vos clés via le bouton 🔑 dans la liste après création.</p>
          )}

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

// ============ SERIALS MODAL ============

function SerialsModal({ product, onClose, onSaved }: any) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    const serials = text.split('\n').map(s => s.trim()).filter(Boolean);
    if (serials.length === 0) return;
    setSaving(true); setMsg('');
    try {
      const { added } = await api.addSerials(product.id, serials);
      setMsg(`✅ ${added} clé(s) ajoutée(s)`);
      setText('');
      setTimeout(onSaved, 800);
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-2">Stock de clés — {product.name}</h3>
        <p className="text-sm text-white/60 mb-4">Une clé par ligne. Chaque acheteur recevra une clé unique.</p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          className="input font-mono text-sm" placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY" />
        {msg && <p className="text-sm mt-2">{msg}</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5">Fermer</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 bg-brand-purple rounded-lg font-medium disabled:opacity-50">
            {saving ? '...' : 'Ajouter au stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
