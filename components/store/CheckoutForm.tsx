"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Banknote, CreditCard, LoaderCircle, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CouponBox, { useCoupon } from "./CouponBox";
import OrderSummary from "./OrderSummary";
import { useCartSync } from "./CartLine";
import { cartSubtotal, useCart } from "@/store/cart";
import { computeTotals, type PricingSettings } from "@/lib/pricing";
import { api, useMounted } from "@/lib/hooks";
import { cn, formatINR } from "@/lib/utils";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

const PAYMENTS = [
  { id: "cod", label: "Cash on delivery", note: "Pay when your order arrives", icon: Banknote },
  { id: "upi", label: "UPI", note: "GPay, PhonePe, Paytm & more", icon: Smartphone },
  { id: "card", label: "Card", note: "Visa, Mastercard, RuPay", icon: CreditCard },
] as const;

type Prefill = { name?: string; email?: string; phone?: string; address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string } };

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-8"
    >
      <h2 className="flex items-center gap-3 text-lg font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-volt font-mono text-sm text-ink">{n}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

export default function CheckoutForm({ pricing, prefill, signedIn }: { pricing: PricingSettings; prefill: Prefill; signedIn: boolean }) {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  useCartSync(true);
  const subtotal = cartSubtotal(items);
  const coupon = useCoupon(subtotal);
  const totals = computeTotals(subtotal, coupon.applied?.discount ?? 0, pricing);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]["id"]>("cod");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: prefill.email ?? "",
    name: prefill.name ?? "",
    phone: prefill.phone ?? "",
    line1: prefill.address?.line1 ?? "",
    line2: prefill.address?.line2 ?? "",
    city: prefill.address?.city ?? "",
    state: prefill.address?.state ?? "",
    pincode: prefill.address?.pincode ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!mounted) return <div className="container-x pt-44"><div className="skeleton h-96 rounded-3xl" /></div>;

  if (!items.length) {
    return (
      <div className="container-x grid place-items-center pb-10 pt-44 text-center">
        <p className="display text-6xl">Your bag is empty</p>
        <Link href="/shop" className="btn-volt mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (payment !== "cod") await new Promise((r) => setTimeout(r, 1200)); // demo gateway handshake
      const res = await api<{ orderNumber: string; accessToken: string }>("/api/orders", {
        method: "POST",
        json: {
          email: form.email,
          customer: { name: form.name, phone: form.phone },
          shippingAddress: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode, country: "India" },
          items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
          couponCode: coupon.applied?.code,
          paymentMethod: payment,
        },
      });
      clear();
      router.push(`/order/${res.orderNumber}?t=${res.accessToken}&new=1`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={placeOrder} className="container-x grid gap-8 pb-10 pt-32 sm:pt-40 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="display text-6xl sm:text-8xl">Checkout</h1>
          {!signedIn && (
            <Link href="/login?next=/checkout" className="pb-2 text-sm text-mist hover:text-volt">
              Have an account? <span className="underline">Sign in</span>
            </Link>
          )}
        </div>

        <Section n={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Email</span>
              <input required type="email" value={form.email} onChange={set("email")} className="field" autoComplete="email" />
            </label>
            <label>
              <span className="label">Full name</span>
              <input required value={form.name} onChange={set("name")} className="field" autoComplete="name" />
            </label>
            <label>
              <span className="label">Phone</span>
              <input required value={form.phone} onChange={set("phone")} className="field" autoComplete="tel" placeholder="+91 98765 43210" />
            </label>
          </div>
        </Section>

        <Section n={2} title="Shipping address">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Address</span>
              <input required value={form.line1} onChange={set("line1")} className="field" autoComplete="address-line1" placeholder="House no., street, area" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Landmark (optional)</span>
              <input value={form.line2} onChange={set("line2")} className="field" autoComplete="address-line2" />
            </label>
            <label>
              <span className="label">City</span>
              <input required value={form.city} onChange={set("city")} className="field" autoComplete="address-level2" />
            </label>
            <label>
              <span className="label">PIN code</span>
              <input required value={form.pincode} onChange={set("pincode")} pattern="\d{6}" inputMode="numeric" maxLength={6} className="field" autoComplete="postal-code" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">State</span>
              <select required value={form.state} onChange={set("state")} className="field">
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        <Section n={3} title="Payment">
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENTS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition-all",
                  payment === p.id ? "border-volt bg-volt/10" : "border-line hover:border-bone/40",
                )}
              >
                {payment === p.id && <motion.span layoutId="pay-ring" className="absolute inset-0 rounded-2xl ring-2 ring-volt" />}
                <p.icon className={cn("h-6 w-6", payment === p.id ? "text-volt" : "text-mist")} />
                <p className="mt-3 font-semibold">{p.label}</p>
                <p className="text-xs text-mist">{p.note}</p>
              </button>
            ))}
          </div>
          {payment !== "cod" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <div className="mt-5 rounded-2xl border border-dashed border-line p-4 text-sm text-mist">
                <p className="flex items-center gap-2 font-semibold text-bone">
                  <ShieldCheck className="h-4 w-4 text-volt" /> Demo payment mode
                </p>
                <p className="mt-1">
                  No real charge is made. Online payments are simulated and the order is marked as paid — connect a gateway such as Razorpay
                  before going live.
                </p>
              </div>
            </motion.div>
          )}
        </Section>
      </div>

      <aside className="h-fit space-y-6 rounded-[28px] border border-line bg-ink-2 p-6 lg:sticky lg:top-28">
        <p className="display text-3xl">Order summary</p>
        <ul className="thin-scroll max-h-72 space-y-4 overflow-y-auto pr-1" data-lenis-prevent>
          {items.map((i) => (
            <li key={i.key} className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bone-2">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                <span className="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-ink font-mono text-[10px]">{i.qty}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-semibold">{i.name}</p>
                <p className="font-mono text-xs text-mist">UK {i.size}</p>
              </div>
              <p className="font-mono text-sm">{formatINR(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <CouponBox coupon={coupon} />
        <OrderSummary totals={totals} couponCode={coupon.applied?.code} />
        <button disabled={busy} className="btn-volt w-full py-4 text-base">
          {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
          {busy ? "Placing order…" : payment === "cod" ? `Place order · ${formatINR(totals.total)}` : `Pay ${formatINR(totals.total)}`}
        </button>
        <p className="text-center text-xs text-mist">By placing your order you agree to our terms & returns policy.</p>
      </aside>
    </form>
  );
}
