import { connectDB } from "./db";
import { Banner, Category, Product } from "./models";
import { destroyAssets, type AssetRef } from "./cloudinary";
import type { Media } from "./types";

export interface MediaUsage {
  kind: "product" | "category" | "banner";
  id: string;
  label: string;
  field: string;
}

/** Builds a map of every Cloudinary publicId referenced anywhere in the database. */
export async function getMediaUsage(): Promise<Map<string, MediaUsage>> {
  await connectDB();
  const usage = new Map<string, MediaUsage>();
  const add = (m: Media | null | undefined, u: MediaUsage) => {
    if (m?.publicId) usage.set(m.publicId, u);
  };

  const [products, categories, banners] = await Promise.all([
    Product.find({}, { name: 1, images: 1, video: 1 }).lean(),
    Category.find({}, { name: 1, image: 1 }).lean(),
    Banner.find({}, { title: 1, media: 1, poster: 1 }).lean(),
  ]);

  for (const p of products) {
    const id = String(p._id);
    (p.images as Media[]).forEach((m, i) => add(m, { kind: "product", id, label: p.name, field: `image ${i + 1}` }));
    add(p.video as Media, { kind: "product", id, label: p.name, field: "video" });
  }
  for (const c of categories) add(c.image as Media, { kind: "category", id: String(c._id), label: c.name, field: "image" });
  for (const b of banners) {
    const id = String(b._id);
    add(b.media as Media, { kind: "banner", id, label: b.title, field: "media" });
    add(b.poster as Media, { kind: "banner", id, label: b.title, field: "poster" });
  }
  return usage;
}

/** Deletes assets from Cloudinary, skipping any that are still referenced by a document. */
export async function destroyIfUnreferenced(assets: AssetRef[]) {
  if (!assets.length) return { deleted: [] as string[], failed: [] as string[], skipped: [] as string[] };
  const usage = await getMediaUsage();
  const skipped = assets.filter((a) => usage.has(a.publicId)).map((a) => a.publicId);
  const result = await destroyAssets(assets.filter((a) => !usage.has(a.publicId)));
  return { ...result, skipped };
}

/** Media present in `before` but missing from `after` (compared by publicId). */
export function removedMedia(before: (Media | null | undefined)[], after: (Media | null | undefined)[]): AssetRef[] {
  const keep = new Set(after.filter(Boolean).map((m) => m!.publicId));
  return before.filter((m): m is Media => !!m?.publicId && !keep.has(m.publicId));
}
