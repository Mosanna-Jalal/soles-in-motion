"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/store/ProductCard";
import { Reveal, SplitText } from "@/components/motion/primitives";
import type { ProductT } from "@/lib/types";

/** Draggable product rail with momentum and arrow controls. */
export default function Carousel({ products, eyebrow, title }: { products: ProductT[]; eyebrow: string; title: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!viewport.current || !track.current) return;
      setMax(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products.length]);

  const step = (dir: 1 | -1) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const w = (card?.offsetWidth ?? 300) + 20;
    const next = Math.min(0, Math.max(-max, x.get() - dir * w * 2));
    animate(x, next, { type: "spring", stiffness: 200, damping: 30 });
  };

  if (!products.length) return null;

  return (
    <section className="overflow-hidden py-24 sm:py-32">
      <div className="container-x mb-12 flex items-end justify-between gap-6">
        <div>
          <Reveal>
            <p className="eyebrow text-volt">{eyebrow}</p>
          </Reveal>
          <SplitText as="h2" text={title} className="display mt-3 block text-6xl sm:text-8xl" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => step(-1)} className="grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:border-volt hover:bg-volt hover:text-ink" aria-label="Previous">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => step(1)} className="grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:border-volt hover:bg-volt hover:text-ink" aria-label="Next">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={viewport} className="container-x" data-cursor="Drag">
        <motion.div
          ref={track}
          className="flex gap-5"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -max, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        >
          {products.map((p) => (
            <div key={p._id} className="w-[70vw] shrink-0 sm:w-[42vw] md:w-[30vw] xl:w-[22vw]" onDragStart={(e) => e.preventDefault()}>
              <ProductCard product={p} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
