"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import MediaUploader, { useUploadSession } from "./MediaUploader";
import { Card, Field, Spinner, Switch, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn, discountPercent, formatINR, slugify } from "@/lib/utils";
import type { CategoryT, Gender, Media, ProductT } from "@/lib/types";

const RUNS: Record<string, string[]> = {
  Men: ["6", "7", "8", "9", "10", "11"],
  Women: ["3", "4", "5", "6", "7", "8"],
  Unisex: ["4", "5", "6", "7", "8", "9", "10", "11"],
  Kids: ["10", "11", "12", "13", "1", "2"],
};

type FormState = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  gender: Gender;
  description: string;
  highlights: string[];
  price: string;
  compareAtPrice: string;
  images: Media[];
  video: Media[];
  colors: { name: string; hex: string }[];
  sizes: { size: string; stock: string }[];
  tags: string;
  featured: boolean;
  isNewArrival: boolean;
  bestseller: boolean;
  active: boolean;
};

function initial(p?: ProductT, categories?: CategoryT[]): FormState {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    brand: p?.brand ?? "",
    category: p ? (typeof p.category === "object" ? p.category._id : p.category) : (categories?.[0]?._id ?? ""),
    gender: p?.gender ?? "unisex",
    description: p?.description ?? "",
    highlights: p?.highlights ?? [],
    price: p ? String(p.price) : "",
    compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : "",
    images: p?.images ?? [],
    video: p?.video ? [p.video] : [],
    colors: p?.colors ?? [{ name: "Black", hex: "#111111" }],
    sizes: p?.sizes.map((s) => ({ size: s.size, stock: String(s.stock) })) ?? RUNS.Unisex.map((size) => ({ size, stock: "10" })),
    tags: p?.tags.join(", ") ?? "",
    featured: p?.featured ?? false,
    isNewArrival: p?.isNewArrival ?? true,
    bestseller: p?.bestseller ?? false,
    active: p?.active ?? true,
  };
}

export default function ProductForm({ product, categories, brands }: { product?: ProductT; categories: CategoryT[]; brands: string[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const session = useUploadSession();
  const [f, setF] = useState<FormState>(() => initial(product, categories));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const original = useMemo(() => JSON.stringify(initial(product, categories)), [product, categories]);
  const dirty = JSON.stringify(f) !== original;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const stock = f.sizes.reduce((n, s) => n + (Number(s.stock) || 0), 0);
  const off = discountPercent(Number(f.price), Number(f.compareAtPrice));

  const removedSaved = product
    ? [...product.images, ...(product.video ? [product.video] : [])].filter((m) => ![...f.images, ...f.video].some((x) => x.publicId === m.publicId)).length
    : 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.images.length) {
      toast.error("Add at least one product image");
      return;
    }
    setSaving(true);
    const payload = {
      name: f.name,
      slug: f.slug || undefined,
      brand: f.brand,
      category: f.category,
      gender: f.gender,
      description: f.description,
      highlights: f.highlights,
      price: Number(f.price),
      compareAtPrice: f.compareAtPrice ? Number(f.compareAtPrice) : null,
      images: f.images,
      video: f.video[0] ?? null,
      colors: f.colors.filter((c) => c.name.trim()),
      sizes: f.sizes.filter((s) => s.size.trim()).map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 })),
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured: f.featured,
      isNewArrival: f.isNewArrival,
      bestseller: f.bestseller,
      active: f.active,
    };
    try {
      const res = product
        ? await api<{ mediaDeleted: number }>(`/api/admin/products/${product._id}`, { method: "PUT", json: payload })
        : await api<{ id: string }>("/api/admin/products", { method: "POST", json: payload });
      session.commit([...payload.images, payload.video]);
      const deleted = "mediaDeleted" in res ? res.mediaDeleted : 0;
      toast.success(product ? "Product updated" : "Product created", deleted ? { description: `${deleted} removed file(s) deleted from Cloudinary` } : undefined);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  }

  async function destroy() {
    if (!product) return;
    const ok = await confirm({
      title: "Delete product?",
      danger: true,
      confirmLabel: "Delete permanently",
      body: <>This removes <b>{product.name}</b>, its reviews and all of its images/videos from Cloudinary. This can&apos;t be undone.</>,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/api/admin/products/${product._id}`, { method: "DELETE" });
      session.flush();
      toast.success("Product deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={save} className="pb-28">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1 text-sm text-mist hover:text-volt">
            <ArrowLeft className="h-4 w-4" /> Products
          </Link>
          <h1 className="display text-4xl sm:text-5xl">{product ? product.name : "New product"}</h1>
        </div>
        {product && (
          <button type="button" onClick={destroy} disabled={deleting} className="btn border border-ember/40 py-2.5 text-ember hover:bg-ember hover:text-ink">
            {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />} Delete
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <input required value={f.name} onChange={(e) => set("name", e.target.value)} className="field" placeholder="Air Max 1 Sunrise" />
              </Field>
              <Field label="URL slug" hint={`/product/${f.slug || slugify(f.name) || "…"}`}>
                <input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="field font-mono" placeholder="auto from name" />
              </Field>
              <Field label="Brand">
                <input required list="brands" value={f.brand} onChange={(e) => set("brand", e.target.value)} className="field" />
                <datalist id="brands">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label="Category">
                <select required value={f.category} onChange={(e) => set("category", e.target.value)} className="field">
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Gender">
                <select value={f.gender} onChange={(e) => set("gender", e.target.value as Gender)} className="field">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="kids">Kids</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Media" action={<span className="font-mono text-[10px] uppercase tracking-widest text-mist">Stored on Cloudinary</span>}>
            <div className="space-y-6">
              <MediaUploader area="products" accept="image" multiple max={12} value={f.images} onChange={(v) => set("images", v)} session={session} label="Images" hint="Drag to reorder — the first image is the cover. JPG/PNG/WebP up to 10 MB." />
              <MediaUploader area="products" accept="video" value={f.video} onChange={(v) => set("video", v)} session={session} label="Product video (optional)" hint="MP4/WebM up to 100 MB. Shown in the product gallery." />
              <AnimatePresence>
                {removedSaved > 0 && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl bg-ember/10 px-4 py-3 text-sm text-ember">
                    {removedSaved} saved file{removedSaved > 1 ? "s" : ""} will be permanently deleted from Cloudinary when you save.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </Card>

          <Card title="Description">
            <div className="space-y-4">
              <textarea rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} className="field resize-y" placeholder="Tell the story of this shoe…" />
              <div>
                <span className="label">Highlights</span>
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {f.highlights.map((h, i) => (
                      <motion.li key={h + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 rounded-xl bg-ink-3 px-3 py-2 text-sm">
                        <span className="h-1.5 w-1.5 rotate-45 bg-volt" />
                        <span className="flex-1">{h}</span>
                        <button type="button" onClick={() => set("highlights", f.highlights.filter((_, k) => k !== i))} className="text-mist hover:text-ember" aria-label="Remove highlight">
                          <X className="h-4 w-4" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newHighlight.trim()) {
                          set("highlights", [...f.highlights, newHighlight.trim()]);
                          setNewHighlight("");
                        }
                      }
                    }}
                    className="field py-2.5"
                    placeholder="Add a highlight and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newHighlight.trim()) {
                        set("highlights", [...f.highlights, newHighlight.trim()]);
                        setNewHighlight("");
                      }
                    }}
                    className="rounded-xl border border-line px-3 hover:border-volt hover:text-volt"
                    aria-label="Add highlight"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Field label="Tags" hint="Comma separated — used by search.">
                <input value={f.tags} onChange={(e) => set("tags", e.target.value)} className="field" placeholder="running, knit, lightweight" />
              </Field>
            </div>
          </Card>

          <Card
            title="Sizes & inventory"
            action={
              <div className="flex flex-wrap gap-1">
                {Object.keys(RUNS).map((k) => (
                  <button type="button" key={k} onClick={() => set("sizes", RUNS[k].map((size) => ({ size, stock: f.sizes.find((s) => s.size === size)?.stock ?? "10" })))} className="rounded-lg border border-line px-2.5 py-1 text-xs hover:border-volt hover:text-volt">
                    {k} run
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <AnimatePresence initial={false}>
                {f.sizes.map((s, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative rounded-2xl border border-line bg-ink-3 p-2">
                    <button type="button" onClick={() => set("sizes", f.sizes.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded-full p-1 text-mist hover:text-ember" aria-label="Remove size">
                      <X className="h-3 w-3" />
                    </button>
                    <p className="font-mono text-[10px] text-mist">UK</p>
                    <input value={s.size} onChange={(e) => set("sizes", f.sizes.map((x, k) => (k === i ? { ...x, size: e.target.value } : x)))} className="w-full bg-transparent font-mono text-lg font-bold outline-none" aria-label="Size" />
                    <input
                      type="number"
                      min={0}
                      value={s.stock}
                      onChange={(e) => set("sizes", f.sizes.map((x, k) => (k === i ? { ...x, stock: e.target.value } : x)))}
                      className={cn("mt-1 w-full rounded-lg bg-ink-2 px-2 py-1 text-sm tabular-nums outline-none focus:ring-1 focus:ring-volt", Number(s.stock) === 0 && "text-ember")}
                      aria-label={`Stock for UK ${s.size}`}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <button type="button" onClick={() => set("sizes", [...f.sizes, { size: "", stock: "0" }])} className="grid min-h-24 place-items-center rounded-2xl border-2 border-dashed border-line text-mist hover:border-volt hover:text-volt">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm text-mist">
              Total stock: <b className="text-bone">{stock}</b> pairs across {f.sizes.length} sizes
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Visibility">
            <div className="space-y-4">
              {(
                [
                  ["active", "Live on store", "Draft products are hidden from customers"],
                  ["featured", "Featured", "Shown in the home page drop & spotlight"],
                  ["isNewArrival", "New arrival", "Adds the NEW badge and ‘New in’ listing"],
                  ["bestseller", "Bestseller", "Appears in the bestsellers carousel"],
                ] as const
              ).map(([k, l, hint]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{l}</p>
                    <p className="text-xs text-mist">{hint}</p>
                  </div>
                  <Switch checked={f[k]} onChange={(v) => set(k, v)} label={l} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <input required type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} className="field tabular-nums" />
              </Field>
              <Field label="Compare at (₹)">
                <input type="number" min={0} value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className="field tabular-nums" placeholder="MRP" />
              </Field>
            </div>
            {off > 0 && (
              <p className="mt-3 rounded-xl bg-volt/10 px-3 py-2 text-sm text-volt">
                Shows as {off}% off — customers save {formatINR(Number(f.compareAtPrice) - Number(f.price))}
              </p>
            )}
          </Card>

          <Card title="Colours">
            <div className="space-y-2">
              {f.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent" aria-label="Colour" />
                  <input value={c.name} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className="field py-2" placeholder="Colour name" />
                  <button type="button" onClick={() => set("colors", f.colors.filter((_, k) => k !== i))} className="p-2 text-mist hover:text-ember" aria-label="Remove colour">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("colors", [...f.colors, { name: "", hex: "#888888" }])} className="flex items-center gap-1 text-sm text-mist hover:text-volt">
                <Plus className="h-4 w-4" /> Add colour
              </button>
            </div>
          </Card>
        </div>
      </div>

      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 backdrop-blur-xl lg:left-64">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <p className="flex items-center gap-2 text-sm text-mist">
            <span className={cn("h-2 w-2 rounded-full", dirty ? "animate-pulse bg-ember" : "bg-volt")} />
            {dirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                session.flush();
                router.push("/admin/products");
              }}
              className="btn-ghost py-2.5"
            >
              Cancel
            </button>
            <button disabled={saving} className="btn-volt py-2.5">
              {saving ? <Spinner /> : <Save className="h-4 w-4" />} {product ? "Save changes" : "Create product"}
            </button>
          </div>
        </div>
      </motion.div>
    </form>
  );
}
