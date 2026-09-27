"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { ProductGrid } from "@/components/store/ProductCard";
import { Reveal, SplitText } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";
import type { ProductT } from "@/lib/types";

const TABS = [
  { id: "all", label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
] as const;

export default function NewArrivals({ products }: { products: ProductT[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const list = products
    .filter((p) => tab === "all" || p.gender === tab || p.gender === "unisex")
    .slice(0, 8);

  return (
    <section className="container-x py-24 sm:py-32">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Reveal>
            <p className="eyebrow text-volt">Just landed</p>
          </Reveal>
          <SplitText as="h2" text="New arrivals" className="display mt-3 block text-6xl sm:text-8xl" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-full border border-line p-1" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  tab === t.id ? "text-ink" : "text-bone/70 hover:text-bone",
                )}
              >
                {tab === t.id && (
                  <motion.span layoutId="arrivals-tab" className="absolute inset-0 rounded-full bg-volt" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
          <Link href="/shop?tag=new" className="group hidden items-center gap-2 text-sm font-semibold sm:flex">
            View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
      <ProductGrid products={list} />
    </section>
  );
}
