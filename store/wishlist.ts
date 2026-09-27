"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
  compareAtPrice?: number | null;
}

interface WishState {
  items: WishItem[];
  toggle: (item: WishItem) => boolean;
  remove: (productId: string) => void;
}

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        set((s) => ({ items: exists ? s.items.filter((i) => i.productId !== item.productId) : [item, ...s.items] }));
        return !exists;
      },
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
    }),
    { name: "sim-wishlist" },
  ),
);
