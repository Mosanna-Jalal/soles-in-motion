"use client";

import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, TicketPercent, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { api } from "@/lib/hooks";

export interface AppliedCoupon {
  code: string;
  description?: string;
  discount: number;
}

/** Validates the coupon against the server whenever the code or subtotal changes. */
export function useCoupon(subtotal: number) {
  const code = useCart((s) => s.couponCode);
  const setCode = useCart((s) => s.setCoupon);
  const key = code && subtotal > 0 ? `${code}:${subtotal}` : null;
  // Result of the last validation, tagged with the code+subtotal it was computed for.
  const [result, setResult] = useState<{ key: string; applied: AppliedCoupon | null; error: string | null } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api<AppliedCoupon>("/api/coupons/validate", { method: "POST", json: { code, subtotal } })
      .then((c) => !cancelled && setResult({ key, applied: c, error: null }))
      .catch((e: Error) => !cancelled && setResult({ key, applied: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, code, subtotal]);

  const current = key && result?.key === key ? result : null;
  return {
    code,
    setCode,
    applied: current?.applied ?? null,
    error: current?.error && dismissed !== current.key ? current.error : null,
    loading: !!key && !current,
    setError: () => setDismissed(key),
  };
}

export default function CouponBox({ coupon }: { coupon: ReturnType<typeof useCoupon> }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {coupon.applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-volt/60 bg-volt/10 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm">
              <TicketPercent className="h-4 w-4 text-volt" />
              <b className="font-mono">{coupon.applied.code}</b>
              <span className="text-mist">{coupon.applied.description}</span>
            </span>
            <button onClick={() => coupon.setCode(null)} className="rounded-full p-1 hover:bg-bone/10" aria-label="Remove coupon">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) coupon.setCode(value.trim().toUpperCase());
            }}
            className="flex gap-2"
          >
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value.toUpperCase());
                coupon.setError();
              }}
              placeholder="Discount code"
              className="field py-2.5 font-mono uppercase"
              aria-label="Discount code"
            />
            <button className="rounded-xl bg-bone px-4 text-sm font-bold text-ink hover:bg-volt" disabled={coupon.loading}>
              {coupon.loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {coupon.error && <p className="mt-2 text-xs text-ember">{coupon.error}</p>}
    </div>
  );
}
