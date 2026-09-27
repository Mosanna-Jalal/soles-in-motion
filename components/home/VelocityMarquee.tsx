"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef, type ReactNode } from "react";

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/** A marquee whose speed and direction react to scroll velocity. */
function Row({ children, baseVelocity = 3 }: { children: ReactNode; baseVelocity?: number }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const skew = useTransform(smooth, [-2000, 2000], [-8, 8]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * Math.abs(f);
    baseX.set(baseX.get() + move);
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div className="flex whitespace-nowrap" style={{ x, skewX: skew }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex shrink-0 items-center" aria-hidden={i > 0}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function VelocityMarquee({ brands }: { brands: string[] }) {
  const list = brands.length ? brands : ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "Vans", "Converse"];
  return (
    <section className="relative overflow-hidden border-y border-line bg-ink py-8 sm:py-10" aria-label="Brands we carry">
      <Row baseVelocity={-2.5}>
        {list.map((b, i) => (
          <span key={b} className="display flex items-center gap-8 px-8 text-6xl sm:text-8xl">
            <span className={i % 2 ? "text-outline text-bone/60" : ""}>{b}</span>
            <span className="text-3xl text-volt">✦</span>
          </span>
        ))}
      </Row>
      <div className="mt-4">
        <Row baseVelocity={2}>
          {["Authentic", "Free returns", "COD available", "48h dispatch", "Pan-India delivery", "Size exchanges"].map((t) => (
            <span key={t} className="flex items-center gap-6 px-6 font-mono text-sm uppercase tracking-[0.25em] text-mist">
              {t} <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            </span>
          ))}
        </Row>
      </div>
    </section>
  );
}
