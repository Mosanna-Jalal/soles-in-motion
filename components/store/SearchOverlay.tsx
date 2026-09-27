"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUI } from "@/store/ui";
import { useDebounced, useScrollLock } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";

type Hit = { _id: string; name: string; slug: string; brand: string; price: number; image?: string; category?: string };

const TRENDING = ["Jordan 1", "Air Max", "Running", "Heels", "Boots", "New Balance", "Loafers"];

export default function SearchOverlay() {
  const { searchOpen, setSearch } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; items: Hit[] } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(q.trim(), 220);
  useScrollLock(searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => input.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearch(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearch]);

  useEffect(() => {
    if (debounced.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/products?q=${encodeURIComponent(debounced)}&limit=8`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setResults({ q: debounced, items: d.items ?? [] }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced]);

  const active = debounced.length >= 2;
  const hits = active && results?.q === debounced ? results.items : [];
  const loading = active && results?.q !== debounced;

  const close = () => setSearch(false);
  const submit = (term: string) => {
    close();
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="relative max-h-[92dvh] overflow-y-auto border-b border-line bg-ink-2"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <div className="container-x py-8 sm:py-12">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-mist">Search the store</span>
                <button onClick={close} className="rounded-full p-2 hover:bg-bone/10" aria-label="Close search">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim()) submit(q.trim());
                }}
                className="mt-4 flex items-center gap-4 border-b-2 border-bone/20 pb-3 focus-within:border-volt"
              >
                <Search className="h-7 w-7 shrink-0 text-mist" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Sneakers, brands, styles…"
                  className="display w-full bg-transparent text-4xl outline-none placeholder:text-bone/20 sm:text-6xl"
                  aria-label="Search products"
                />
                {loading && <LoaderCircle className="h-6 w-6 shrink-0 animate-spin text-volt" />}
              </form>

              {debounced.length < 2 ? (
                <div className="mt-8">
                  <p className="eyebrow mb-3 text-mist">Trending</p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((t, i) => (
                      <motion.button
                        key={t}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.04 }}
                        onClick={() => setQ(t)}
                        className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-volt hover:text-volt"
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="eyebrow text-mist">{hits.length ? `Top results for “${debounced}”` : loading ? "Searching…" : "No matches"}</p>
                    {hits.length > 0 && (
                      <button onClick={() => submit(debounced)} className="flex items-center gap-1 text-sm font-semibold text-volt">
                        See all <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {hits.map((h, i) => (
                      <motion.div key={h._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link href={`/product/${h.slug}`} onClick={close} className="group block">
                          <div className="relative aspect-square overflow-hidden rounded-2xl bg-bone-2">
                            {h.image && (
                              <Image src={h.image} alt={h.name} fill sizes="240px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-mist">{h.brand}</p>
                          <p className="line-clamp-1 text-sm font-semibold">{h.name}</p>
                          <p className="font-mono text-sm text-volt">{formatINR(h.price)}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
