import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageReveal, Reveal, SplitText } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";
import type { CategoryT } from "@/lib/types";

const SPANS = [
  "md:col-span-2 md:row-span-2",
  "",
  "md:row-span-2",
  "",
  "md:row-span-2",
  "md:col-span-2",
  "md:row-span-2",
  "md:col-span-2",
];

export default function CategoryBento({ categories }: { categories: CategoryT[] }) {
  const list = categories.filter((c) => c.featured).slice(0, 8);
  if (!list.length) return null;
  return (
    <section className="container-x py-24 sm:py-32">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Reveal>
            <p className="eyebrow text-volt">Collections</p>
          </Reveal>
          <SplitText as="h2" text="Find your fit" className="display mt-3 block text-6xl sm:text-8xl" />
        </div>
        <Reveal delay={0.2}>
          <p className="max-w-sm text-mist">
            From race-day runners to wedding-ready brogues — {list.reduce((n, c) => n + (c.productCount ?? 0), 0)} styles curated across{" "}
            {list.length} collections.
          </p>
        </Reveal>
      </div>
      <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-flow-dense sm:auto-rows-[260px] md:grid-cols-4 md:gap-4">
        {list.map((c, i) => (
          <ImageReveal key={c._id} delay={(i % 4) * 0.08} className={cn("rounded-[24px]", SPANS[i] ?? "")}>
            <Link href={`/shop?category=${c.slug}`} className="group relative block h-full w-full overflow-hidden rounded-[24px] bg-ink-3" data-cursor="Shop">
              {c.image?.url && (
                <Image
                  src={c.image.url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 40vw"
                  className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-6 sm:bottom-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone/70">{c.productCount} styles</p>
                  <p className={cn("display mt-1", i === 0 ? "text-5xl sm:text-7xl" : "text-3xl sm:text-4xl")}>{c.name}</p>
                  {c.tagline && (
                    <p className="mt-1 max-h-0 overflow-hidden text-sm text-bone/80 opacity-0 transition-all duration-500 group-hover:max-h-10 group-hover:opacity-100">
                      {c.tagline}
                    </p>
                  )}
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bone text-ink transition-all duration-500 group-hover:rotate-45 group-hover:bg-volt">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </ImageReveal>
        ))}
      </div>
    </section>
  );
}
