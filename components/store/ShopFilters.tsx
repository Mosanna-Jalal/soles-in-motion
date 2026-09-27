"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { CategoryT } from "@/lib/types";

export type ShopParams = Record<string, string | undefined>;

const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["popular", "Most popular"],
  ["rating", "Top rated"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

const PRICES = [
  ["", "4000", "Under ₹4,000"],
  ["4000", "8000", "₹4,000 – ₹8,000"],
  ["8000", "12000", "₹8,000 – ₹12,000"],
  ["12000", "", "₹12,000+"],
] as const;

function useParamNav(params: ShopParams) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (patch: ShopParams) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...patch, page: patch.page })) if (v) next.set(k, v);
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return { go, pending };
}

function toggleCsv(csv: string | undefined, value: string) {
  const set = new Set((csv ?? "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].join(",") || undefined;
}

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="eyebrow text-bone">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-mist transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ checked, label, onClick, count }: { checked: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 py-1.5 text-left text-sm">
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          checked ? "border-volt bg-volt text-ink" : "border-line group-hover:border-bone/50",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className={cn("flex-1 transition-colors", checked ? "text-bone" : "text-bone/70 group-hover:text-bone")}>{label}</span>
      {count !== undefined && <span className="font-mono text-xs text-mist">{count}</span>}
    </button>
  );
}

function FilterPanel({ params, categories, brands, sizes, go }: { params: ShopParams; categories: CategoryT[]; brands: string[]; sizes: string[]; go: (p: ShopParams) => void }) {
  const [min, setMin] = useState(params.min ?? "");
  const [max, setMax] = useState(params.max ?? "");
  return (
    <div>
      <Group title="Category">
        <div className="space-y-0.5">
          <CheckRow checked={!params.category} label="All footwear" onClick={() => go({ category: undefined })} />
          {categories.map((c) => (
            <CheckRow
              key={c._id}
              checked={params.category === c.slug}
              label={c.name}
              count={c.productCount}
              onClick={() => go({ category: params.category === c.slug ? undefined : c.slug })}
            />
          ))}
        </div>
      </Group>
      <Group title="Gender">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["", "All"],
            ["men", "Men"],
            ["women", "Women"],
          ].map(([v, l]) => (
            <button
              key={l}
              onClick={() => go({ gender: v || undefined })}
              className={cn(
                "rounded-xl border py-2 text-sm font-semibold transition-colors",
                (params.gender ?? "") === v ? "border-volt bg-volt text-ink" : "border-line hover:border-bone/50",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Size (UK)">
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((s) => {
            const on = (params.size ?? "").split(",").includes(s);
            return (
              <button
                key={s}
                onClick={() => go({ size: toggleCsv(params.size, s) })}
                className={cn(
                  "rounded-lg border py-2 font-mono text-sm transition-colors",
                  on ? "border-volt bg-volt text-ink" : "border-line hover:border-bone/50",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Price">
        <div className="space-y-0.5">
          {PRICES.map(([lo, hi, label]) => (
            <CheckRow
              key={label}
              label={label}
              checked={(params.min ?? "") === lo && (params.max ?? "") === hi}
              onClick={() => {
                const on = (params.min ?? "") === lo && (params.max ?? "") === hi;
                setMin(on ? "" : lo);
                setMax(on ? "" : hi);
                go({ min: on ? undefined : lo || undefined, max: on ? undefined : hi || undefined });
              }}
            />
          ))}
        </div>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go({ min: min || undefined, max: max || undefined });
          }}
        >
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min ₹" className="field py-2" inputMode="numeric" aria-label="Minimum price" />
          <span className="text-mist">–</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max ₹" className="field py-2" inputMode="numeric" aria-label="Maximum price" />
          <button className="rounded-xl bg-bone px-3 py-2 text-sm font-bold text-ink hover:bg-volt">Go</button>
        </form>
      </Group>
      <Group title="Brand" defaultOpen={false}>
        <div className="thin-scroll max-h-60 space-y-0.5 overflow-y-auto pr-1" data-lenis-prevent>
          {brands.map((b) => (
            <CheckRow key={b} label={b} checked={(params.brand ?? "").split(",").includes(b)} onClick={() => go({ brand: toggleCsv(params.brand, b) })} />
          ))}
        </div>
      </Group>
      <Group title="Highlights">
        <div className="flex flex-wrap gap-2">
          {[
            ["new", "New in"],
            ["bestseller", "Bestsellers"],
            ["sale", "On sale"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => go({ tag: params.tag === v ? undefined : v })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                params.tag === v ? "border-volt bg-volt text-ink" : "border-line hover:border-bone/50",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}

export function ShopSidebar(props: { params: ShopParams; categories: CategoryT[]; brands: string[]; sizes: string[] }) {
  const { go, pending } = useParamNav(props.params);
  const active = ["category", "gender", "size", "min", "max", "brand", "tag", "q"].filter((k) => props.params[k]);
  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 thin-scroll lg:block" data-lenis-prevent>
      <div className="flex items-center justify-between pb-2">
        <p className="flex items-center gap-2 font-semibold">
          Filters {pending && <LoaderCircle className="h-4 w-4 animate-spin text-volt" />}
        </p>
        {active.length > 0 && (
          <button
            onClick={() => go(Object.fromEntries(active.map((k) => [k, undefined])))}
            className="text-xs text-mist underline-offset-4 hover:text-volt hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <FilterPanel {...props} go={go} />
    </aside>
  );
}

export function ShopToolbar(props: { params: ShopParams; categories: CategoryT[]; brands: string[]; sizes: string[]; total: number }) {
  const { go, pending } = useParamNav(props.params);
  const [open, setOpen] = useState(false);
  useScrollLock(open);
  const chips = [
    props.params.q && { k: "q", label: `“${props.params.q}”` },
    props.params.gender && { k: "gender", label: props.params.gender },
    props.params.tag && { k: "tag", label: props.params.tag },
    props.params.size && { k: "size", label: `UK ${props.params.size}` },
    props.params.brand && { k: "brand", label: props.params.brand.replaceAll(",", ", ") },
    (props.params.min || props.params.max) && { k: "price", label: `₹${props.params.min || 0} – ${props.params.max ? `₹${props.params.max}` : "∞"}` },
  ].filter(Boolean) as { k: string; label: string }[];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <p className="font-mono text-xs uppercase tracking-wider text-mist">
            {pending ? <LoaderCircle className="inline h-4 w-4 animate-spin text-volt" /> : props.total} styles
          </p>
          <AnimatePresence>
            {chips.map((c) => (
              <motion.button
                key={c.k}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => go(c.k === "price" ? { min: undefined, max: undefined } : { [c.k]: undefined })}
                className="flex items-center gap-1.5 rounded-full bg-ink-3 px-3 py-1.5 text-xs capitalize hover:bg-ember hover:text-ink"
              >
                {c.label} <X className="h-3 w-3" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-mist">Sort</span>
          <select
            value={props.params.sort ?? "featured"}
            onChange={(e) => go({ sort: e.target.value === "featured" ? undefined : e.target.value })}
            className="rounded-full border border-line bg-ink-2 px-4 py-2 text-sm outline-none focus:border-volt"
          >
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-ink-2"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="display text-3xl">Filters</p>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-bone/10" aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5" data-lenis-prevent>
                <FilterPanel params={props.params} categories={props.categories} brands={props.brands} sizes={props.sizes} go={go} />
              </div>
              <div className="border-t border-line p-4">
                <button onClick={() => setOpen(false)} className="btn-volt w-full">
                  Show {props.total} styles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Pagination({ params, page, pages }: { params: ShopParams; page: number; pages: number }) {
  const { go } = useParamNav(params);
  if (pages <= 1) return null;
  return (
    <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Pagination">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => {
            go({ page: p === 1 ? undefined : String(p) });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "relative h-11 w-11 rounded-full font-mono text-sm transition-colors",
            p === page ? "text-ink" : "border border-line hover:border-volt",
          )}
        >
          {p === page && <motion.span layoutId="page-dot" className="absolute inset-0 rounded-full bg-volt" />}
          <span className="relative">{p}</span>
        </button>
      ))}
    </nav>
  );
}
