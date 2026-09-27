"use client";

import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { CartLine, useCartSync } from "./CartLine";
import CouponBox, { useCoupon } from "./CouponBox";
import OrderSummary from "./OrderSummary";
import { SplitText } from "@/components/motion/primitives";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { computeTotals, type PricingSettings } from "@/lib/pricing";
import { useMounted } from "@/lib/hooks";

export default function CartView({ pricing }: { pricing: PricingSettings }) {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  useCartSync(true);
  const subtotal = cartSubtotal(items);
  const coupon = useCoupon(subtotal);
  const totals = computeTotals(subtotal, coupon.applied?.discount ?? 0, pricing);

  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <SplitText as="h1" trigger="mount" text="Your bag" className="display block text-7xl sm:text-9xl" />
      {!mounted ? (
        <div className="skeleton mt-10 h-64 rounded-3xl" />
      ) : items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-[32px] border border-dashed border-line py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-volt" />
          <p className="display mt-6 text-5xl">Nothing here yet</p>
          <p className="mt-2 text-mist">Your bag is waiting for its first pair.</p>
          <Link href="/shop" className="btn-volt mt-8">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-mist">{cartCount(items)} items</p>
            <ul className="mt-2">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <CartLine key={i.key} item={i} />
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <aside className="h-fit space-y-6 rounded-[28px] border border-line bg-ink-2 p-6 lg:sticky lg:top-28">
            <p className="display text-3xl">Summary</p>
            <CouponBox coupon={coupon} />
            <OrderSummary totals={totals} couponCode={coupon.applied?.code} />
            <Link href="/checkout" className="btn-volt w-full py-4 text-base">
              <Lock className="h-4 w-4" /> Secure checkout
            </Link>
            <Link href="/shop" className="block text-center text-sm text-mist hover:text-volt">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
