"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Film, Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import MediaUploader, { useUploadSession } from "./MediaUploader";
import { Empty, Field, Modal, Spinner, Switch, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cldPoster } from "@/lib/cld";
import type { BannerT, Media } from "@/lib/types";

function BannerForm({ banner, onDone }: { banner?: BannerT; onDone: () => void }) {
  const router = useRouter();
  const session = useUploadSession();
  const [f, setF] = useState({
    placement: banner?.placement ?? "hero",
    eyebrow: banner?.eyebrow ?? "",
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    ctaLabel: banner?.ctaLabel ?? "Shop now",
    ctaHref: banner?.ctaHref ?? "/shop",
    order: String(banner?.order ?? 0),
    active: banner?.active ?? true,
    media: banner?.media ? [banner.media] : ([] as Media[]),
    poster: banner?.poster ? [banner.poster] : ([] as Media[]),
  });
  const [busy, setBusy] = useState(false);
  const isVideo = f.media[0]?.resourceType === "video";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.media.length) {
          toast.error("Upload an image or video for this banner");
          return;
        }
        setBusy(true);
        try {
          const payload = { ...f, order: Number(f.order) || 0, media: f.media[0] ?? null, poster: isVideo ? (f.poster[0] ?? null) : null };
          await api(banner ? `/api/admin/banners/${banner._id}` : "/api/admin/banners", { method: banner ? "PUT" : "POST", json: payload });
          session.commit([payload.media, payload.poster]);
          toast.success(banner ? "Banner updated" : "Banner created");
          router.refresh();
          onDone();
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <Field label="Placement">
        <select value={f.placement} onChange={(e) => setF({ ...f, placement: e.target.value as "hero" | "promo" })} className="field">
          <option value="hero">Home hero slider</option>
          <option value="promo">Promo section</option>
        </select>
      </Field>
      <Field label="Eyebrow">
        <input value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })} className="field" placeholder="SS26 — The Motion Collection" />
      </Field>
      <Field label="Headline" className="sm:col-span-2">
        <input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="field" />
      </Field>
      <Field label="Subtitle" className="sm:col-span-2">
        <textarea rows={2} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="field resize-none" />
      </Field>
      <Field label="Button label">
        <input value={f.ctaLabel} onChange={(e) => setF({ ...f, ctaLabel: e.target.value })} className="field" />
      </Field>
      <Field label="Button link">
        <input value={f.ctaHref} onChange={(e) => setF({ ...f, ctaHref: e.target.value })} className="field font-mono" />
      </Field>
      <div className="sm:col-span-2">
        <MediaUploader area="banners" accept="both" value={f.media} onChange={(v) => setF({ ...f, media: v })} session={session} label="Background media" hint="Video (MP4, ≤100 MB) or image (≤10 MB). Videos autoplay muted." />
      </div>
      {isVideo && (
        <div className="sm:col-span-2">
          <MediaUploader area="banners" accept="image" value={f.poster} onChange={(v) => setF({ ...f, poster: v })} session={session} label="Poster image (optional)" hint="Shown while the video loads. If empty, a frame from the video is used." />
        </div>
      )}
      <Field label="Order">
        <input type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} className="field" />
      </Field>
      <div className="flex items-center justify-between rounded-xl border border-line px-4">
        <span className="text-sm">Active</span>
        <Switch checked={f.active} onChange={(v) => setF({ ...f, active: v })} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="btn-ghost py-2.5">
          Cancel
        </button>
        <button disabled={busy} className="btn-volt py-2.5">
          {busy && <Spinner />} Save banner
        </button>
      </div>
    </form>
  );
}

export default function BannerManager({ banners }: { banners: BannerT[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<BannerT | "new" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const groups = [
    { key: "hero", title: "Hero slider", note: "Full-screen slides at the top of the home page" },
    { key: "promo", title: "Promo sections", note: "The first video promo expands on scroll; the first image promo becomes the flagship block" },
  ] as const;

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setEditing("new")} className="btn-volt py-2.5">
          <Plus className="h-4 w-4" /> New banner
        </button>
      </div>
      <div className="space-y-10">
        {groups.map((g) => {
          const list = banners.filter((b) => b.placement === g.key);
          return (
            <section key={g.key}>
              <h2 className="text-lg font-bold">{g.title}</h2>
              <p className="mb-4 text-sm text-mist">{g.note}</p>
              {list.length === 0 ? (
                <Empty icon={Presentation} title="No banners here yet" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((b, i) => (
                    <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-3xl border border-line bg-ink-2">
                      <div className="relative aspect-video bg-ink-3">
                        {b.media &&
                          (b.media.resourceType === "video" ? (
                            <video src={b.media.url} poster={cldPoster(b.media.url, 600)} muted loop playsInline autoPlay className="h-full w-full object-cover" />
                          ) : (
                            <Image src={b.media.url} alt="" fill sizes="400px" className="object-cover" />
                          ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                        <div className="absolute inset-x-4 bottom-3">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-volt">{b.eyebrow}</p>
                          <p className="display line-clamp-2 text-2xl">{b.title}</p>
                        </div>
                        {b.media?.resourceType === "video" && (
                          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[10px]">
                            <Film className="h-3 w-3" /> Video
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={b.active}
                            disabled={busy === b._id}
                            onChange={async (v) => {
                              setBusy(b._id);
                              try {
                                await api(`/api/admin/banners/${b._id}`, { method: "PATCH", json: { active: v } });
                                router.refresh();
                              } catch (err) {
                                toast.error((err as Error).message);
                              } finally {
                                setBusy(null);
                              }
                            }}
                          />
                          <span className="text-mist">{b.active ? "Active" : "Hidden"} · #{b.order}</span>
                        </div>
                        <div className="flex">
                          <button onClick={() => setEditing(b)} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-volt" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await confirm({ title: "Delete banner?", danger: true, confirmLabel: "Delete", body: <>“{b.title}” and its media will be permanently removed from the site and from Cloudinary.</> });
                              if (!ok) return;
                              setBusy(b._id);
                              try {
                                await api(`/api/admin/banners/${b._id}`, { method: "DELETE" });
                                toast.success("Banner deleted");
                                router.refresh();
                              } catch (err) {
                                toast.error((err as Error).message);
                              } finally {
                                setBusy(null);
                              }
                            }}
                            className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-ember"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New banner" : "Edit banner"} wide>
        {editing && <BannerForm banner={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
