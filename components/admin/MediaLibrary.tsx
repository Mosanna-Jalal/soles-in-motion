"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, Film, ImageIcon, RefreshCw, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, Spinner, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cldPoster } from "@/lib/cld";
import { cn, formatBytes, formatDate } from "@/lib/utils";

type Asset = {
  publicId: string;
  resourceType: "image" | "video";
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: string;
  usage: { kind: "product" | "category" | "banner"; id: string; label: string; field: string } | null;
};

const LINK: Record<string, (id: string) => string> = {
  product: (id) => `/admin/products/${id}`,
  category: () => "/admin/categories",
  banner: () => "/admin/banners",
};

export default function MediaLibrary() {
  const confirm = useConfirm();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [filter, setFilter] = useState<"all" | "used" | "orphan" | "image" | "video">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAssets = useCallback(
    () =>
      api<{ assets: Asset[] }>("/api/admin/media")
        .then((r) => setAssets(r.assets))
        .catch((err: Error) => {
          toast.error(err.message);
          setAssets([]);
        }),
    [],
  );

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const load = () => {
    setAssets(null);
    fetchAssets();
  };

  const list = (assets ?? []).filter((a) =>
    filter === "all" ? true : filter === "used" ? !!a.usage : filter === "orphan" ? !a.usage : a.resourceType === filter,
  );
  const orphans = (assets ?? []).filter((a) => !a.usage);
  const total = (assets ?? []).reduce((n, a) => n + a.bytes, 0);

  const remove = async (a: Asset) => {
    if (!(await confirm({ title: "Delete file?", danger: true, confirmLabel: "Delete from Cloudinary", body: <>This permanently deletes <code className="text-volt">{a.publicId}</code> from Cloudinary.</> }))) return;
    setBusy(a.publicId);
    try {
      await api("/api/admin/media", { method: "DELETE", json: { publicId: a.publicId, resourceType: a.resourceType } });
      setAssets((s) => s?.filter((x) => x.publicId !== a.publicId) ?? null);
      toast.success("Deleted from Cloudinary");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const purge = async () => {
    if (!(await confirm({ title: `Purge ${orphans.length} unused file${orphans.length === 1 ? "" : "s"}?`, danger: true, confirmLabel: "Purge", body: "Every file that isn't used by a product, category or banner will be permanently deleted from Cloudinary. Files uploaded in the last hour are skipped in case a form is still open." }))) return;
    setBusy("purge");
    try {
      const r = await api<{ deleted: number; failed: number; skippedRecent: number }>("/api/admin/media/purge", { method: "POST", json: {} });
      toast.success(`Deleted ${r.deleted} file(s)`, { description: r.skippedRecent ? `${r.skippedRecent} recent upload(s) kept for now` : undefined });
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-mist">Files on Cloudinary</p>
          <p className="mt-2 text-3xl font-semibold">{assets ? assets.length : "—"}</p>
          <p className="mt-1 text-xs text-mist">{formatBytes(total)} total</p>
        </Card>
        <Card>
          <p className="text-sm text-mist">In use</p>
          <p className="mt-2 text-3xl font-semibold">{assets ? assets.length - orphans.length : "—"}</p>
          <p className="mt-1 text-xs text-mist">Referenced by products, categories or banners</p>
        </Card>
        <Card className={orphans.length ? "border-ember/40" : ""}>
          <p className="text-sm text-mist">Unused (stale)</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold">
            {assets ? orphans.length : "—"}
            {assets && !orphans.length && <CircleCheck className="h-6 w-6 text-volt" />}
          </p>
          {orphans.length > 0 ? (
            <button onClick={purge} disabled={busy === "purge"} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ember hover:underline">
              {busy === "purge" ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />} Purge unused files
            </button>
          ) : (
            <p className="mt-1 text-xs text-mist">Database and Cloudinary are in sync</p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "used", "orphan", "image", "video"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full border px-4 py-2 text-sm capitalize", filter === k ? "border-volt bg-volt font-semibold text-ink" : "border-line text-mist hover:text-bone")}>
              {k === "orphan" ? "Unused" : k === "used" ? "In use" : k === "all" ? "All" : `${k}s`}
            </button>
          ))}
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-mist hover:text-bone">
          <RefreshCw className={cn("h-4 w-4", !assets && "animate-spin")} /> Refresh
        </button>
      </div>

      <p className="flex items-center gap-2 text-xs text-mist">
        <ShieldCheck className="h-4 w-4 text-volt" /> Only files in the <code className="text-bone">soles-in-motion/</code> folder with the project tag are listed — other projects on this Cloudinary account are never touched.
      </p>

      {!assets ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          <AnimatePresence>
            {list.map((a) => (
              <motion.div key={a.publicId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={cn("group overflow-hidden rounded-2xl border bg-ink-2", a.usage ? "border-line" : "border-ember/50")}>
                <div className="relative aspect-square bg-ink-3">
                  <Image src={a.resourceType === "video" ? cldPoster(a.url, 400) : a.url} alt="" fill sizes="200px" className="object-cover" />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[9px] uppercase">
                    {a.resourceType === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />} {a.format}
                  </span>
                  {!a.usage && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ember px-2 py-0.5 text-[9px] font-bold text-ink">
                      <TriangleAlert className="h-3 w-3" /> Unused
                    </span>
                  )}
                  {!a.usage && (
                    <button onClick={() => remove(a)} disabled={busy === a.publicId} className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-xl bg-ink/90 py-1.5 text-xs text-ember opacity-0 transition-opacity hover:bg-ember hover:text-ink group-hover:opacity-100">
                      {busy === a.publicId ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />} Delete
                    </button>
                  )}
                </div>
                <div className="p-2.5">
                  {a.usage ? (
                    <Link href={LINK[a.usage.kind](a.usage.id)} className="line-clamp-1 text-xs font-semibold hover:text-volt">
                      {a.usage.label}
                    </Link>
                  ) : (
                    <p className="line-clamp-1 text-xs font-semibold text-ember">Not referenced</p>
                  )}
                  <p className="text-[10px] text-mist">
                    {a.usage ? `${a.usage.kind} · ${a.usage.field}` : formatDate(a.createdAt)} · {formatBytes(a.bytes)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
