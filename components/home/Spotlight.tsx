"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Counter, Magnetic, Reveal } from "@/components/motion/primitives";
import { useCart } from "@/store/cart";
import { cn, formatINR } from "@/lib/utils";
import type { ProductT } from "@/lib/types";

export default function Spotlight({ product }: { product: ProductT | null }) {
  const ref = useRef<HTMLElement>(null);
  const add = useCart((s) => s.add);
  const firstInStock = product?.sizes.find((s) => s.stock > 0)?.size ?? null;
  const [size, setSize] = useState<string | null>(firstInStock);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-18, 10]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);
  const bgX = useTransform(scrollYProgress, [0, 1], ["10%", "-45%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.9]);

  if (!product) return null;
  const img = product.images[0];
  const stock = product.sizes.find((s) => s.size === size)?.stock ?? 0;

  return (
    <section ref={ref} className="relative overflow-hidden bg-bone py-24 text-ink sm:py-32">
      <motion.div
        aria-hidden
        style={{ x: bgX }}
        className="display pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[32vw] leading-none text-ink/[0.05]"
      >
        Spotlight · Spotlight
      </motion.div>

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-2">
        <motion.div style={{ y: imgY, scale }} className="relative mx-auto aspect-square w-full max-w-xl">
          <div className="absolute inset-[8%] rounded-full bg-volt" />
          <motion.div style={{ rotate }} className="absolute inset-0 overflow-hidden rounded-[40px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5)]">
            {img && <Image src={img.url} alt={product.name} fill sizes="(max-width: 1024px) 90vw, 45vw" className="object-cover" />}
          </motion.div>
          <motion.div
            className="absolute -bottom-4 -left-2 rounded-2xl bg-ink px-5 py-4 text-bone shadow-2xl sm:left-4"
            initial={{ opacity: 0, y: 30, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: -3 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-mist">Rated</p>
            <p className="flex items-center gap-1.5 text-2xl font-bold">
              <Star className="h-5 w-5 fill-volt text-volt" /> {product.rating.toFixed(1)}
              <span className="text-sm font-normal text-mist">/ 5</span>
            </p>
          </motion.div>
        </motion.div>

        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-ink/60">
              <span className="h-px w-10 bg-ink/40" /> Product spotlight · {product.brand}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display mt-4 text-6xl sm:text-7xl xl:text-8xl">{product.name}</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg text-lg text-ink/70">{product.description.split("\n")[0]}</p>
          </Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {product.highlights.slice(0, 4).map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-ember" /> {h}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-8 grid grid-cols-3 divide-x divide-ink/10 rounded-2xl border border-ink/10">
              <div className="p-4">
                <Counter to={product.soldCount} className="display text-4xl" suffix="+" />
                <p className="text-xs text-ink/60">Pairs sold</p>
              </div>
              <div className="p-4">
                <Counter to={product.reviewCount} className="display text-4xl" />
                <p className="text-xs text-ink/60">Reviews</p>
              </div>
              <div className="p-4">
                <Counter to={product.sizes.length} className="display text-4xl" />
                <p className="text-xs text-ink/60">Sizes</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-8">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">Select size · UK</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock === 0}
                    onClick={() => setSize(s.size)}
                    className={cn(
                      "h-11 min-w-11 rounded-xl border px-3 font-mono text-sm transition-all disabled:opacity-30 disabled:line-through",
                      size === s.size ? "border-ink bg-ink text-bone" : "border-ink/20 hover:border-ink",
                    )}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <p className="display text-5xl">{formatINR(product.price)}</p>
              <Magnetic>
                <button
                  disabled={!size || stock === 0}
                  onClick={() => {
                    if (!size) return;
                    add({
                      productId: product._id,
                      slug: product.slug,
                      name: product.name,
                      brand: product.brand,
                      image: img?.url,
                      size,
                      color: product.colors[0]?.name,
                      price: product.price,
                      compareAtPrice: product.compareAtPrice,
                      maxQty: stock,
                    });
                    toast.success("Added to bag", { description: `${product.name} · UK ${size}` });
                  }}
                  className="btn bg-ink px-8 py-4 text-bone hover:bg-ember"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to bag
                </button>
              </Magnetic>
              <Link href={`/product/${product.slug}`} className="group flex items-center gap-2 font-semibold">
                Full details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
