"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Heart, X } from "lucide-react";
import { SplitText } from "@/components/motion/primitives";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/lib/hooks";
import { discountPercent, formatINR } from "@/lib/utils";

export default function WishlistPage() {
  const mounted = useMounted();
  const { items, remove } = useWishlist();

  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <p className="eyebrow text-volt">Saved for later</p>
      <SplitText as="h1" trigger="mount" text="Wishlist" className="display mt-3 block text-7xl sm:text-9xl" />
      {!mounted ? (
        <div className="skeleton mt-10 h-72 rounded-3xl" />
      ) : items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-[32px] border border-dashed border-line py-24 text-center">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <Heart className="h-12 w-12 text-ember" />
          </motion.div>
          <p className="display mt-6 text-5xl">No favourites yet</p>
          <p className="mt-2 text-mist">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-volt mt-8">
            Discover styles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <motion.ul layout className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {items.map((i, idx) => {
              const off = discountPercent(i.price, i.compareAtPrice);
              return (
                <motion.li
                  key={i.productId}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="group relative"
                >
                  <Link href={`/product/${i.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-bone-2" data-cursor="View">
                    {i.image && <Image src={i.image} alt={i.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                    {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-ember px-2.5 py-1 font-mono text-[10px] font-bold text-ink">−{off}%</span>}
                  </Link>
                  <button onClick={() => remove(i.productId)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/80 backdrop-blur hover:bg-ember hover:text-ink" aria-label={`Remove ${i.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-3 px-1">
                    <p className="text-xs text-mist">{i.brand}</p>
                    <p className="line-clamp-1 font-semibold">{i.name}</p>
                    <p className="font-mono text-sm">{formatINR(i.price)}</p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
