"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { Tilt } from "@/components/motion/primitives";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/lib/hooks";
import { cn, discountPercent, formatINR, totalStock } from "@/lib/utils";
import type { ProductT } from "@/lib/types";

export function WishButton({ product, className }: { product: ProductT; className?: string }) {
  const mounted = useMounted();
  const toggle = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.items.some((i) => i.productId === product._id));
  const on = mounted && saved;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle({
          productId: product._id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          image: product.images[0]?.url,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
        });
        toast(added ? "Saved to wishlist" : "Removed from wishlist", { description: product.name });
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-ink/70 backdrop-blur transition-colors hover:bg-ink",
        className,
      )}
    >
      <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1.3, 1] }} transition={{ duration: 0.45 }}>
        <Heart className={cn("h-4 w-4", on ? "fill-ember text-ember" : "text-bone")} />
      </motion.span>
    </button>
  );
}

export default function ProductCard({ product, priority = false, className }: { product: ProductT; priority?: boolean; className?: string }) {
  const add = useCart((s) => s.add);
  const [first, second] = product.images;
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = totalStock(product.sizes) === 0;

  const quickAdd = (size: string, stock: number) => {
    add({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: first?.url,
      size,
      color: product.colors[0]?.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      maxQty: stock,
    });
    toast.success("Added to bag", { description: `${product.name} · UK ${size}` });
  };

  return (
    <div className={cn("group relative", className)}>
      <Tilt max={6} className="rounded-[22px]">
        <Link
          href={`/product/${product.slug}`}
          data-cursor="View"
          className="relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-bone-2"
        >
          {first && (
            <Image
              src={first.url}
              alt={first.alt || product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]",
                second && "group-hover:opacity-0",
              )}
            />
          )}
          {second && (
            <Image
              src={second.url}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="scale-110 object-cover opacity-0 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-100 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut ? (
              <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">Sold out</span>
            ) : (
              <>
                {product.isNewArrival && (
                  <span className="rounded-full bg-volt px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">New</span>
                )}
                {off > 0 && (
                  <span className="rounded-full bg-ember px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">−{off}%</span>
                )}
                {product.bestseller && !product.isNewArrival && off === 0 && (
                  <span className="rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                    Bestseller
                  </span>
                )}
              </>
            )}
          </div>
          {product.video && (
            <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2 py-1 font-mono text-[9px] uppercase tracking-widest backdrop-blur transition-opacity group-hover:opacity-0">
              ▶ Video
            </span>
          )}
        </Link>
        <WishButton product={product} className="absolute right-3 top-3 z-20" />

        {!soldOut && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 hidden translate-y-4 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <div className="rounded-2xl bg-ink/85 p-3 backdrop-blur-md">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mist">Quick add · UK</p>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock === 0}
                    onClick={() => quickAdd(s.size, s.stock)}
                    className="min-w-9 rounded-lg border border-line px-2 py-1.5 font-mono text-xs transition-colors hover:border-volt hover:bg-volt hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through"
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Tilt>

      <Link href={`/product/${product.slug}`} className="mt-4 block px-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-mist">{product.brand}</p>
            <h3 className="mt-0.5 line-clamp-1 font-semibold leading-snug transition-colors group-hover:text-volt">{product.name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-semibold">{formatINR(product.price)}</p>
            {off > 0 && <p className="font-mono text-xs text-mist line-through">{formatINR(product.compareAtPrice!)}</p>}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 4).map((c) => (
              <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-1 ring-bone/20" style={{ background: c.hex }} />
            ))}
          </div>
          {product.reviewCount > 0 && (
            <span className="flex items-center gap-1 font-mono text-xs text-mist">
              <Star className="h-3 w-3 fill-volt text-volt" />
              {product.rating.toFixed(1)} <span className="text-mist/60">({product.reviewCount})</span>
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export function ProductGrid({ products, className }: { products: ProductT[]; className?: string }) {
  return (
    <motion.div layout className={cn("grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4", className)}>
      <AnimatePresence mode="popLayout">
        {products.map((p, i) => (
          <motion.div
            key={p._id}
            layout
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, delay: (i % 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} priority={i < 4} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
