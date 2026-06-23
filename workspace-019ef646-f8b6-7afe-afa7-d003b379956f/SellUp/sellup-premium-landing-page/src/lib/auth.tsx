import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken } from './api';

interface AuthState {
  user: any | null;
  shop: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const { user, shop } = await api.me();
      setUser(user); setShop(shop);
    } catch {
      setToken(null); setUser(null); setShop(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const { token, user, shop } = await api.login(email, password);
    setToken(token); setUser(user); setShop(shop);
  };
  const register = async (email: string, password: string) => {
    const { token, user, shop } = await api.register(email, password);
    setToken(token); setUser(user); setShop(shop);
  };
  const logout = () => { setToken(null); setUser(null); setShop(null); };

  return (
    <Ctx.Provider value={{ user, shop, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
