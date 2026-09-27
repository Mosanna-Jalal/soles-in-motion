"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import MediaUploader, { useUploadSession } from "./MediaUploader";
import { Empty, Field, Modal, Spinner, Switch, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import type { CategoryT, Media } from "@/lib/types";

function CategoryForm({ category, onDone }: { category?: CategoryT; onDone: () => void }) {
  const router = useRouter();
  const session = useUploadSession();
  const [f, setF] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    tagline: category?.tagline ?? "",
    description: category?.description ?? "",
    order: String(category?.order ?? 0),
    featured: category?.featured ?? true,
    image: category?.image ? [category.image] : ([] as Media[]),
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const payload = { ...f, order: Number(f.order) || 0, image: f.image[0] ?? null, slug: f.slug || undefined };
          const res = await api<{ mediaDeleted?: number }>(category ? `/api/admin/categories/${category._id}` : "/api/admin/categories", { method: category ? "PUT" : "POST", json: payload });
          session.commit([payload.image]);
          toast.success(category ? "Category updated" : "Category created", res.mediaDeleted ? { description: "Old image deleted from Cloudinary" } : undefined);
          router.refresh();
          onDone();
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <Field label="Name">
        <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="field" />
      </Field>
      <Field label="Slug" hint="Leave blank to generate">
        <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="field font-mono" />
      </Field>
      <Field label="Tagline" className="sm:col-span-2">
        <input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} className="field" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field resize-none" />
      </Field>
      <div className="sm:col-span-2">
        <MediaUploader area="categories" value={f.image} onChange={(v) => setF({ ...f, image: v })} session={session} label="Cover image" />
      </div>
      <Field label="Sort order">
        <input type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} className="field" />
      </Field>
      <div className="flex items-center justify-between rounded-xl border border-line px-4">
        <span className="text-sm">Show on home page</span>
        <Switch checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="btn-ghost py-2.5">
          Cancel
        </button>
        <button disabled={busy} className="btn-volt py-2.5">
          {busy && <Spinner />} Save
        </button>
      </div>
    </form>
  );
}

export default function CategoryManager({ categories }: { categories: CategoryT[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<CategoryT | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setEditing("new")} className="btn-volt py-2.5">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>
      {categories.length === 0 ? (
        <Empty icon={FolderTree} title="No categories yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group overflow-hidden rounded-3xl border border-line bg-ink-2">
              <div className="relative aspect-[16/10] bg-ink-3">
                {c.image?.url && <Image src={c.image.url} alt="" fill sizes="320px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[10px]">#{c.order}</span>
                {!c.featured && <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-mist">Hidden on home</span>}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="text-xs text-mist">
                    {c.productCount ?? 0} products · /{c.slug}
                  </p>
                </div>
                <div className="flex">
                  <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-volt" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    disabled={deleting === c._id}
                    onClick={async () => {
                      const ok = await confirm({ title: "Delete category?", danger: true, confirmLabel: "Delete", body: <>“{c.name}” and its cover image (on Cloudinary) will be permanently deleted. Categories that still contain products can&apos;t be deleted.</> });
                      if (!ok) return;
                      setDeleting(c._id);
                      try {
                        await api(`/api/admin/categories/${c._id}`, { method: "DELETE" });
                        toast.success("Category deleted");
                        router.refresh();
                      } catch (err) {
                        toast.error((err as Error).message);
                      } finally {
                        setDeleting(null);
                      }
                    }}
                    className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-ember"
                    aria-label="Delete"
                  >
                    {deleting === c._id ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"} wide>
        {editing && <CategoryForm category={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
