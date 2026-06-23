import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CartItem {
  product_id: string;
  variant_id?: string;
  name: string;
  variant_name?: string;
  image_url?: string;
  price_cents: number;
  currency: string;
  quantity: number;
  shop_slug: string;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (product_id: string, variant_id?: string) => void;
  updateQty: (product_id: string, variant_id: string | undefined, qty: number) => void;
  clear: (shop_slug?: string) => void;
  isOpen: boolean;
  setOpen: (b: boolean) => void;
  totalItems: number;
  total: (shop_slug?: string) => number;
  byShop: () => Record<string, CartItem[]>;
}

const Ctx = createContext<CartState | null>(null);
const KEY = 'sellup_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) => {
    setItems(curr => {
      const existing = curr.find(i => i.product_id === item.product_id && i.variant_id === item.variant_id);
      if (existing) {
        return curr.map(i =>
          (i.product_id === item.product_id && i.variant_id === item.variant_id)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...curr, item];
    });
  };

  const remove = (product_id: string, variant_id?: string) =>
    setItems(curr => curr.filter(i => !(i.product_id === product_id && i.variant_id === variant_id)));

  const updateQty = (product_id: string, variant_id: string | undefined, qty: number) =>
    setItems(curr => curr.map(i =>
      (i.product_id === product_id && i.variant_id === variant_id)
        ? { ...i, quantity: Math.max(1, qty) }
        : i
    ));

  const clear = (shop_slug?: string) =>
    setItems(curr => shop_slug ? curr.filter(i => i.shop_slug !== shop_slug) : []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const total = (shop_slug?: string) => {
    const list = shop_slug ? items.filter(i => i.shop_slug === shop_slug) : items;
    return list.reduce((s, i) => s + i.price_cents * i.quantity, 0);
  };

  const byShop = () => {
    const out: Record<string, CartItem[]> = {};
    for (const i of items) {
      if (!out[i.shop_slug]) out[i.shop_slug] = [];
      out[i.shop_slug].push(i);
    }
    return out;
  };

  return <Ctx.Provider value={{ items, add, remove, updateQty, clear, isOpen, setOpen, totalItems, total, byShop }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be in CartProvider');
  return ctx;
};
