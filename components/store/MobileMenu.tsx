"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect } from "react";
import { useUI } from "@/store/ui";
import { useScrollLock } from "@/lib/hooks";
import type { CategoryT, SessionUser } from "@/lib/types";

const LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?tag=new", label: "New in" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?tag=sale", label: "Sale" },
  { href: "/about", label: "Our story" },
];

export default function MobileMenu({ categories, user }: { categories: CategoryT[]; user: SessionUser | null }) {
  const { menuOpen, setMenu } = useUI();
  const pathname = usePathname();
  useScrollLock(menuOpen);

  useEffect(() => {
    setMenu(false);
  }, [pathname, setMenu]);

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-ink lg:hidden"
          initial={{ clipPath: "circle(0% at 24px 24px)" }}
          animate={{ clipPath: "circle(150% at 24px 24px)" }}
          exit={{ clipPath: "circle(0% at 24px 24px)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          data-lenis-prevent
        >
          <div className="container-x flex h-16 items-center justify-between">
            <span className="eyebrow text-mist">Menu</span>
            <button onClick={() => setMenu(false)} className="rounded-full p-2 hover:bg-bone/10" aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="container-x flex-1 overflow-y-auto pb-10">
            <nav className="mt-4 flex flex-col">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-b border-line"
                >
                  <Link href={l.href} className="flex items-center justify-between py-3">
                    <span className="display text-5xl">{l.label}</span>
                    <ArrowUpRight className="h-6 w-6 text-mist" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8">
              <p className="eyebrow mb-3 text-mist">Collections</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    href={`/shop?category=${c.slug}`}
                    className="rounded-full border border-line px-4 py-2 text-sm hover:border-volt hover:text-volt"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                <Link href={user ? "/account" : "/login"} className="btn-ghost">
                  {user ? "My account" : "Sign in"}
                </Link>
                <Link href="/track" className="btn-ghost">
                  Track order
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
