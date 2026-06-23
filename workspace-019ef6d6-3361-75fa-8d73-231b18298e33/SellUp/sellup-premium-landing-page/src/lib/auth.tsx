import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, getActiveShopId, setActiveShopId } from './api';

interface AuthState {
  user: any | null;
  shop: any | null;
  shops: any[];
  plan: string;
  limit: number;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  switchShop: (id: string) => Promise<void>;
  createShop: (name: string) => Promise<any>;
  deleteShop: (id: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [plan, setPlan] = useState<string>('free');
  const [limit, setLimit] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  const loadShops = async () => {
    try {
      const r = await api.listShops();
      setShops(r.shops);
      setPlan(r.plan);
      setLimit(r.limit);
      // Ensure active shop is valid; otherwise pick first
      const active = getActiveShopId();
      const found = r.shops.find((s: any) => s.id === active);
      if (!found && r.shops.length) {
        setActiveShopId(r.shops[0].id);
      }
    } catch {}
  };

  const refresh = async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      await loadShops();
      const { user, shop } = await api.me();
      setUser(user); setShop(shop);
    } catch {
      setToken(null); setActiveShopId(null); setUser(null); setShop(null); setShops([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const { token, user, shop } = await api.login(email, password);
    setToken(token);
    if (shop?.id) setActiveShopId(shop.id);
    setUser(user); setShop(shop);
    await loadShops();
  };
  const register = async (email: string, password: string) => {
    const { token, user, shop } = await api.register(email, password);
    setToken(token);
    if (shop?.id) setActiveShopId(shop.id);
    setUser(user); setShop(shop);
    await loadShops();
  };
  const logout = () => {
    setToken(null); setActiveShopId(null);
    setUser(null); setShop(null); setShops([]);
  };

  const switchShop = async (id: string) => {
    setActiveShopId(id);
    const { user, shop } = await api.me();
    setUser(user); setShop(shop);
  };

  const createShop = async (name: string) => {
    const r = await api.createShop(name);
    await loadShops();
    return r.shop;
  };

  const deleteShop = async (id: string) => {
    await api.deleteShop(id);
    if (getActiveShopId() === id) {
      setActiveShopId(null);
    }
    await loadShops();
    const { user, shop } = await api.me();
    setUser(user); setShop(shop);
  };

  return (
    <Ctx.Provider value={{ user, shop, shops, plan, limit, loading, login, register, logout, refresh, switchShop, createShop, deleteShop }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
