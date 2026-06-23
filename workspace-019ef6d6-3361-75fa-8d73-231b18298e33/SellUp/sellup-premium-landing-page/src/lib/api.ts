const TOKEN_KEY = 'sellup_token';
const ACTIVE_SHOP_KEY = 'sellup_active_shop';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export const getActiveShopId = () => localStorage.getItem(ACTIVE_SHOP_KEY);
export const setActiveShopId = (id: string | null) => {
  if (id) localStorage.setItem(ACTIVE_SHOP_KEY, id);
  else localStorage.removeItem(ACTIVE_SHOP_KEY);
};

async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const shopId = getActiveShopId();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers['authorization'] = `Bearer ${token}`;
  if (shopId) headers['x-shop-id'] = shopId;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; user: any; shop: any }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: any; shop: any }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  demoSeed: () =>
    request<{ token: string; user: any; shop: any; demo_password: string }>('/api/demo/seed', { method: 'POST' }),
  me: () => request<{ user: any; shop: any }>('/api/me'),

  // Multi-shops
  listShops: () => request<{ shops: any[]; plan: string; limit: number }>('/api/shops'),
  createShop: (name: string) => request<{ shop: any }>('/api/shops', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteShop: (id: string) => request<{ ok: boolean }>(`/api/shops/${id}`, { method: 'DELETE' }),

  // Balance & withdrawals
  getBalance: () => request<{ balances: any[]; withdrawals: any[] }>('/api/balance'),
  requestWithdrawal: (method: string, amount_cents: number, destination: string) =>
    request<{ id: string; status: string; fee_cents: number }>('/api/withdrawals', {
      method: 'POST', body: JSON.stringify({ method, amount_cents, destination }),
    }),

  // Live viewers (seller side)
  viewerCount: () => request<{ total: number; on_shop: number; on_product: number; on_checkout: number }>('/api/viewers/count'),

  // AI Assistant
  aiQuota: () => request<{ used: number; limit: number; plan: string }>('/api/ai/quota'),
  aiInsights: () => request<{ insights: any[]; cached: boolean; generated_at: number; quota?: any }>('/api/ai/insights'),
  aiInsightsRefresh: () => request<{ ok: boolean }>('/api/ai/insights/refresh', { method: 'POST' }),
  aiChat: (messages: { role: string; content: string }[]) =>
    request<{ message: string; quota: any }>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),

  updateShop: (data: any) =>
    request<{ shop: any }>('/api/shop', { method: 'PATCH', body: JSON.stringify(data) }),

  analytics: () => request<any>('/api/analytics'),

  listProducts: () => request<{ products: any[] }>('/api/products'),
  createProduct: (data: any) =>
    request<{ product: any }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request<{ product: any }>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),
  addSerials: (id: string, serials: string[]) =>
    request<{ added: number }>(`/api/products/${id}/serials`, {
      method: 'POST', body: JSON.stringify({ serials }),
    }),
  countSerials: (id: string) => request<{ available: number; total: number }>(`/api/products/${id}/serials/count`),

  listOrders: () => request<{ orders: any[] }>('/api/orders'),
  exportOrdersUrl: () => '/api/orders/export',

  listCoupons: () => request<{ coupons: any[] }>('/api/coupons'),
  createCoupon: (data: any) =>
    request<{ coupon: any }>('/api/coupons', { method: 'POST', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) =>
    request<{ ok: boolean }>(`/api/coupons/${id}`, { method: 'DELETE' }),

  // Public
  getShop: (slug: string) =>
    request<{ shop: any; products: any[]; stats: any; maintenance?: boolean }>(`/api/public/shop/${slug}`),
  getProduct: (id: string) =>
    request<{ product: any; reviews: any[] }>(`/api/public/product/${id}`),
  validateCoupon: (shop_slug: string, code: string) =>
    request<{ code: string; discount_percent: number | null; discount_cents: number | null }>('/api/public/coupon/validate', {
      method: 'POST', body: JSON.stringify({ shop_slug, code }),
    }),
  checkout: (product_id: string, buyer_email: string, quantity = 1, coupon_code?: string) =>
    request<{ order_id: string; total_cents: number; discount_cents: number }>('/api/public/checkout', {
      method: 'POST', body: JSON.stringify({ product_id, buyer_email, quantity, coupon_code }),
    }),
  payOrder: (order_id: string) =>
    request<{ ok: boolean }>(`/api/public/orders/${order_id}/pay`, { method: 'POST' }),
  getOrder: (order_id: string) =>
    request<{ order: any }>(`/api/public/orders/${order_id}`),
  submitReview: (order_id: string, rating: number, comment: string) =>
    request<{ ok: boolean }>('/api/public/review', {
      method: 'POST', body: JSON.stringify({ order_id, rating, comment }),
    }),
};

export const formatPrice = (cents: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);

export const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d}j`;
  return new Date(ts).toLocaleDateString('fr-FR');
};
