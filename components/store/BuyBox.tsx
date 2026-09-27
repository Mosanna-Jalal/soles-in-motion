"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, LoaderCircle, MapPin, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WishButton } from "./ProductCard";
import { useCart } from "@/store/cart";
import { cn, discountPercent, formatINR, totalStock } from "@/lib/utils";
import type { ProductT } from "@/lib/types";

function Accordion({ title, children, open: initial = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-5 text-left font-semibold">
        {title}
        <ChevronDown className={cn("h-5 w-5 text-mist transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm leading-relaxed text-bone/75">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-volt" /> Check delivery
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d{6}$/.test(pin)) {
            setResult("Enter a valid 6-digit PIN code");
            return;
          }
          const metro = ["1", "4", "5", "6", "7", "8"].includes(pin[0]);
          const days = metro ? 2 : 4;
          const eta = new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
          setResult(`Delivery by ${eta} · COD available`);
        }}
      >
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="PIN code"
          inputMode="numeric"
          className="field py-2.5"
          aria-label="PIN code"
        />
        <button className="rounded-xl border border-line px-4 text-sm font-semibold hover:border-volt hover:text-volt">Check</button>
      </form>
      {result && <p className="mt-2 text-xs text-mist">{result}</p>}
    </div>
  );
}

export default function BuyBox({ product }: { product: ProductT }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0]?.name);
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [shake, setShake] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const cta = useRef<HTMLDivElement>(null);
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = totalStock(product.sizes) === 0;
  const selected = product.sizes.find((s) => s.size === size);
  const category = typeof product.category === "object" ? product.category : null;

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToBag = async (thenCheckout = false) => {
    if (!selected) {
      setShake((s) => s + 1);
      toast.error("Please pick a size first");
      return;
    }
    setState("adding");
    await new Promise((r) => setTimeout(r, 450));
    add({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0]?.url,
      size: selected.size,
      color,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      maxQty: selected.stock,
    });
    setState("added");
    setTimeout(() => setState("idle"), 1800);
    if (thenCheckout) {
      useCart.getState().setOpen(false);
      router.push("/checkout");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-volt">{product.brand}</p>
        <WishButton product={product} className="h-11 w-11 border border-line bg-transparent" />
      </div>
      <h1 className="display mt-3 text-5xl sm:text-6xl">{product.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {product.reviewCount > 0 && (
          <a href="#reviews" className="flex items-center gap-1.5 hover:text-volt">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-volt text-volt" : "text-ink-4")} />
              ))}
            </span>
            <span className="font-mono">{product.rating.toFixed(1)}</span>
            <span className="text-mist">({product.reviewCount} reviews)</span>
          </a>
        )}
        {category && (
          <Link href={`/shop?category=${category.slug}`} className="rounded-full border border-line px-3 py-1 text-xs hover:border-volt">
            {category.name}
          </Link>
        )}
        <span className="rounded-full border border-line px-3 py-1 text-xs capitalize">{product.gender}</span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <p className="display text-5xl">{formatINR(product.price)}</p>
        {off > 0 && (
          <>
            <p className="pb-1 font-mono text-lg text-mist line-through">{formatINR(product.compareAtPrice!)}</p>
            <span className="mb-1.5 rounded-full bg-ember px-2.5 py-1 font-mono text-xs font-bold text-ink">−{off}%</span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-mist">MRP inclusive of all taxes</p>

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm">
            Colour: <span className="font-semibold">{color}</span>
          </p>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                title={c.name}
                aria-label={c.name}
                className={cn("h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-ink transition-all", color === c.name ? "ring-volt" : "ring-transparent hover:ring-line")}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between text-sm">
          <p>
            Size (UK){selected && <span className="ml-1 font-semibold">· {selected.size}</span>}
          </p>
          <Link href="/faq#sizing" className="text-mist underline underline-offset-4 hover:text-volt">
            Size guide
          </Link>
        </div>
        <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.45 }} className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {product.sizes.map((s) => (
            <button
              key={s.size}
              disabled={s.stock === 0}
              onClick={() => setSize(s.size)}
              className={cn(
                "relative rounded-xl border py-3 font-mono text-sm transition-all disabled:cursor-not-allowed disabled:opacity-35",
                size === s.size ? "border-volt bg-volt font-bold text-ink" : "border-line hover:border-bone",
              )}
            >
              {s.size}
              {s.stock === 0 && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-mist" />}
              {s.stock > 0 && s.stock <= 3 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-ember" />}
            </button>
          ))}
        </motion.div>
        <AnimatePresence>
          {selected && selected.stock <= 3 && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-ember">
              Hurry — only {selected.stock} left in UK {selected.size}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div ref={cta} className="mt-8 grid grid-cols-[1fr_auto] gap-3">
        <button disabled={soldOut || state === "adding"} onClick={() => addToBag()} className="btn-volt relative overflow-hidden py-4 text-base">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={state} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
              {soldOut ? (
                "Sold out"
              ) : state === "adding" ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Adding…
                </>
              ) : state === "added" ? (
                <>
                  <Check className="h-5 w-5" /> Added to bag
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" /> Add to bag
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <button disabled={soldOut} onClick={() => addToBag(true)} className="btn-ghost py-4" aria-label="Buy now">
          <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Buy now</span>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
        {[
          [Truck, "Free shipping", "over ₹2,999"],
          [RotateCcw, "30-day", "free returns"],
          [ShieldCheck, "100%", "authentic"],
        ].map(([Icon, a, b]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={a as string} className="rounded-2xl border border-line px-2 py-3">
              <I className="mx-auto h-5 w-5 text-volt" />
              <p className="mt-1.5 font-semibold">{a as string}</p>
              <p className="text-mist">{b as string}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <PincodeCheck />
      </div>

      <div className="mt-6">
        <Accordion title="Highlights" open>
          <ul className="space-y-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-volt" /> {h}
              </li>
            ))}
          </ul>
        </Accordion>
        <Accordion title="Description">
          {product.description.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="mb-3">
              {p}
            </p>
          ))}
        </Accordion>
        <Accordion title="Shipping & returns">
          <p>
            Orders are dispatched within 24–48 hours. Metro cities receive deliveries in 2–3 days; the rest of India in 4–6 days. Free
            shipping on orders over ₹2,999. Returns and size exchanges are free within 30 days — shoes must be unworn with original
            packaging.
          </p>
        </Accordion>
      </div>

      <AnimatePresence>
        {showSticky && !soldOut && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 backdrop-blur-xl"
          >
            <div className="container-x flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="line-clamp-1 font-semibold">{product.name}</p>
                <p className="font-mono text-sm text-volt">{formatINR(product.price)}</p>
              </div>
              <button onClick={() => (selected ? addToBag() : cta.current?.scrollIntoView({ behavior: "smooth", block: "center" }))} className="btn-volt shrink-0">
                <ShoppingBag className="h-4 w-4" /> {selected ? `Add UK ${selected.size}` : "Select size"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
