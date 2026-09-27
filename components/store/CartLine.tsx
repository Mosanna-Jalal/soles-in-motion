"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useCart, type CartItem } from "@/store/cart";
import { formatINR } from "@/lib/utils";

export function CartLine({ item, compact = false, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 overflow-hidden border-b border-line py-5"
    >
      <Link
        href={`/product/${item.slug}`}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden rounded-xl bg-bone-2 ${compact ? "h-24 w-24" : "h-32 w-32"}`}
      >
        {item.image && <Image src={item.image} alt={item.name} fill sizes="128px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-mist">{item.brand}</p>
            <Link href={`/product/${item.slug}`} onClick={onNavigate} className="line-clamp-2 font-semibold leading-snug hover:text-volt">
              {item.name}
            </Link>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mist">
              UK {item.size}
              {item.color ? ` · ${item.color}` : ""}
            </p>
          </div>
          <button onClick={() => remove(item.key)} className="rounded-full p-1.5 text-mist hover:bg-bone/10 hover:text-ember" aria-label={`Remove ${item.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex items-center rounded-full border border-line">
            <button
              onClick={() => setQty(item.key, item.qty - 1)}
              disabled={item.qty <= 1}
              className="p-2 text-bone/80 hover:text-volt disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center font-mono text-sm tabular-nums">{item.qty}</span>
            <button
              onClick={() => setQty(item.key, item.qty + 1)}
              disabled={item.qty >= Math.min(10, item.maxQty)}
              className="p-2 text-bone/80 hover:text-volt disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <p className="font-mono text-xs text-mist line-through">{formatINR(item.compareAtPrice * item.qty)}</p>
            )}
            <p className="font-mono font-semibold">{formatINR(item.price * item.qty)}</p>
          </div>
        </div>
        {item.qty >= item.maxQty && item.maxQty <= 3 && (
          <p className="mt-2 text-xs text-ember">Only {item.maxQty} left in this size</p>
        )}
      </div>
    </motion.li>
  );
}

/** Refreshes prices & stock for items in the bag from the server. */
export function useCartSync(active = true) {
  const items = useCart((s) => s.items);
  const sync = useCart((s) => s.sync);
  const last = useRef("");

  const run = useCallback(async () => {
    const list = useCart.getState().items;
    if (!list.length) return;
    try {
      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: list.map((i) => ({ key: i.key, productId: i.productId, size: i.size })) }),
      });
      if (!res.ok) return;
      const { updates } = await res.json();
      sync(updates);
    } catch {
      /* offline — keep cached bag */
    }
  }, [sync]);

  const signature = items.map((i) => i.key).join("|");
  useEffect(() => {
    if (!active || signature === last.current) return;
    last.current = signature;
    run();
  }, [active, signature, run]);
}
