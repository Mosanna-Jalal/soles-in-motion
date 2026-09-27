"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/utils";
import type { ProductT } from "@/lib/types";

function DropCard({ product, i, total, progress }: { product: ProductT; i: number; total: number; progress: MotionValue<number> }) {
  const start = i / total;
  const imgX = useTransform(progress, [Math.max(0, start - 0.3), Math.min(1, start + 0.3)], ["-12%", "12%"]);
  return (
    <Link
      href={`/product/${product.slug}`}
      data-cursor="View"
      className="group relative flex h-[62vh] w-[78vw] shrink-0 flex-col overflow-hidden rounded-[28px] bg-ink-3 sm:w-[46vw] lg:w-[34vw]"
    >
      <div className="relative flex-1 overflow-hidden bg-bone-2">
        <motion.div className="absolute -inset-x-[14%] inset-y-0" style={{ x: imgX }}>
          {product.images[0] && (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 80vw, 40vw"
              className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          )}
        </motion.div>
        <span className="display absolute left-5 top-4 text-7xl text-ink/80 mix-blend-overlay">{String(i + 1).padStart(2, "0")}</span>
        <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-ink text-bone transition-all duration-500 group-hover:rotate-45 group-hover:bg-volt group-hover:text-ink">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="eyebrow text-mist">{product.brand}</p>
          <p className="display mt-1 line-clamp-1 text-3xl">{product.name}</p>
        </div>
        <p className="shrink-0 font-mono text-lg text-volt">{formatINR(product.price)}</p>
      </div>
    </Link>
  );
}

/** Vertical scroll drives a horizontal track while the section is pinned. */
export default function FeaturedDrop({ products }: { products: ProductT[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products.length]);

  if (!products.length) return null;

  return (
    <section ref={section} className="relative bg-ink" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-x mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-volt">The drop · {products.length} picks</p>
            <h2 className="display mt-3 text-6xl sm:text-8xl">
              Editor&apos;s <span className="text-outline">heat</span>
            </h2>
          </div>
          <div className="hidden w-64 sm:block">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-mist">
              <span>Scroll</span>
              <span>→</span>
            </div>
            <div className="mt-2 h-[2px] bg-ink-4">
              <motion.div className="h-full bg-volt" style={{ width: bar }} />
            </div>
          </div>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-5 pl-4 pr-10 sm:pl-6 lg:pl-10">
          {products.map((p, i) => (
            <DropCard key={p._id} product={p} i={i} total={products.length} progress={scrollYProgress} />
          ))}
          <Link
            href="/shop?tag=bestseller"
            data-cursor="All"
            className="group flex h-[62vh] w-[60vw] shrink-0 flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-line sm:w-[30vw] lg:w-[22vw]"
          >
            <span className="grid h-24 w-24 place-items-center rounded-full bg-volt text-ink transition-transform duration-500 group-hover:scale-110">
              <ArrowUpRight className="h-8 w-8" />
            </span>
            <span className="display text-4xl">See every drop</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
