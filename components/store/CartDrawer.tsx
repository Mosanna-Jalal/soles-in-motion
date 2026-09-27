"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShoppingBag, Truck, X } from "lucide-react";
import { useEffect } from "react";
import { CartLine, useCartSync } from "./CartLine";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useMounted, useScrollLock } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";

export default function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const mounted = useMounted();
  const { items, open, setOpen } = useCart();
  const pathname = usePathname();
  useScrollLock(open);
  useCartSync(open);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!mounted) return null;

  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-ink-2"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="display text-3xl">
                Your bag <span className="font-mono text-base text-mist">({cartCount(items)})</span>
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-bone/10" aria-label="Close bag">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <motion.div
                  initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                  className="grid h-24 w-24 place-items-center rounded-full bg-ink-3"
                >
                  <ShoppingBag className="h-10 w-10 text-volt" />
                </motion.div>
                <p className="display text-4xl">Your bag is empty</p>
                <p className="text-sm text-mist">Nothing in here yet — your next favourite pair is a click away.</p>
                <Link href="/shop" onClick={() => setOpen(false)} className="btn-volt mt-2">
                  Start shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-line px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-volt" />
                    {remaining > 0 ? (
                      <span>
                        Add <b className="text-volt">{formatINR(remaining)}</b> more for free shipping
                      </span>
                    ) : (
                      <span className="font-semibold text-volt">You&apos;ve unlocked free shipping!</span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-4">
                    <motion.div
                      className="h-full rounded-full bg-volt"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
                <ul className="thin-scroll flex-1 overflow-y-auto px-6" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLine key={item.key} item={item} compact onNavigate={() => setOpen(false)} />
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="space-y-4 border-t border-line px-6 py-6">
                  <div className="flex items-center justify-between">
                    <span className="text-mist">Subtotal</span>
                    <span className="font-mono text-xl font-bold">{formatINR(subtotal)}</span>
                  </div>
                  <p className="text-xs text-mist">Taxes included. Shipping & discounts calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/cart" onClick={() => setOpen(false)} className="btn-ghost">
                      View bag
                    </Link>
                    <Link href="/checkout" onClick={() => setOpen(false)} className="btn-volt">
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
