"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

function Word({ word, range, progress, highlight }: { word: string; range: [number, number]; progress: MotionValue<number>; highlight: boolean }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className={cn("mr-[0.25em] inline-block", highlight && "text-volt")}>
      {word}
    </motion.span>
  );
}

/** Words light up one by one as the paragraph scrolls through the viewport. */
export default function ScrollWords({ text, highlight = [], className }: { text: string; highlight?: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.35"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={cn("flex flex-wrap", className)}>
      {words.map((w, i) => (
        <Word
          key={i}
          word={w}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          highlight={highlight.includes(w.replace(/[^\w]/g, "").toLowerCase())}
        />
      ))}
    </p>
  );
}
