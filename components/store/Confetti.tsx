"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const COLORS = ["#d7ff3a", "#ff5b22", "#f2eee6", "#8e8b85"];

/** Lightweight DOM confetti burst — no canvas library needed. */
export default function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = Math.sin(i * 999) * 10000;
        const r = seed - Math.floor(seed);
        const r2 = Math.abs(Math.sin(i * 17.3));
        return {
          left: `${(i / count) * 100}%`,
          x: (r - 0.5) * 300,
          rotate: r2 * 720 - 360,
          delay: r * 0.4,
          duration: 2.4 + r2 * 1.6,
          size: 6 + Math.round(r2 * 8),
          color: COLORS[i % COLORS.length],
          round: i % 3 === 0,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-4 block"
          style={{ left: p.left, width: p.size, height: p.round ? p.size : p.size * 0.45, background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: p.x, rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}
    </div>
  );
}
