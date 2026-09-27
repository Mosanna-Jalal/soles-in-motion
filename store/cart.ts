"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image?: string;
  size: string;
  color?: string;
  price: number;
  compareAtPrice?: number | null;
  qty: number;
  maxQty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  couponCode: string | null;
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  sync: (updates: Record<string, Partial<CartItem> | null>) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      couponCode: null,
      add: (item, qty = 1) =>
        set((s) => {
          const key = `${item.productId}:${item.size}`;
          const existing = s.items.find((i) => i.key === key);
          const cap = Math.min(10, item.maxQty);
          const items = existing
            ? s.items.map((i) => (i.key === key ? { ...i, ...item, qty: Math.min(cap, i.qty + qty) } : i))
            : [...s.items, { ...item, key, qty: Math.min(cap, qty) }];
          return { items, open: true };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, Math.min(10, i.maxQty))) } : i)),
        })),
      sync: (updates) =>
        set((s) => ({
          items: s.items
            .filter((i) => updates[i.key] !== null)
            .map((i) => {
              const u = updates[i.key];
              if (!u) return i;
              const merged = { ...i, ...u };
              return { ...merged, qty: Math.max(1, Math.min(merged.qty, merged.maxQty || 1)) };
            }),
        })),
      clear: () => set({ items: [], couponCode: null }),
      setOpen: (open) => set({ open }),
      setCoupon: (couponCode) => set({ couponCode }),
    }),
    { name: "sim-cart", partialize: (s) => ({ items: s.items, couponCode: s.couponCode }) },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.price, 0);
