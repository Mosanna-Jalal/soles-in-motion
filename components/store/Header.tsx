"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Marquee, RollText } from "@/components/motion/primitives";
import { cartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { CategoryT, SessionUser } from "@/lib/types";

const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?tag=new", label: "New in" },
];

export default function Header({
  categories,
  user,
  announcement,
}: {
  categories: CategoryT[];
  user: SessionUser | null;
  announcement: string;
}) {
  const pathname = usePathname();
  const mounted = useMounted();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const items = useCart((s) => s.items);
  const setCartOpen = useCart((s) => s.setOpen);
  const wishCount = useWishlist((s) => s.items.length);
  const { setSearch, setMenu } = useUI();
  const count = mounted ? cartCount(items) : 0;
  const overHero = pathname === "/" && !scrolled && !mega;

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 400);
    setScrolled(y > 30);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mega menu on navigation
    setMega(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearch]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden && !mega ? "-100%" : "0%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => setMega(false)}
    >
      <motion.div
        className="overflow-hidden bg-volt text-ink"
        animate={{ height: scrolled ? 0 : 32 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Marquee duration={40} className="h-8 items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
              <span>{announcement}</span>
              <span aria-hidden>✦</span>
              <span>COD available across India</span>
              <span aria-hidden>✦</span>
            </span>
          ))}
        </Marquee>
      </motion.div>

      <div
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          overHero ? "border-transparent bg-transparent" : "border-line/60 bg-ink/80 backdrop-blur-xl",
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-6 lg:h-[72px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenu(true)}
              className="-ml-2 rounded-full p-2 transition-colors hover:bg-bone/10 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="group" aria-label="Soles in Motion — home">
              <span className="hidden sm:block">
                <Logo />
              </span>
              <span className="block sm:hidden">
                <Logo compact />
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onMouseEnter={() => setMega(false)}
                className="group rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-bone/85 transition-colors hover:text-bone"
              >
                <RollText>{n.label}</RollText>
              </Link>
            ))}
            <button
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega((m) => !m)}
              aria-expanded={mega}
              className={cn(
                "group rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors",
                mega ? "bg-bone text-ink" : "text-bone/85 hover:text-bone",
              )}
            >
              <RollText>Collections</RollText>
            </button>
            <Link
              href="/shop?tag=sale"
              onMouseEnter={() => setMega(false)}
              className="group rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-ember"
            >
              <RollText>Sale</RollText>
            </Link>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearch(true)}
              className="group flex items-center gap-2 rounded-full p-2.5 transition-colors hover:bg-bone/10 xl:border xl:border-line xl:px-4 xl:py-2"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden pr-1 text-xs font-medium text-bone/70 xl:inline">Search</span>
            </button>
            <Link href="/wishlist" className="relative rounded-full p-2.5 transition-colors hover:bg-bone/10" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
              {mounted && wishCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-ember" aria-label={`${wishCount} saved`} />
              )}
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="hidden rounded-full p-2.5 transition-colors hover:bg-bone/10 sm:inline-flex"
              aria-label={user ? "My account" : "Sign in"}
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative ml-1 flex items-center gap-2 rounded-full bg-bone py-2 pl-3 pr-3.5 text-ink transition-colors hover:bg-volt"
              aria-label={`Open bag, ${count} items`}
            >
              <ShoppingBag className="h-[17px] w-[17px]" />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={count}
                  initial={{ y: -14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 14, opacity: 0 }}
                  className="min-w-3 font-mono text-xs font-bold tabular-nums"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mega && (
          <motion.div
            key="mega"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-ink/95 backdrop-blur-xl lg:block"
          >
            <div className="container-x grid grid-cols-[220px_1fr] gap-10 py-10">
              <div className="flex flex-col gap-3">
                <p className="eyebrow text-mist">Explore</p>
                {[
                  ["/shop?tag=new", "New arrivals"],
                  ["/shop?tag=bestseller", "Bestsellers"],
                  ["/shop?tag=sale", "On sale"],
                  ["/shop?gender=men", "Men"],
                  ["/shop?gender=women", "Women"],
                ].map(([href, label], i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                  >
                    <Link href={href} className="display text-3xl transition-colors hover:text-volt">
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {categories.slice(0, 8).map((c, i) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/shop?category=${c.slug}`}
                      className="group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-ink-3"
                      data-cursor="Shop"
                    >
                      {c.image?.url && (
                        <Image
                          src={c.image.url}
                          alt={c.name}
                          fill
                          sizes="260px"
                          className="object-cover opacity-70 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
                        <span className="display text-xl">{c.name}</span>
                        <span className="font-mono text-[10px] text-bone/70">{c.productCount} styles</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
