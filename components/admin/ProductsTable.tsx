"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Package, Pencil, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Empty, Spinner, Switch, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn, formatINR, totalStock } from "@/lib/utils";
import type { CategoryT, ProductT } from "@/lib/types";

export default function ProductsTable({ products, categories, query }: { products: ProductT[]; categories: CategoryT[]; query: { q: string; category: string; status: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(query.q);
  const [busy, setBusy] = useState<string | null>(null);

  const nav = (patch: Partial<typeof query>) => {
    const next = new URLSearchParams(Object.entries({ ...query, ...patch }).filter(([, v]) => v) as [string, string][]);
    start(() => router.push(`${pathname}?${next}`));
  };

  const toggle = async (p: ProductT, field: "active" | "featured", value: boolean) => {
    setBusy(p._id + field);
    try {
      await api(`/api/admin/products/${p._id}`, { method: "PATCH", json: { [field]: value } });
      toast.success(`${p.name} ${field === "active" ? (value ? "published" : "hidden") : value ? "featured" : "unfeatured"}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: ProductT) => {
    const ok = await confirm({
      title: "Delete product?",
      danger: true,
      confirmLabel: "Delete permanently",
      body: (
        <>
          <b>{p.name}</b> and its reviews will be deleted, and its{" "}
          <b>
            {p.images.length} image{p.images.length === 1 ? "" : "s"}
            {p.video ? " + 1 video" : ""}
          </b>{" "}
          will be permanently removed from Cloudinary. Past orders keep their line items. To hide it temporarily, switch it to draft instead.
        </>
      ),
    });
    if (!ok) return;
    setBusy(p._id + "del");
    try {
      const r = await api<{ mediaDeleted: number }>(`/api/admin/products/${p._id}`, { method: "DELETE" });
      toast.success("Product deleted", { description: `${r.mediaDeleted} file(s) removed from Cloudinary` });
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-ink-2">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <form
          className="relative min-w-60 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            nav({ q });
          }}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or brand…" className="field py-2.5 pl-10" />
        </form>
        <select value={query.category} onChange={(e) => nav({ category: e.target.value })} className="field w-auto py-2.5">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex rounded-xl border border-line p-1 text-sm">
          {[
            ["", "All"],
            ["active", "Live"],
            ["draft", "Draft"],
            ["low", "Low stock"],
          ].map(([v, l]) => (
            <button key={v} onClick={() => nav({ status: v })} className={cn("rounded-lg px-3 py-1.5 transition-colors", query.status === v ? "bg-volt font-semibold text-ink" : "text-mist hover:text-bone")}>
              {l}
            </button>
          ))}
        </div>
        {pending && <Spinner className="text-volt" />}
      </div>

      {products.length === 0 ? (
        <div className="p-6">
          <Empty icon={Package} title="No products match">
            Try a different search or <Link href="/admin/products/new" className="text-volt underline">add a product</Link>.
          </Empty>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs text-mist">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Sold</th>
                <th className="px-4 py-3 text-center font-medium">Live</th>
                <th className="px-4 py-3 text-center font-medium">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {products.map((p, i) => {
                  const stock = totalStock(p.sizes);
                  return (
                    <motion.tr key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.02 } }} exit={{ opacity: 0 }} className="group hover:bg-ink-3/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-bone-2">
                            {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p._id}`} className="line-clamp-1 font-semibold hover:text-volt">
                              {p.name}
                            </Link>
                            <p className="text-xs text-mist">
                              {p.brand} · {p.images.length} img{p.video ? " · video" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-mist">{typeof p.category === "object" ? p.category.name : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatINR(p.price)}
                        {p.compareAtPrice ? <span className="block text-xs text-mist line-through">{formatINR(p.compareAtPrice)}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", stock === 0 ? "bg-ember/15 text-ember" : stock <= 20 ? "bg-amber-400/15 text-amber-300" : "text-bone")}>{stock}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-mist">{p.soldCount}</td>
                      <td className="px-4 py-3 text-center">
                        <Switch checked={p.active} disabled={busy === p._id + "active"} onChange={(v) => toggle(p, "active", v)} label="Live" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch checked={p.featured} disabled={busy === p._id + "featured"} onChange={(v) => toggle(p, "featured", v)} label="Featured" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/product/${p.slug}`} target="_blank" className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-bone" title="View in store">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <Link href={`/admin/products/${p._id}`} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-volt" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => remove(p)} disabled={busy === p._id + "del"} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-ember" title="Delete">
                            {busy === p._id + "del" ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
