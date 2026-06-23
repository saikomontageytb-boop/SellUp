const TOKEN_KEY = 'sellup_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<{ token: string; user: any; shop: any }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: any; shop: any }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: any; shop: any }>('/api/me'),

  // Shop
  updateShop: (data: any) =>
    request<{ shop: any }>('/api/shop', { method: 'PATCH', body: JSON.stringify(data) }),

  // Products (seller)
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

  // Orders
  listOrders: () => request<{ orders: any[] }>('/api/orders'),

  // Public
  getShop: (slug: string) =>
    request<{ shop: any; products: any[] }>(`/api/public/shop/${slug}`),
  getProduct: (id: string) =>
    request<{ product: any }>(`/api/public/product/${id}`),
  checkout: (product_id: string, buyer_email: string) =>
    request<{ order_id: string }>('/api/public/checkout', {
      method: 'POST', body: JSON.stringify({ product_id, buyer_email }),
    }),
  payOrder: (order_id: string) =>
    request<{ ok: boolean }>(`/api/public/orders/${order_id}/pay`, { method: 'POST' }),
  getOrder: (order_id: string) =>
    request<{ order: any }>(`/api/public/orders/${order_id}`),
};

export const formatPrice = (cents: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);
