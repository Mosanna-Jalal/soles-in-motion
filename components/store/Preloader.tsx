"use client";

import { AnimatePresence, animate, motion } from "motion/react";
import { useEffect, useState } from "react";

const WORD = "WAQUAR FOOTWEAR".split("");

/** First-visit intro: a counter races to 100 while the wordmark assembles, then the curtain lifts. */
export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("sim-intro") === "1";
      sessionStorage.setItem("sim-intro", "1");
    } catch {
      /* storage unavailable — just play the intro */
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dismiss immediately for returning visitors
      setQuick(true);
      setVisible(false);
      return;
    }
    const c = animate(0, 100, {
      duration: 1.9,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => setTimeout(() => setVisible(false), 250),
    });
    return () => c.stop();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-ink p-6 sm:p-10"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={quick ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: quick ? 0.2 : 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-mist">
            <span>Main Road · Kathokar Talab</span>
            <span>Gaya, Bihar</span>
          </div>
          <div className="overflow-hidden">
            <div className="display flex flex-wrap text-[13vw] leading-[0.85] sm:text-[11vw]">
              {WORD.map((ch, i) => (
                <motion.span
                  key={i}
                  className={ch === " " ? "w-[0.3em]" : i > 6 ? "text-volt" : ""}
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div className="h-[2px] w-1/2 overflow-hidden bg-ink-4">
              <div className="h-full bg-volt" style={{ width: `${count}%` }} />
            </div>
            <span className="display text-6xl tabular-nums sm:text-8xl">{String(count).padStart(3, "0")}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
